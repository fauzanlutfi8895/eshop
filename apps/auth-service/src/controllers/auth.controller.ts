import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import {
  checkOtpRestriction,
  handleForgotPassword,
  sendOtp,
  trackOtpRequest,
  validateRegistrationData,
  verifyForgotPasswordOtp,
  verifyOtp,
} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { AuthError, ValidationError } from "@packages/error-handler";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookie";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Register a new user
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user");
    const { name, email } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return next(new ValidationError("User already exist with this email!"));
    }

    await checkOtpRestriction(email, next);
    await trackOtpRequest(email, next);
    await sendOtp(name, email, "user-activation-mail");

    res.status(200).json({
      message: "OTP sent to email. Please verify your account",
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError("All fields are required!"));
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return next(new ValidationError("User already exist with this email!"));
    }

    await verifyOtp(email, otp);

    const hashPassword = await bcrypt.hash(password, 10);

    //Todo: Nama & Password beda masih bisa
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and Password are required"));
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return next(new AuthError("User doesn't exists!"));
    }

    //Verify password
    const isMatch = await bcrypt.compare(password, user.password!);

    if (!isMatch) {
      return next(new AuthError("Invalid email or password!"));
    }

    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");

    //Generate access and refresh token
    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    );

    //Store the refresh and access token in an httpOnly secure cookie
    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);

    res.status(200).json({
      message: "Login successful!",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: any,
  next: NextFunction
) => {
  try {
    const refreshToken =
      req.cookies["refresh_token"] ||
      req.cookies["seller-refresh-token"] ||
      req.cookies["refresh_token_admin"] ||
      req.headers.authorization?.split(" ")[1];

    if (!refreshToken)
      return next(new ValidationError("Unauthorized! No refresh token."));

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string; role: string };

    if (!decoded || !decoded.id || !decoded.role) {
      return next(new JsonWebTokenError("Forbidden! Invalid refresh token."));
    }

    let account;
    if (decoded.role === "user") {
      account = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
      });
    } else if (decoded.role === "admin") {
      account = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
      });
    } else if (decoded.role === "seller") {
      account = await prisma.seller.findUnique({
        where: {
          id: decoded.id,
        },
        include: {
          shop: true,
        },
      });
    }

    if (!account) {
      return next(new AuthError("Forbidden! User/Seler not found"));
    }

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    if (decoded.role === "user") {
      setCookie(res, "access_token", newAccessToken);
    } else if (decoded.role === "admin") {
      setCookie(res, "seller-access-token", newAccessToken);
    } else if (decoded.role === "seller") {
      setCookie(res, "access_token_admin", newAccessToken);
    }

    return res.status(201).json({
      success: true,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, "user");
};

export const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyForgotPasswordOtp(req, res, next);
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return next(new ValidationError("Email and new password are required!"));

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw next(new ValidationError("User not found!"));

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);

    if (isSamePassword)
      return next(
        new ValidationError(
          "New password can't be the same as the old password"
        )
      );

    //Hash the new password
    const hashPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashPassword,
      },
    });

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "seller");
    const { name, email } = req.body;

    const existingSeller = await prisma.seller.findUnique({
      where: {
        email,
      },
    });

    if (existingSeller) {
      return next(new ValidationError("Seller already exist with this email!"));
    }

    await checkOtpRestriction(email, next);
    await trackOtpRequest(email, next);
    await sendOtp(name, email, "seller-activation-mail");

    res.status(200).json({
      message: "OTP sent to email. Please verify your account",
    });
  } catch (error) {
    next(error);
  }
};

export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name, phone_number, country } = req.body;

    if (!email || !otp || !password || !name || !phone_number || !country) {
      return next(new ValidationError("All fields are required!"));
    }

    const existingUser = await prisma.seller.findUnique({ where: { email } });

    if (existingUser)
      return next(new ValidationError("Seller already exist with this email"));

    await verifyOtp(email, otp);
    const hashPassword = await bcrypt.hash(password, 10);

    const seller = await prisma.seller.create({
      data: {
        name,
        email,
        password: hashPassword,
        country,
        phone_number,
      },
    });

    res.status(201).json({
      seller,
      message: "Seller registered successfully!",
    });
  } catch (error) {}
};

