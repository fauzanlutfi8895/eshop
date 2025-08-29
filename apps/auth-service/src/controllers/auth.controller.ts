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
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken)
      return next(new ValidationError("Unauthorized! No refresh token."));

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string; role: string };

    if (!decoded || !decoded.id || !decoded.role) {
      return next(new JsonWebTokenError("Forbidden! Invalid refresh token."));
    }

    // let account;
    // if(decoded.role === "user")
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return next(new AuthError("Forbidden! User/Seller not found"));
    }

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    setCookie(res, "access_token", newAccessToken);
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
