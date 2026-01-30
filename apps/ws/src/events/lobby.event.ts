import { redis } from "../services/redis.service.js";
import type { JoinRoomPayload } from "../types/socket.types.js";
import { joinRoom } from "../services/room.service.js";

export function lobbyEvents(io: any, socket: any) {
  socket.on("room:join", async ({ roomId, player } : JoinRoomPayload) => {
    socket.join(roomId);
    console.log("joined the room")

    const players = await joinRoom(roomId, player, socket.id);

    io.to(roomId).emit("room:players", players);
  });
}
