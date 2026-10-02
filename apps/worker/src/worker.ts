import "dotenv/config";
import { prisma } from "@repo/db";
import { redisClient } from "@repo/redis";
import { Worker } from "bullmq";
import { Redis } from "ioredis";

// Create Redis instance for BullMQ worker
const connection = process.env.REDIS_URL
	? new Redis(process.env.REDIS_URL, {
			maxRetriesPerRequest: null,
			enableReadyCheck: false,
			family: 4,
		})
	: new Redis({
			host: process.env.REDIS_HOST || "localhost",
			port: parseInt(process.env.REDIS_PORT || "6379", 10),
			password: process.env.REDIS_PASSWORD || undefined,
			maxRetriesPerRequest: null,
			enableReadyCheck: false,
			family: 4,
		});

export const worker = new Worker(
	"game-events",
	async (job) => {
		console.log(`📦 [Worker] Received job: ${job.name} (ID: ${job.id})`);

		if (job.name === "game-finished") {
			const { roomId } = job.data;
			if (!roomId) {
				console.error("❌ [Worker] Job missing roomId");
				return;
			}

			console.log(`🎮 [Worker] Processing game finished for room: ${roomId}`);
			const roomKey = `room:${roomId}`;

			try {
				// 1. Fetch Room Data from PostgreSQL
				const room = await prisma.room.findFirst({
					where: { OR: [{ roomName: roomId }, { id: roomId }] },
					include: {
						questions: { orderBy: { questionOrder: "asc" } },
						quiz: {
							include: {
								Question: {
									include: { Option: true },
									orderBy: { createdAt: "asc" },
								},
							},
						},
					},
				});

				if (!room) {
					console.error(`❌ [Worker] Room ${roomId} not found in DB`);
					throw new Error(`Room ${roomId} not found in DB`);
				}

				// Ensure RoomQuestion records exist (auto-heal if startRoom failed or was bypassed)
				let roomQuestions = room.questions;
				if (roomQuestions.length === 0 && room.quiz?.Question?.length > 0) {
					console.log(
						`⚠️ [Worker] Room ${roomId} missing RoomQuestion records. Auto-creating from Quiz...`,
					);
					const toCreate = room.quiz.Question.map((q: any, idx: number) => ({
						roomId: room.id,
						questionId: q.id,
						questionOrder: idx,
					}));
					await prisma.roomQuestion.createMany({
						data: toCreate,
						skipDuplicates: true,
					});
					roomQuestions = await prisma.roomQuestion.findMany({
						where: { roomId: room.id },
						orderBy: { questionOrder: "asc" },
					});
				}

				// 2. Fetch initial room state from Redis in parallel
				const [scores, playersData] = await Promise.all([
					redisClient.hgetall(`${roomKey}:scores`),
					redisClient.hgetall(`${roomKey}:players`),
				]);

				// 3. Redis Pipeline: Fetch answers & metadata for ALL questions in ONE network trip (Fixes Redis N+1)
				const questionMap = new Map(
					(room.quiz?.Question || []).map((q: any) => [q.id, q]),
				);

				const answersPipeline = redisClient.pipeline();
				for (const [index] of roomQuestions.entries()) {
					answersPipeline.hgetall(`${roomKey}:answers:${index}`);
					answersPipeline.hgetall(`${roomKey}:answers_meta:${index}`);
				}
				const pipelineResults = await answersPipeline.exec();

				const rawAnswersPerQuestion: {
					rq: any;
					answersMap: Record<string, string>;
					metaMap: Record<string, string>;
					fullQuestion: any;
				}[] = [];

				const allUserIdsSet = new Set<string>(Object.keys(scores));

				for (const [index, rq] of roomQuestions.entries()) {
					const answersRes = pipelineResults?.[index * 2];
					const metaRes = pipelineResults?.[index * 2 + 1];

					const answersMap = (answersRes?.[1] || {}) as Record<string, string>;
					const metaMap = (metaRes?.[1] || {}) as Record<string, string>;
					const fullQuestion = questionMap.get(rq.questionId);

					for (const uid of Object.keys(answersMap)) {
						allUserIdsSet.add(uid);
					}

					rawAnswersPerQuestion.push({
						rq,
						answersMap,
						metaMap,
						fullQuestion,
					});
				}

				// 4. Validate user IDs against Postgres User table to PREVENT foreign key violation crashes (P2003)
				const candidateUserIds = Array.from(allUserIdsSet).filter(Boolean);
				const validUsers = await prisma.user.findMany({
					where: { id: { in: candidateUserIds } },
					select: { id: true, username: true, avatar: true },
				});
				const validUserMap = new Map(validUsers.map((u: any) => [u.id, u]));

				console.log(
					`👥 [Worker] Validated ${validUsers.length}/${candidateUserIds.length} candidate users in DB for room ${roomId}`,
				);

				// 5. Batch update/insert RoomPlayer records (Fixes DB N+1 queries)
				const existingRoomPlayers = await prisma.roomPlayer.findMany({
					where: { roomId: room.id },
					select: { userId: true },
				});
				const existingUserIds = new Set(
					existingRoomPlayers.map((p: any) => p.userId),
				);

				const playersToCreate: any[] = [];
				const playersToUpdate: { userId: string; score: number }[] = [];

				for (const [userId, scoreStr] of Object.entries(scores)) {
					if (!validUserMap.has(userId)) continue;
					const finalScore = parseInt(scoreStr, 10);
					if (Number.isNaN(finalScore)) continue;

					if (existingUserIds.has(userId)) {
						playersToUpdate.push({ userId, score: finalScore });
					} else {
						const pRaw = playersData[userId];
						let usernameSnapshot =
							validUserMap.get(userId)?.username || "Player";
						let avatarSnapshot =
							validUserMap.get(userId)?.avatar || "avatar1.svg";

						if (pRaw) {
							try {
								const p = JSON.parse(pRaw);
								usernameSnapshot = p.username || p.name || usernameSnapshot;
								avatarSnapshot = p.avatar || avatarSnapshot;
							} catch {
								// ignore
							}
						}

						playersToCreate.push({
							roomId: room.id,
							userId,
							score: finalScore,
							usernameSnapshot,
							avatarSnapshot,
							hasJoinedGame: true,
							gameJoinedAt: new Date(),
						});
					}
				}

				// 6. Build PlayerAnswer records
				const playerAnswersToCreate: any[] = [];

				for (const item of rawAnswersPerQuestion) {
					const { rq, answersMap, metaMap, fullQuestion } = item;
					if (!fullQuestion) continue;

					for (const [userId, selectedValue] of Object.entries(answersMap)) {
						// Skip users that do not exist in DB (prevents FK violation)
						if (!validUserMap.has(userId)) continue;

						const timeTaken = parseInt(metaMap[userId] || "0", 10);

						const selectedOption = fullQuestion.Option.find(
							(o: any) => o.id === selectedValue || o.text === selectedValue,
						);
						const correctOption = fullQuestion.Option.find(
							(o: any) => o.isCorrect,
						);

						const validSelectedOptionId = selectedOption
							? selectedOption.id
							: String(selectedValue);

						const isCorrect = selectedOption
							? selectedOption.isCorrect
							: selectedValue === correctOption?.text;

						playerAnswersToCreate.push({
							roomId: room.id,
							roomQuestionId: rq.id,
							userId,
							selectedOptionId: validSelectedOptionId,
							isCorrect,
							pointsEarned: isCorrect ? 4 : -1,
							responseTimeMs: timeTaken,
						});
					}
				}

				// 7. Atomic DB Transaction: Execute player creates, score updates, answers, and room FINISHED in 1 DB trip
				const finalizeDbOps: any[] = [];
				if (playersToCreate.length > 0) {
					finalizeDbOps.push(
						prisma.roomPlayer.createMany({
							data: playersToCreate,
							skipDuplicates: true,
						}),
					);
				}
				for (const p of playersToUpdate) {
					finalizeDbOps.push(
						prisma.roomPlayer.updateMany({
							where: { roomId: room.id, userId: p.userId },
							data: { score: p.score },
						}),
					);
				}
				if (playerAnswersToCreate.length > 0) {
					finalizeDbOps.push(
						prisma.playerAnswer.createMany({
							data: playerAnswersToCreate,
							skipDuplicates: true,
						}),
					);
				}
				finalizeDbOps.push(
					prisma.room.update({
						where: { id: room.id },
						data: { state: "FINISHED", endedAt: new Date() },
					}),
				);

				// 8. Redis Pipeline: Set TTL and release lock in ONE roundtrip without blocking KEYS command
				const cleanupPipeline = redisClient.pipeline();
				cleanupPipeline.expire(`${roomKey}:state`, 3600);
				cleanupPipeline.expire(`${roomKey}:questions`, 3600);
				cleanupPipeline.expire(`${roomKey}:scores`, 3600);
				cleanupPipeline.expire(`${roomKey}:players`, 3600);

				for (let i = 0; i < roomQuestions.length; i++) {
					cleanupPipeline.expire(`${roomKey}:answers:${i}`, 3600);
					cleanupPipeline.expire(`${roomKey}:answers_meta:${i}`, 3600);
					cleanupPipeline.expire(`${roomKey}:order:${i}`, 3600);
				}
				cleanupPipeline.del(`${roomKey}:loop_lock`);

				await Promise.all([
					prisma.$transaction(finalizeDbOps),
					cleanupPipeline.exec(),
				]);

				console.log(
					`💾 [Worker] Saved ${playerAnswersToCreate.length} answers & finalized room in DB with single transaction`,
				);
				console.log(
					`✅ [Worker] Game ${roomId} finalized successfully by worker!`,
				);
			} catch (error) {
				console.error(`🔴 [Worker] Error processing game ${roomId}:`, error);
				throw error; // Let BullMQ retry per configured backoff
			}
		}
	},
	{ connection },
);

worker.on("ready", () => {
	console.log("🟢 [Worker] BullMQ Worker is ready and connected to Redis.");
});

worker.on("error", (err) => {
	console.error("🔴 [Worker] BullMQ Worker Error:", err);
});
