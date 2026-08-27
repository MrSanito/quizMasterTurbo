import { prisma } from "@repo/db";
import { redisClient } from "@repo/redis";
import { logger } from "../utils/logger.js";
import { catchAsync } from "../utils/catchAsync.js";

export const createRoom = catchAsync(async (c: any) => {
	try {
		const { hostId, roomName, quizId } = await c.req.json();
		logger.info({ hostId, roomName, quizId });

		const _room = await prisma.room.create({
			data: {
				roomName,
				maxPlayers: 10,
				state: "CREATED",
				host: {
					connect: { id: hostId },
				},
				quiz: {
					connect: { id: quizId },
				},
			},
		});

		return c.json(
			{
				success: true,
				message: "Room created successfully",
			},
			201,
		);
	} catch (error: any) {
		logger.error(error, "Room creation error:");

		if (error.code === "P2003") {
			return c.json(
				{
					success: false,
					message: "Invalid host user",
				},
				400,
			);
		}
		throw error;
	}
});

export const getRoom = catchAsync(async (c: any) => {
	const roomIdParam = c.req.param("roomId");
	const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;

	const room = await prisma.room.findUnique({
		where: { roomName: roomId },
	});
	logger.info({ room }, "room data");

	return c.json(
		{
			success: true,
			message: "Success at Getting room",
			room,
		},
		200,
	);
});

