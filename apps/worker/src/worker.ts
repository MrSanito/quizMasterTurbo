
import { Worker } from 'bullmq';
import { prisma } from '@repo/db';
import { redisClient } from '@repo/redis';

import { Redis } from "ioredis";
console.log("here is the env variables",process.env.REDIS_URL,process.env.REDIS_PASSWORD,process.env.REDIS_HOST,process.env.REDIS_PORT)

// Create Redis instance
const connection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { 
      maxRetriesPerRequest: null, 
      enableReadyCheck: false,
      family: 4 
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, 
      enableReadyCheck: false,
      family: 4
    });

export const worker = new Worker('game-events', async (job) => {
    console.log(` Worker received job: ${job.name} (ID: ${job.id})`);

    if (job.name === 'game-finished') {
        const { roomId } = job.data;
        if (!roomId) {
            console.error(" Job missing roomId");
            return;
        }

        console.log(` Processing game finished for room ${roomId}`);
        const roomKey = `room:${roomId}`;

        try {
            // 1. Get Final Scores from Redis
            const scores = await redisClient.hgetall(`${roomKey}:scores`);

            // Fetch Room Data (Need ID)
            const room = await prisma.room.findFirst({ 
                where: { OR: [{ roomName: roomId }, { id: roomId }] },
                include: { questions: { orderBy: { questionOrder: 'asc' } } }
            });
            
            if (!room) {
                console.error(` Room ${roomId} not found in DB`);
                throw new Error("Room not found");
            }

            // 2. Update Player Scores in DB
            const updates = Object.entries(scores).map(async ([userId, score]) => {
                // Determine if score is valid number
                const finalScore = parseInt(score);
                if (isNaN(finalScore)) return;

                await prisma.roomPlayer.updateMany({
                    where: { roomId: room.id, userId },
                    data: { score: finalScore },
                });
            });
            await Promise.all(updates);
            
            // 3.  SAVE PLAYER ANSWERS
            const roomQuestions = room.questions;
            const playerAnswersToCreate: any[] = [];
            
            // FETCH Questions separately to map options
            // (Optimize: fetch only what's needed)
            const questionIds = roomQuestions.map(rq => rq.questionId);
            const questionsData = await prisma.question.findMany({
                where: { id: { in: questionIds } },
                include: { Option: true }
            });
            
            const questionMap = new Map(questionsData.map(q => [q.id, q]));

            for (const [index, rq] of roomQuestions.entries()) {
                 const answersKey = `${roomKey}:answers:${index}`;
                 console.log(` [Worker] Fetching answers from key: ${answersKey}`);
                 
                 const answersMetaMap = await redisClient.hgetall(`${roomKey}:answers_meta:${index}`);
                 const answersMap = await redisClient.hgetall(answersKey);
                 const fullQuestion = questionMap.get(rq.questionId);
                 
                 console.log(` processing question ${rq.questionId} (index ${index}). Found ${Object.keys(answersMap).length} answers.`);

                 if (!fullQuestion) {
                    console.warn(` Question ${rq.questionId} not found in DB map. Skipping.`);
                    continue;
                 }
                 
                 for (const [userId, selectedValue] of Object.entries(answersMap)) {
                     // Get Time Taken
                     const timeTaken = parseInt(answersMetaMap[userId] || "0");

                     // Check if value matches ID or Text
                     // Normalize comparison (trim, etc if needed)
                     const selectedOption = fullQuestion.Option.find(o => o.id === selectedValue || o.text === selectedValue);
                     const correctOption = fullQuestion.Option.find(o => o.isCorrect);
                     
                     if (!selectedOption) {
                        console.warn(` User ${userId} answer '${selectedValue}' did not match any option for Q ${rq.questionId}. Options: ${fullQuestion.Option.map(o => o.text).join(', ')}`);
                     }

                     // If matched strict ID/Text, use that. If not, use the raw value as fallback (might be "TIMEOUT")
                     const validSelectedOptionId = selectedOption ? selectedOption.id : String(selectedValue);
                     
                     console.log(` [Worker] User ${userId} Answer: '${selectedValue}' -> Saved as: '${validSelectedOptionId}'`);

                     const isCorrect = selectedOption ? selectedOption.isCorrect : (selectedValue === correctOption?.text); 
                     
                     playerAnswersToCreate.push({
                         roomId: room.id,
                         roomQuestionId: rq.id,
                         userId,
                         selectedOptionId: validSelectedOptionId,
                         isCorrect,
                         pointsEarned: isCorrect ? 4 : -1,
                         responseTimeMs: timeTaken 
                     });
                 }
            }
            
            console.log(` [Worker] Total answers to create: ${playerAnswersToCreate.length}`);
            
            if (playerAnswersToCreate.length > 0) {
                await prisma.playerAnswer.createMany({
                    data: playerAnswersToCreate,
                    skipDuplicates: true
                });
                console.log(` Saved ${playerAnswersToCreate.length} player answers to DB`);
            }


            // 4. Mark Room as Finished
            await prisma.room.update({
                where: { id: room.id },
                data: { state: "FINISHED", endedAt: new Date() },
            });

            // 5. Cleanup Redis (expire in 1 hour)
            await redisClient.expire(`${roomKey}:state`, 3600);
            await redisClient.expire(`${roomKey}:questions`, 3600);
            await redisClient.expire(`${roomKey}:scores`, 3600);
            
            const answerKeys = await redisClient.keys(`${roomKey}:answers:*`);
            for(const k of answerKeys) {
                await redisClient.expire(k, 3600);
            }
            
            //  UNLOCK
            await redisClient.del(`${roomKey}:loop_lock`);

            console.log(` Game ${roomId} finalized successfully by worker!`);
        } catch (error) {
            console.error(` Error processing game ${roomId}:`, error);
            throw error; // Let BullMQ handle retries
        }
    }
}, { connection });

worker.on('ready', () => {
    console.log(" Worker is ready and connected to Redis.");
});

worker.on('error', (err) => {
    console.error(" Worker Error:", err);
});
