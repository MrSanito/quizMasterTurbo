import { prisma } from "@repo/db";
import { redisClient } from "@repo/redis";
import { logger } from "../utils/logger.js";

export async function createRoomService(data: {
	hostId: string;
	roomName: string;
	quizId: string;
}) {
	const pipeline = redisClient.pipeline();
	pipeline.hset(`room:${data.roomName}`, {
		hostId: data.hostId,
		quizId: data.quizId,
		roomName: data.roomName,
		state: "CREATED",
		maxPlayers: 10,
	});
	pipeline.expire(`room:${data.roomName}`, 7200);

	pipeline.hset(`room:${data.roomName}:state`, {
		hostId: data.hostId,
		status: "LOBBY",
		currentQuestionIndex: -1,
	});
	pipeline.expire(`room:${data.roomName}:state`, 7200);

	const [, room] = await Promise.all([
		pipeline.exec(),
		prisma.room.create({
			data: {
				roomName: data.roomName,
				maxPlayers: 10,
				state: "CREATED",
				host: {
					connect: { id: data.hostId },
				},
				quiz: {
					connect: { id: data.quizId },
				},
			},
		}),
	]);

	return room;
}

export async function getRoomByNameService(roomName: string) {
	return await prisma.room.findUnique({
		where: { roomName },
	});
}

export async function getRoomResultService(roomId: string) {
	const room = await prisma.room.findFirst({
		where: { OR: [{ roomName: roomId }, { id: roomId }] },
		include: {
			quiz: {
				include: {
					Question: {
						include: { Option: true },
					},
				},
			},
			players: { orderBy: { score: "desc" }, include: { user: true } },
			questions: {
				orderBy: { questionOrder: "asc" },
			},
			answers: {
				include: { user: true },
			},
		},
	});

	if (!room) return null;

	const questionMap = new Map((room.quiz?.Question || []).map((q: any) => [q.id, q]));
	const answers = room.answers;

	const detailedResults = room.players.map((p: any, index: number) => {
		const userAnswers = (answers as any[]).filter(
			(a: any) => a.userId === p.userId,
		);

		const answersDetails = (room.questions as any[]).map((rq: any) => {
			const qData = questionMap.get(rq.questionId);
			const userAnswer = userAnswers.find((a: any) => a.roomQuestionId === rq.id);
			const correctOption = qData?.Option.find((o: any) => o.isCorrect);
			const selectedOption = qData?.Option.find(
				(o: any) => o.id === userAnswer?.selectedOptionId,
			);

			return {
				questionText: qData?.questionText,
				correctOptionText: correctOption?.text,
				selectedOptionText: selectedOption?.text || "Skipped",
				isCorrect: userAnswer?.isCorrect || false,
				points: (userAnswer as any)?.pointsEarned || 0,
			};
		});

		return {
			user: p.user,
			score: p.score,
			rank: index + 1,
			answers: answersDetails,
		};
	});

	return {
		roomName: room.roomName,
		state: room.state,
		results: detailedResults,
	};
}

export async function updateLobbyStateService(roomName: string, hostId: string) {
	const room = await prisma.room.findUnique({
		where: { roomName },
		select: { id: true, hostId: true, state: true },
	});

	if (!room) return { error: "NOT_FOUND" as const };
	if (room.state === "ABANDONED" || (room.state as any) === "ABORTED") return { error: "ROOM_ABORTED" as const };
	if (room.hostId !== hostId) return { error: "FORBIDDEN" as const };
	if (room.state === "WAITING") return { alreadyInLobby: true, room };
	if (room.state === "FINISHED") return { error: "GAME_FINISHED" as const };

	const updatedRoom = await prisma.room.update({
		where: { roomName },
		data: { state: "WAITING" },
	});

	await prisma.roomEvent.create({
		data: {
			roomId: room.id,
			userId: hostId,
			eventType: "ROOM_MOVED_TO_LOBBY",
			payload: {},
		},
	});

	await redisClient.hset(`room:${roomName}`, {
		hostId,
		state: "WAITING",
	});
	await redisClient.expire(`room:${roomName}`, 7200);

	await redisClient.hset(`room:${roomName}:state`, {
		hostId,
		status: "LOBBY",
	});
	await redisClient.expire(`room:${roomName}:state`, 7200);

	return { updatedRoom };
}

