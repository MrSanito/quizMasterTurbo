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
  console.log("User connected:", socket.id);

  socket.on("message", (msg) => {
    io.emit("message", msg); // send to everyone
  });

  socket.on("disconnect", () => {
    console.log("User left");
  });
});

server.listen(3003);
