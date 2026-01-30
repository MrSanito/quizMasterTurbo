import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
 import { registerConnection } from "./handler/connction.js";
import http from "http";

export function setupSocket(server: http.Server) {
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

  instrument(io, { auth: false });

  io.on("connection", (socket) => registerConnection(io, socket));
}
