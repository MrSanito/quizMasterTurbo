// middleware/auth.middleware.ts
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import  redis  from "@repo/redis";


export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ success: "false", message: "Unauthorized" });
  }
  // ✅ check if token is blacklisted (logged out)
  const isBlacklisted = await redis.get(`blacklist:${token}`);
  if (isBlacklisted) {
    return res
      .status(401)
      .json({ success: "false", message: "Token has been revoked" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
      userId: string;
      sessionId: string;
    };
    console.log(decoded)
    req.user = decoded;
    next();
  } catch {
    return res
      .status(401)
      .json({ success: "false", message: "Invalid or expired access token" });
  }
};;
