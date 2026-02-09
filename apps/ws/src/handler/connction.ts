import { lobbyEvents } from "../events/lobby.event.js";
import { gameEvents } from "../events/game.event.js";
import { handleDisconnect } from "./disconnect.js";

export function registerConnection(io: any, socket: any) {
  console.log("✅ Connected:", socket.id);

  lobbyEvents(io, socket);
  gameEvents(io, socket);
  socket.on("set_location", (loc :any) => {
    socket.data.location = loc; // Attach custom data to the socket
    console.log("location has been set")
  });

  socket.on("disconnect", () => handleDisconnect(io,socket));
}
