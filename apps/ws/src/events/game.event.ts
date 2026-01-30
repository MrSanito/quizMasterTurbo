import {
  startGame,
  submitAnswer,
  nextQuestion,
} from "../services/game.service.js";

export function gameEvents(io: any, socket: any) {
  socket.on("game:start", async ({ roomId }:any) => {
    const question = await startGame(roomId );
    io.to(roomId).emit("game:question", question);
  });

  socket.on("game:answer", async (data : any) => {
    const scores = await submitAnswer(data);
    io.to(data.roomId).emit("game:scoreUpdate", scores);
  });

  socket.on("game:next", async ({ roomId }:any) => {
    const question = await nextQuestion(roomId);
    io.to(roomId).emit("game:question", question);
  });
}
