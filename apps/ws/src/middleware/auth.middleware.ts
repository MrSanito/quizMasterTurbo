import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";

import { redis } from "../services/redis.service.js";

export const authMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    // 1. Get token
    let token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    // Remove "Bearer "
    if (token?.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    // 2. Fallback to cookie
    if (!token && socket.handshake.headers?.cookie) {
      const cookies = Object.fromEntries(
        socket.handshake.headers.cookie
          .split(";")
          .map((c) => c.trim().split("="))
          .map(([key, ...value]) => [
            key,
            decodeURIComponent(value.join("=")),
          ])
      );

      token = cookies.accessToken;
    }

    // 3. Make sure token exists
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // 4. Get secret
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not configured");
      return next(new Error("Server authentication configuration error"));
    }

    // 5. Verify JWT
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      sessionId: string;
    };

    // 6. Check Redis blacklist
    const isBlacklisted = await redis.get(
      `blacklist:${decoded.sessionId}`
    );

    if (isBlacklisted) {
      return next(new Error("Token has been revoked"));
    }

    // 7. Attach user to socket
    socket.data.user = decoded;

    // 8. Continue
    next();
  } catch (err: any) {
    next(
      new Error(
        "Unauthorized: " + (err.message || "Invalid or expired token")
      )
    );
  }
};