import { redis } from "./redis.service.js";

export async function startGame(roomId: string) {
  const question = {
    id: "q1",
    text: "What is 2+2?",
    options: ["2", "3", "4", "5"],
    correct: "4",
  };

  await redis.set(`room:${roomId}:currentQuestion`, JSON.stringify(question));
  await redis.set(`room:${roomId}:timer`, Date.now() + 15000);

  return question;
}


export async function submitAnswer({ roomId, userId, answer, timeTaken }: any) {
  const questionStr = await redis.get(`room:${roomId}:currentQuestion`);

  if (!questionStr) {
    throw new Error("Game state missing. Question not found in Redis.");
  }

  const question = JSON.parse(questionStr);

  const correct = question.correct === answer;
  const points = correct ? 10 : -5;

  await redis.hincrby(`room:${roomId}:scores`, userId, points);

  await redis.hset(
    `room:${roomId}:answers`,
    userId,
    JSON.stringify({ answer, correct, timeTaken }),
  );

  return await redis.hgetall(`room:${roomId}:scores`);
}


export async function nextQuestion ({roomId, userId, answer, timeTaken}:any){
    return "hello bhidu kaise ho tum log"

}