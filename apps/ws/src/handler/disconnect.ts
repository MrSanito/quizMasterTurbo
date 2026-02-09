import { leaveLobby, removePlayerBySocket } from "../services/lobby.service.js";

export async function handleDisconnect(io: any, socket: any) {
  console.log("❌ Disconnected:", socket.id);

  const roomId = socket.data.roomId;
  const playerId = socket.data.playerId;
  const page = socket.data.location;

  console.log("roomId", roomId, "playerId", playerId, "page", page);

  if (!roomId || !playerId) return;
  let players;
    if (socket.data.location === "lobby") {
  players = await leaveLobby(roomId, playerId, socket.id);
    } else if (socket.data.location === "room") {
      // handleRoomLeave(socket);
    }

  console.log("i am on disconnect handler and sending all players")

  io.to(roomId).emit("lobby:players", players);
}
