
import {
  joinGame,
  startGameLoop,
  submitAnswer
} from "../services/game.service.js";
import type { JoinRoomPayload } from "../types/socket.types.js";

export function gameEvents(io: any, socket: any) {
    
  // 1. JOIN GAME (Reconnect or New)
  socket.on("game:join", async ({ roomId, player }: JoinRoomPayload) => {
    socket.join(roomId);
    
    // Store user info on socket for later use
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;

    // Sync state (get current question if playing)
    const state = await joinGame(roomId, player.id, { name: player.name, avatar: player.avatar || "avatar1.svg" });
    
    // Emit private sync event
    socket.emit("game:sync", state);
  });

  // 2. START GAME (Host triggers)
  socket.on("game:start", async ({ roomId }: any) => {
    // Ideally verify host here or via API
    await startGameLoop(roomId, io);
  });

  // 3. SUBMIT ANSWER
  socket.on("game:submitAnswer", async (data: { roomId: string; answer: string; timeTaken: number }) => {
    const pId = socket.data.playerId; 
    
    try {
        const result = await submitAnswer(io, { 
            roomId: data.roomId, 
            userId: pId, 
            answer: data.answer, 
            timeTaken: data.timeTaken 
        });

        if (result.error) {
             socket.emit("error", { message: result.error });
             return;
        }

        // Emit result to THIS user
        socket.emit("game:answerResult", result);

        // Notify OTHERS that user answered (for avatars jump)
        socket.to(data.roomId).emit("game:playerAnswered", { userId: pId });

    } catch (e: any) {
        console.error(e);
        socket.emit("error", { message: e.message });
    }
  });
}
