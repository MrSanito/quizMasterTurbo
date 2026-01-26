import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://admin.socket.io",
    credentials: true,
  },
});
// 👇 THIS IS THE IMPORTANT PART
instrument(io, {
  auth: false,
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);
  socket.on ("join-room", async ( {roomId, player}) => {
        socket.join(roomId);
console.log(roomId, player)
  })

  socket.on("message", (msg) => {
    console.log("📩 Message received:", msg);
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});


server.listen(3003, () => {
  console.log("🚀 Server running on http://localhost:3003");
});