export async function startRoomService(roomId: string) {
	const room = await prisma.room.findFirst({
		where: {
			OR: [{ roomName: roomId }, { id: roomId }],
		},
		include: {
			quiz: {
				include: {
					Question: {
						include: { Option: true },
						orderBy: { createdAt: "asc" },
					},
				},
			},
			players: true,
		},
	});

	if (!room) return { error: "NOT_FOUND" as const };
	if (room.state === "ABANDONED" || (room.state as any) === "ABORTED") return { error: "ROOM_ABORTED" as const };

	const roomKey = `room:${roomId}`;
	const lobbyPlayers = await redisClient.hgetall(`${roomKey}:players`);

	const candidateUserIds = Object.keys(lobbyPlayers).filter(Boolean);
	const validUsers = await prisma.user.findMany({
		where: { id: { in: candidateUserIds } },
		select: { id: true },
	});
	const validUserSet = new Set(validUsers.map((u: any) => u.id));

	const playersToSync = Object.entries(lobbyPlayers)
		.filter(([userId]) => validUserSet.has(userId))
		.map(([userId, dataStr]) => {
			let parsed: any = {};
			try {
				parsed = JSON.parse(dataStr);
			} catch (e) {
				console.error("Failed to parse player data from Redis", e);
			}

			return {
				userId,
				roomId: room.id,
				usernameSnapshot: parsed.username || "Unknown Player",
				avatarSnapshot: parsed.avatar || "avatar1.svg",
				score: 0,
				hasJoinedGame: true,
				gameJoinedAt: new Date(),
			};
		});

	const questions = room.quiz.Question.map((q: any) => JSON.stringify(q));
	if (questions.length === 0) {
		return { error: "NO_QUESTIONS" as const };
	}

	const roomQuestionsData = room.quiz.Question.map((q: any, index: number) => ({
		roomId: room.id,
		questionId: q.id,
		questionOrder: index,
	}));

	const playerScores: Record<string, string> = {};
	Object.keys(lobbyPlayers).forEach((userId) => {
		if (validUserSet.has(userId)) playerScores[userId] = "0";
	});
	room.players.forEach((p: any) => {
		if (validUserSet.has(p.userId) && !playerScores[p.userId]) playerScores[p.userId] = "0";
	});

	const startPipeline = redisClient.pipeline();
	startPipeline.hset(`${roomKey}:state`, {
		status: "COUNTDOWN",
		currentQuestionIndex: -1,
		startTime: Date.now(),
		hostId: room.hostId,
	});
	startPipeline.expire(`${roomKey}:state`, 3600);

	startPipeline.hset(roomKey, {
		hostId: room.hostId,
		quizId: room.quizId,
		state: "COUNTDOWN",
	});
	startPipeline.expire(roomKey, 3600);

	startPipeline.del(`${roomKey}:questions`);
	startPipeline.rpush(`${roomKey}:questions`, ...questions);
	startPipeline.expire(`${roomKey}:questions`, 3600);

	for (let i = 0; i < room.quiz.Question.length; i++) {
		startPipeline.del(`${roomKey}:answers:${i}`);
		startPipeline.del(`${roomKey}:answers_meta:${i}`);
		startPipeline.del(`${roomKey}:order:${i}`);
	}

	if (Object.keys(playerScores).length > 0) {
		startPipeline.hset(`${roomKey}:scores`, playerScores);
		startPipeline.expire(`${roomKey}:scores`, 3600);
	}

	await Promise.all([
		startPipeline.exec(),
		prisma.$transaction([
			...(playersToSync.length > 0
				? [prisma.roomPlayer.createMany({ data: playersToSync, skipDuplicates: true })]
				: []),
			prisma.roomQuestion.deleteMany({ where: { roomId: room.id } }),
			prisma.roomQuestion.createMany({ data: roomQuestionsData }),
			prisma.room.update({
				where: { id: room.id },
				data: { state: "COUNTDOWN", startedAt: new Date() },
			}),
		]),
	]);

	return { synced: playersToSync.length };
}

