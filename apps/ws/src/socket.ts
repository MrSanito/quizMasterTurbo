import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { registerConnection } from "./handler/connction.js";
import http from "http";

export function setupSocket(server: http.Server) {
  const io = new Server(server, {
    path: "/socket.io/", // 🔥 prevents path mismatch

    cors: {
      origin: [
        "https://admin.socket.io",
        "http://localhost:3000",
        "https://quiz-master-turbo-quiz-master.vercel.app",
      ],
      methods: ["GET", "POST"], // 🔥 required for handshake
      credentials: true,
    },

    transports: ["websocket", "polling"], // 🔥 Render sleep fix
    allowUpgrades: true,
    pingTimeout: 60000, // 🔥 stop random drops
    pingInterval: 25000,
  });

  instrument(io, { auth: false });

  io.on("connection", (socket) => registerConnection(io, socket));
}
