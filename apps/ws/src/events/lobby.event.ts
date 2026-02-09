import { redis } from "../services/redis.service.js";
import type { JoinRoomPayload } from "../types/socket.types.js";
import { joinLobby, leaveLobby } from "../services/lobby.service.js";
import { startGameLoop } from "../services/game.service.js";

export function lobbyEvents(io: any, socket: any) {
  socket.on("lobby:join", async ({ roomId, player }: JoinRoomPayload) => {
    console.log("join request come");
    // 🔥 SAVE DATA ON SOCKET
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;

    console.log("player", player);
    socket.join(roomId);
    console.log("joined the room");

    const players = await joinLobby(roomId, player, socket.id);
    console.log("all players", players);

    io.to(roomId).emit("lobby:players", players);
  });
  socket.on("lobby:leave", async ({ roomId, player }: JoinRoomPayload) => {
    console.log("player", player);
    socket.leave(roomId);
    console.log("Left the room");

    const players = await leaveLobby(roomId, player, socket.id);
    console.log("all players", players);

    io.to(roomId).emit("lobby:players", players);
  });

  socket.on("lobby:letsstart", async ({ roomId }: any) => {
    console.log(`🚀 Host triggered start for room ${roomId}`);
    
    // 1. Notify everyone to redirect
    const response = {
      success: true,
      message: "i am from ws and room will be started",
    };
    io.to(roomId).emit("lobby:startingRoom", response);
    
    // 2. Start the Game Loop (Countdown -> Questions)
    await startGameLoop(roomId, io);
  });
}
