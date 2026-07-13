  import http from "http";
  import express from "express";
  import "./config.js";
  import { setupSocket } from "./socket.js";
 

  const app = express(); //  attach express
  const server = http.createServer(app); // use SAME server

  setupSocket(server).catch((err) => {
  console.error("Failed to set up socket server:", err);
  process.exit(1);
});

  const PORT = process.env.PORT || 3002; // Render provides PORT

  server.listen(PORT, () => {
    console.log(` WS Server running on port ${PORT}`);
  });

  app.get("/ping", (_req, res) => {
  res.status(200).send("pong");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});



