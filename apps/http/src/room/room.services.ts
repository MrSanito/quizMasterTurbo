import { prisma } from "@repo/db";
import { redisClient } from "@repo/redis";
import { logger } from "../utils/logger.js";

export async function createRoomService(data: {
	hostId: string;
	roomName: string;
	quizId: string;
}) {
	await redisClient.hset(`room:${data.roomName}`, {
		hostId: data.hostId,
		quizId: data.quizId,
		createdAt: new Date(),
		expiry: new Date(Date.now() + 3600000),
		state: "CREATED",
		maxPlayers: 10,
	});
	return await prisma.room.create({
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
	});

	 
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
			players: { orderBy: { score: "desc" }, include: { user: true } },
			questions: {
				orderBy: { questionOrder: "asc" },
			},
		},
	});

	if (!room) return null;

	const questionIds = room.questions.map((rq: any) => rq.questionId);
	const questionsData = await prisma.question.findMany({
		where: { id: { in: questionIds } },
		include: { Option: true },
	});
	const questionMap = new Map<string, any>(questionsData.map((q: any) => [q.id, q]));

	const answers = await prisma.playerAnswer.findMany({
		where: { roomId: room.id },
		include: { user: true },
	});

	const detailedResults = room.players.map((p: any) => {
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
			rank: 0,
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

	const roomKey = `room:${roomId}`;
	const lobbyPlayers = await redisClient.hgetall(`${roomKey}:players`);

	const playersToSync = Object.entries(lobbyPlayers).map(
		([userId, dataStr]) => {
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
		},
	);

	if (playersToSync.length > 0) {
		await prisma.roomPlayer.createMany({
			data: playersToSync,
			skipDuplicates: true,
		});
	}

	await redisClient.hset(`${roomKey}:state`, {
		status: "COUNTDOWN",
		currentQuestionIndex: -1,
		startTime: Date.now(),
	});
	await redisClient.expire(`${roomKey}:state`, 3600);

	const questions = room.quiz.Question.map((q: any) => JSON.stringify(q));
	if (questions.length === 0) {
		return { error: "NO_QUESTIONS" as const };
	}

	await redisClient.del(`${roomKey}:questions`);
	await redisClient.rpush(`${roomKey}:questions`, ...questions);
	await redisClient.expire(`${roomKey}:questions`, 3600);

	const oldAnswerKeys = await redisClient.keys(`${roomKey}:answers:*`);
	if (oldAnswerKeys.length > 0) {
		await redisClient.del(oldAnswerKeys);
	}

	const roomQuestionsData = room.quiz.Question.map((q: any, index: number) => ({
		roomId: room.id,
		questionId: q.id,
		questionOrder: index,
	}));

	await prisma.roomQuestion.deleteMany({ where: { roomId: room.id } });
	await prisma.roomQuestion.createMany({ data: roomQuestionsData });

	const playerScores: Record<string, string> = {};
	Object.keys(lobbyPlayers).forEach((userId) => {
		playerScores[userId] = "0";
	});
	room.players.forEach((p: any) => {
		if (!playerScores[p.userId]) playerScores[p.userId] = "0";
	});

	if (Object.keys(playerScores).length > 0) {
		await redisClient.hset(`${roomKey}:scores`, playerScores);
		await redisClient.expire(`${roomKey}:scores`, 3600);
	}

	await prisma.room.update({
		where: { id: room.id },
		data: { state: "COUNTDOWN", startedAt: new Date() },
	});

	return { synced: playersToSync.length };
}

export async function finalizeRoomService(roomId: string) {
	const roomKey = `room:${roomId}`;
	const scores = await redisClient.hgetall(`${roomKey}:scores`);

	const room = (await prisma.room.findUnique({
		where: { roomName: roomId },
		include: { questions: { orderBy: { questionOrder: "asc" } } },
	})) as any;

	if (!room) return { error: "NOT_FOUND" as const };

	const updates = Object.entries(scores).map(async ([userId, score]) => {
		return prisma.roomPlayer.updateMany({
			where: { roomId: room.id, userId },
			data: { score: parseInt(score, 10) },
		});
	});
	await Promise.all(updates);

	const roomQuestions = room.questions;
	const playerAnswersToCreate: any[] = [];

	const questionsData = await prisma.question.findMany({
		where: { id: { in: (roomQuestions as any[]).map((rq: any) => rq.questionId) } },
		include: { Option: true },
	});
	const questionMap = new Map<string, any>(questionsData.map((q: any) => [q.id, q]));

	for (const [index, rq] of (roomQuestions as any[]).entries()) {
		const answersMap = await redisClient.hgetall(`${roomKey}:answers:${index}`);
		const fullQuestion = questionMap.get(rq.questionId);
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

	if (playerAnswersToCreate.length > 0) {
		await prisma.playerAnswer.createMany({
			data: playerAnswersToCreate,
			skipDuplicates: true,
		});
	}

	await prisma.room.update({
		where: { id: room.id },
		data: { state: "FINISHED", endedAt: new Date() },
	});

	await redisClient.expire(`${roomKey}:state`, 3600);
	await redisClient.expire(`${roomKey}:questions`, 3600);
	await redisClient.expire(`${roomKey}:scores`, 3600);
	const answerKeys = await redisClient.keys(`${roomKey}:answers:*`);
	for (const k of answerKeys) {
		await redisClient.expire(k, 3600);
	}
	await redisClient.del(`${roomKey}:loop_lock`);

	return { success: true };
}