//create a new shop
export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, bio, address, opening_hours, website, category, sellerId } =
      req.body;

    if (
      !name ||
      !bio ||
      !address ||
      !opening_hours ||
      !website ||
      !category ||
      !sellerId
    ) {
      return next(new ValidationError("All fields are required!"));
    }

    //akan membuat objek shorthand otomatis, "name": "Toko Keren" dari req.body
    const shopData = {
      name,
      bio,
      address,
      opening_hours,
      website,
      category,
      sellerId,
    };

    if (website && website.trim() !== "") {
      shopData.website = website;
    }

    const shop = await prisma.shop.create({
      data: shopData,
    });
    res.status(201).json({
      success: true,
      shop,
    });
  } catch (error) {
    next(error);
  }
};

//create stripe connect account link
export const createStripeConnectLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) return next(new ValidationError("Seller ID is required"));

    const seller = await prisma.seller.findUnique({
      where: {
        id: sellerId,
      },
    });

    if (!seller)
      return next(new ValidationError("Seller is not available with this id"));

    const account = await stripe.accounts.create({
      type: "express",
      email: seller?.email,
      country: "GB",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.seller.update({
      where: {
        id: sellerId,
      },
      data: {
        stripeId: account.id,
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `http://localhost/3000/success`,
      return_url: `http://localhost/3000/success`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    next(error);
  }
};

//login seller
export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and password required!"));
    }

    const seller = await prisma.seller.findUnique({
      where: {
        email,
      },
    });

    if (!seller) return next(new ValidationError("Invalid email or password!"));

    const isMatch = bcrypt.compare(password, seller.password!);

    if (!isMatch)
      return next(new ValidationError("Invalid email or password!"));

    res.clearCookie("access-token");
    res.clearCookie("refresh-token");

    const accessToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );
    const refreshToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    //store refresh token and access token with new name token (supaya bisa login bersamaan user dan seller jika 1 akun)
    setCookie(res, "seller-refresh-token", refreshToken);
    setCookie(res, "seller-access-token", accessToken);

    res.status(200).json({
      message: "Login successful!",
      seller: { id: seller.id, email: seller.email, name: seller.name },
    });
  } catch (error) {
    next(error);
  }
};

export const loginAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and password are required"));
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return next(new AuthError("User doesn't exist"));
    }

    const isMatch = await bcrypt.compare(password, user?.password!);
    if (!isMatch) {
      return next(new AuthError("Invalid email or password"));
    }

    const isAdmin = user.role === "admin";

    // if (!isAdmin) {
    //   sendLog({
    //     type: "error",
    //     message: `Admin login failed for ${email} - not an admin`,
    //     source: "auth-service",
    //   });
    //   return next(new AuthError("Invalid access!"));
    // }

    // sendLog({
    //   type: "success",
    //   message: `Admin login successfully: ${email}`,
    //   source: "auth-service",
    // });

    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");

    //generate access and refresh
    const accessToken = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    setCookie(res, "access_token_admin", accessToken);
    setCookie(res, "refresh_token_admin", refreshToken);

    res.status(200).json({
      message: "Login successfully",
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const admin = req.admin;
    res.status(201).json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

//get logged in seller
export const getSeller = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const seller = req.seller;
    res.status(201).json({
      success: true,
      seller,
    });
  } catch (error) {
    next(error);
  }
};

//Logout User
export const logOutUser = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(201).json({
    success: true,
  });
};

export const updatePassword = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new ValidationError("All fields is required"));
    }

    if (newPassword !== confirmPassword) {
      return next(new ValidationError("New Password do not match"));
    }

    if (currentPassword === newPassword) {
      return next(
        new ValidationError("New password cannot match with current password")
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.password) {
      return next(new AuthError("User not found or password not set"));
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password!
    );

    if (!isPasswordCorrect) {
      return next(new AuthError("Current password is incorrect"));
    }

    const hashPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashPassword,
      },
    });

    res.status(200).json({
      message: "Password update successfully",
    });
  } catch (error) {
    next(error);
  }
};
