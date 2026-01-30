import http from "http";
 import "./config.js"
import { setupSocket } from "./socket.js";

const server = http.createServer();

setupSocket(server);

server.listen(3002, () => {
  console.log("🚀 WS Server running on port 3002");
});
