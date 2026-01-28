import { config } from "dotenv";
import path from "path";

// Load .env from workspace root
config({ path: path.resolve(process.cwd(), "../../.env") });

import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const { redisClient: redis } = await import("@repo/redis");

await redis.set("ping", "pong");

const value = await redis.get("ping");
console.log(value);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://admin.socket.io",
      "http://localhost:3000",
      "https://quiz-master-turbo-quiz-master.vercel.app",
    ],
    credentials: true,
  },
});
// 👇 THIS IS THE IMPORTANT PART
instrument(io, {
  auth: false,
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);
  socket.on("join-room", async ({ roomId, player }) => {
    socket.join(roomId);

    console.log(roomId, player);

    await redis.sadd(`room:${roomId}:players`, player.id, player.name);
    await redis.hset(`room:${roomId}:scores`, player.id, 0);

    const players = await redis.smembers(`room:${roomId}:players`);

    io.to(roomId).emit("room:players", players);
  });

  socket.on("message", (msg) => {
    console.log("📩 Message received:", msg);
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(3002, () => {
  console.log("🚀 Server running on http://localhost:3002");
});
