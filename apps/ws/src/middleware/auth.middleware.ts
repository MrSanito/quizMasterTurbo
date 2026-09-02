import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import { redis } from "../services/redis.service.js";

export const authMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    // 1. Check for single-use ticket first (Gold Standard)
    const ticket =
      socket.handshake.auth?.ticket ||
      (typeof socket.handshake.query?.ticket === "string"
        ? socket.handshake.query.ticket
        : undefined);

    if (ticket) {
      // Atomically retrieve and delete ticket (single-use redemption)
      let ticketData: string | null = null;
      if (typeof redis.getdel === "function") {
        ticketData = await redis.getdel(`ws-ticket:${ticket}`);
      } else {
        ticketData = await redis.get(`ws-ticket:${ticket}`);
        if (ticketData) {
          await redis.del(`ws-ticket:${ticket}`);
        }
      }

      if (!ticketData) {
        return next(new Error("Invalid or expired authentication ticket"));
      }

      const decoded = JSON.parse(ticketData) as {
        userId: string;
        sessionId: string;
      };

      // Check if session is blacklisted
      if (decoded.sessionId) {
        const isBlacklisted = await redis.get(`blacklist:${decoded.sessionId}`);
        if (isBlacklisted) {
          return next(new Error("Token has been revoked"));
        }
      }

      socket.data.user = decoded;
      return next();
    }

    // 2. Fallback to direct token
    let token: string | undefined =
      socket.handshake.auth?.token ||
      (typeof socket.handshake.headers?.authorization === "string"
        ? socket.handshake.headers.authorization
        : undefined);

    if (token?.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    if (!token && socket.handshake.headers?.cookie) {
      try {
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
      } catch (cookieErr) {
        console.warn("Failed to parse handshake cookie:", cookieErr);
      }
    }

    if (!token) {
      return next(new Error("Authentication ticket or token required"));
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not configured");
      return next(new Error("Server authentication configuration error"));
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      sessionId: string;
    };

    const isBlacklisted = await redis.get(
      `blacklist:${decoded.sessionId}`
    );

    if (isBlacklisted) {
      return next(new Error("Token has been revoked"));
    }

    socket.data.user = decoded;
    return next();
  } catch (err: any) {
    return next(
      new Error(
        "Unauthorized: " + (err.message || "Invalid or expired credentials")
      )
    );
  }
};