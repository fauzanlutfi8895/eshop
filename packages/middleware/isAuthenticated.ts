import prisma from "@packages/libs/prisma";
import { Response, NextFunction } from "express";
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies["access_token"] ||
      req.cookies["seller-access-token"] ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized! Token missing.",
      });
    }

    // verify token
    let decoded: { id: string; role: "user" | "seller" };
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return res.status(401).json({ message: "Unauthorized! Token expired." });
      }
      if (err instanceof JsonWebTokenError) {
        return res.status(401).json({ message: "Unauthorized! Invalid token." });
      }
      throw err; // biar error lain tidak disamaratakan
    }

    // cek database
    let account;
    if (decoded.role === "user") {
      account = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      req.user = account;
    } else if (decoded.role === "seller") {
      account = await prisma.seller.findUnique({
        where: { id: decoded.id },
        include: { shop: true },
      });
      req.seller = account;
    }

    if (!account) {
      return res.status(401).json({ message: "Unauthorized! Account not found." });
    }

    req.role = decoded.role;
    return next();

  } catch (error: any) {
    console.error("Auth middleware error:", error); // penting buat trace
    return res.status(500).json({
      message: "Internal Server Error in isAuthenticated",
      detail: error.message,
    });
  }
};

export default isAuthenticated;
