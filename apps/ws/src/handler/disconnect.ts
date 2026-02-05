import { leaveRoom, removePlayerBySocket } from "../services/room.service.js";

export async function handleDisconnect(io:any ,socket: any) {
  console.log("❌ Disconnected:", socket.id);

  const roomId = socket.data.roomId;
  const playerId = socket.data.playerId;
  console.log("roomId", roomId, "playerId", playerId)

  if (!roomId || !playerId) return;

  const players = await leaveRoom(roomId, playerId, socket.id);

  io.to(roomId).emit("room:players", players);
 
}