export const getRoomResult = catchAsync(async (c: any) => {
	const roomIdParam = c.req.param("roomId");
	const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;

	const room = await prisma.room.findFirst({
		where: { OR: [{ roomName: roomId }, { id: roomId }] },
		include: {
			players: { orderBy: { score: "desc" }, include: { user: true } },
			questions: {
				orderBy: { questionOrder: "asc" },
			},
		},
	});

	if (!room) {
		return c.json({ success: false, message: "Room not found" }, 404);
	}

	const questionIds = room.questions.map((rq) => rq.questionId);
	const questionsData = await prisma.question.findMany({
		where: { id: { in: questionIds } },
		include: { Option: true },
	});
	const questionMap = new Map(questionsData.map((q) => [q.id, q]));

	const answers = await prisma.playerAnswer.findMany({
		where: { roomId: room.id },
		include: { user: true },
	});

	const detailedResults = room.players.map((p) => {
		const userAnswers = (answers as any[]).filter(
			(a) => a.userId === p.userId,
		);

		const answersDetails = (room.questions as any[]).map((rq) => {
			const qData = questionMap.get(rq.questionId);
			const userAnswer = userAnswers.find((a) => a.roomQuestionId === rq.id);
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

	return c.json(
		{
			success: true,
			roomName: room.roomName,
			state: room.state,
			results: detailedResults,
		},
		200,
	);
});

export const updateLobby = catchAsync(async (c: any) => {
	const roomIdParam = c.req.param("roomId");
	const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;
	const { hostId } = await c.req.json();
	logger.info(roomId);

	const room = await prisma.room.findUnique({
		where: { roomName: roomId },
		select: { id: true, hostId: true, state: true },
	});
	logger.info({ room }, "room");

	if (!room) {
		return c.json(
			{
				success: false,
				message: "Room not found",
			},
			404,
		);
	}

	if (room.hostId !== hostId) {
		return c.json(
			{
				success: false,
				message: "Only host can update room",
			},
			403,
		);
	}

	if (room.state === "WAITING") {
		return c.json(
			{
				success: true,
				message: "Room already in lobby",
			},
			200,
		);
	}

	if (room.state === "FINISHED") {
		return c.json(
			{
				success: false,
				message: "Game already finished",
			},
			400,
		);
	}

	const updatedRoom = await prisma.room.update({
		where: { roomName: roomId },
		data: {
			state: "WAITING",
		},
	});

	await prisma.roomEvent.create({
		data: {
			roomId: room.id,
			userId: hostId,
			eventType: "ROOM_MOVED_TO_LOBBY",
			payload: {},
		},
	});

	return c.json(
		{
			success: true,
			message: "Room is now in lobby",
			data: updatedRoom,
		},
		200,
	);
});

export const startRoom = catchAsync(async (c: any) => {
	const roomIdParam = c.req.param("roomId");
	const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;
	logger.info({ roomId }, "room Id");

	if (!roomId) {
		return c.json({ success: false, message: "Invalid Room ID" }, 400);
	}

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

	logger.info({ room }, "Fetched room details");

	if (!room) {
		return c.json({ success: false, message: "Room not found" }, 404);
	}

	const roomKey = `room:${roomId}`;

	logger.info(
		` [RoomController] Reading players from Redis Key: ${roomKey}:players`,
	);
	const lobbyPlayers = await redisClient.hgetall(`${roomKey}:players`);
	logger.info(
		` [RoomController] Found ${Object.keys(lobbyPlayers).length} players in Redis`,
	);

	const playersToSync = Object.entries(lobbyPlayers).map(
		([userId, dataStr]) => {
			let parsed: any = {};
			try {
				parsed = JSON.parse(dataStr);
			} catch (e) {
				logger.error(e, "Failed to parse player data from Redis");
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
		logger.info(`Synced ${playersToSync.length} players from Redis to DB`);
	}

	await redisClient.hset(`${roomKey}:state`, {
		status: "COUNTDOWN",
		currentQuestionIndex: -1,
		startTime: Date.now(),
	});
	await redisClient.expire(`${roomKey}:state`, 3600);

	const questions = room.quiz.Question.map((q) => JSON.stringify(q));
	if (questions.length > 0) {
		logger.info(
			` [RoomController] Pushing ${questions.length} questions to Redis for ${roomId}`,
		);
		await redisClient.del(`${roomKey}:questions`);
		await redisClient.rpush(`${roomKey}:questions`, ...questions);
		await redisClient.expire(`${roomKey}:questions`, 3600);

		const oldAnswerKeys = await redisClient.keys(`${roomKey}:answers:*`);
		if (oldAnswerKeys.length > 0) {
			await redisClient.del(oldAnswerKeys);
		}

		const roomQuestionsData = room.quiz.Question.map(
			(q: any, index: number) => ({
				roomId: room.id,
				questionId: q.id,
				questionOrder: index,
			}),
		);

		await prisma.roomQuestion.deleteMany({ where: { roomId: room.id } });

		await prisma.roomQuestion.createMany({
			data: roomQuestionsData,
		});
		logger.info(
			` [RoomController] Created ${roomQuestionsData.length} RoomQuestion records`,
		);
	} else {
		logger.warn(
			` [RoomController] No questions found for quiz ${room.quiz.id} in room ${roomId}`,
		);
		return c.json(
			{ success: false, message: "Quiz has no questions! Cannot start." },
			400,
		);
	}

	const playerScores: Record<string, string> = {};

	Object.keys(lobbyPlayers).forEach((userId) => {
		playerScores[userId] = "0";
	});

	room.players.forEach((p) => {
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
	return c.json(
		{ success: true, message: "Game starting", synced: playersToSync.length },
		200,
	);
});

export const finalizeRoom = catchAsync(async (c: any) => {
	const roomIdParam = c.req.param("roomId");
	const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;

	if (!roomId) {
		return c.json({ success: false, message: "Invalid Room ID" }, 400);
	}
	const roomKey = `room:${roomId}`;

	const scores = await redisClient.hgetall(`${roomKey}:scores`);

	const room = (await prisma.room.findUnique({
		where: { roomName: roomId },
		include: { questions: { orderBy: { questionOrder: "asc" } } },
	})) as any;
	if (!room) throw new Error("Room not found");

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
		where: {
			id: { in: (roomQuestions as any[]).map((rq: any) => rq.questionId) },
		},
		include: { Option: true },
	});

	const questionMap = new Map(questionsData.map((q) => [q.id, q]));

	for (const [index, rq] of (roomQuestions as any[]).entries()) {
		const answersMap = await redisClient.hgetall(
			`${roomKey}:answers:${index}`,
		);
		const fullQuestion = questionMap.get(rq.questionId);

		if (!fullQuestion) continue;

		for (const [userId, selectedText] of Object.entries(answersMap)) {
			const selectedOption = fullQuestion.Option.find(
				(o) => o.text === selectedText,
			);
			const correctOption = fullQuestion.Option.find((o) => o.isCorrect);

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
		logger.info(
			` Saved ${playerAnswersToCreate.length} player answers to DB`,
		);
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

	return c.json({ success: true, message: "Game finalized" }, 200);
});
