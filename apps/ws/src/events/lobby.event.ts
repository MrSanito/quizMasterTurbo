import { redis } from "../services/redis.service.js";
import type { JoinRoomPayload } from "../types/socket.types.js";
import { joinRoom, leaveRoom } from "../services/room.service.js";

export function lobbyEvents(io: any, socket: any) {
  socket.on("room:join", async ({ roomId, player }: JoinRoomPayload) => {
    // 🔥 SAVE DATA ON SOCKET
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;

    console.log("player", player);
    socket.join(roomId);
    console.log("joined the room");

    const players = await joinRoom(roomId, player, socket.id);
    console.log("all players", players);

    io.to(roomId).emit("room:players", players);
  });
  socket.on("room:leave", async ({ roomId, player } : JoinRoomPayload) => {
    console.log("player", player)
    socket.leave(roomId);
    console.log("Left the room")

    const players = await leaveRoom(roomId, player, socket.id);
    console.log("all players", players)

    io.to(roomId).emit("room:players", players);
  });

  socket.on("room:letsstart", ({roomId} : any) => {
    const response = {
      success: true, 
      message : "i am from ws and room will be started"
      
    }
    io.to(roomId).emit("room:startingRoom", response)
  })
}
