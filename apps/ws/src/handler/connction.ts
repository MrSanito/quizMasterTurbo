import { lobbyEvents } from "../events/lobby.event.js";
import { gameEvents } from "../events/game.event.js";
import { handleDisconnect } from "./disconnect.js";

export function registerConnection(io: any, socket: any) {
  console.log("✅ Connected:", socket.id);

  lobbyEvents(io, socket);
  gameEvents(io, socket);

  socket.on("disconnect", () => handleDisconnect(io,socket));
}
