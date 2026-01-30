import { removePlayerBySocket } from "../services/room.service.js";

export async function handleDisconnect(socket: any) {
  console.log("❌ Disconnected:", socket.id);
  await removePlayerBySocket(socket.id);
}