export async function finalizeRoomService(roomId: string) {
	const roomKey = `room:${roomId}`;
	const scores = await redisClient.hgetall(`${roomKey}:scores`);

	const room = (await prisma.room.findFirst({
		where: { OR: [{ roomName: roomId }, { id: roomId }] },
		include: {
			questions: { orderBy: { questionOrder: "asc" } },
			quiz: {
				include: {
					Question: {
						include: { Option: true },
					},
				},
			},
		},
	})) as any;

	if (!room) return { error: "NOT_FOUND" as const };

	const roomQuestions = room.questions;
	const playerAnswersToCreate: any[] = [];
	const questionMap = new Map<string, any>((room.quiz?.Question || []).map((q: any) => [q.id, q]));

	// Pipeline answers fetch for all questions (Fixes Redis N+1)
	const answersPipeline = redisClient.pipeline();
	for (const [index] of (roomQuestions as any[]).entries()) {
		answersPipeline.hgetall(`${roomKey}:answers:${index}`);
	}
	const answersResults = await answersPipeline.exec();

	for (const [index, rq] of (roomQuestions as any[]).entries()) {
		const answersMap = (answersResults?.[index]?.[1] || {}) as Record<string, string>;
		const fullQuestion: any = questionMap.get(rq.questionId);
		if (!fullQuestion) continue;

		for (const [userId, selectedText] of Object.entries(answersMap)) {
			const selectedOption = fullQuestion.Option.find(
				(o: any) => o.text === selectedText,
			);
			const correctOption = fullQuestion.Option.find((o: any) => o.isCorrect);
			const isCorrect = selectedText === correctOption?.text;

			playerAnswersToCreate.push({
				roomId: room.id,
				roomQuestionId: rq.id,
				userId,
				selectedOptionId: selectedOption?.id || "unknown",
				isCorrect,
				pointsEarned: isCorrect ? 4 : -1,
				responseTimeMs: 0,
			});
		}
	}

	const allUserIds = Array.from(
		new Set([...Object.keys(scores), ...playerAnswersToCreate.map((a) => a.userId)]),
	).filter(Boolean);

	const validUsers = await prisma.user.findMany({
		where: { id: { in: allUserIds } },
		select: { id: true },
	});
	const validUserSet = new Set(validUsers.map((u: any) => u.id));

	const safeAnswers = playerAnswersToCreate.filter((a) => validUserSet.has(a.userId));

	const scoreUpdates = Object.entries(scores)
		.filter(([userId, s]) => validUserSet.has(userId) && !Number.isNaN(parseInt(s, 10)))
		.map(([userId, score]) =>
			prisma.roomPlayer.updateMany({
				where: { roomId: room.id, userId },
				data: { score: parseInt(score, 10) },
			}),
		);

	const dbOps: any[] = [
		...scoreUpdates,
		prisma.room.update({
			where: { id: room.id },
			data: { state: "FINISHED", endedAt: new Date() },
		}),
	];

	if (safeAnswers.length > 0) {
		dbOps.push(
			prisma.playerAnswer.createMany({
				data: safeAnswers,
				skipDuplicates: true,
			}),
		);
	}

	const cleanupPipeline = redisClient.pipeline();
	cleanupPipeline.expire(`${roomKey}:state`, 3600);
	cleanupPipeline.expire(`${roomKey}:questions`, 3600);
	cleanupPipeline.expire(`${roomKey}:scores`, 3600);
	for (let i = 0; i < roomQuestions.length; i++) {
		cleanupPipeline.expire(`${roomKey}:answers:${i}`, 3600);
		cleanupPipeline.expire(`${roomKey}:answers_meta:${i}`, 3600);
		cleanupPipeline.expire(`${roomKey}:order:${i}`, 3600);
	}
	cleanupPipeline.del(`${roomKey}:loop_lock`);

	await Promise.all([
		prisma.$transaction(dbOps),
		cleanupPipeline.exec(),
	]);

	return { success: true };
}
