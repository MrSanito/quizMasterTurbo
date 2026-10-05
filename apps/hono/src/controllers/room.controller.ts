import { prisma } from "@repo/db";
import { redisClient } from "@repo/redis";
import { catchAsync } from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";

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

		// Synchronize room state and hostId to Redis in ONE pipeline roundtrip
		const createPipeline = redisClient.pipeline();
		createPipeline.hset(`room:${roomName}`, {
			hostId,
			quizId,
			roomName,
			state: "CREATED",
			maxPlayers: 10,
		});
		createPipeline.expire(`room:${roomName}`, 7200);
		createPipeline.hset(`room:${roomName}:state`, {
			hostId,
			status: "LOBBY",
			currentQuestionIndex: -1,
		});
		createPipeline.expire(`room:${roomName}:state`, 7200);
		await createPipeline.exec();

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

	if (!room) {
		return c.json({ success: false, message: "Room not found" }, 404);
	}

	const questionMap = new Map((room.quiz?.Question || []).map((q: any) => [q.id, q]));
	const answers = room.answers;

	const detailedResults = room.players.map((p, index) => {
		const userAnswers = (answers as any[]).filter((a) => a.userId === p.userId);

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
			rank: index + 1,
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

	const [updatedRoom] = await prisma.$transaction([
		prisma.room.update({
			where: { roomName: roomId },
			data: {
				state: "WAITING",
			},
		}),
		prisma.roomEvent.create({
			data: {
				roomId: room.id,
				userId: hostId,
				eventType: "ROOM_MOVED_TO_LOBBY",
				payload: {},
			},
		}),
	]);

	// Ensure Redis holds hostId and lobby state via pipeline
	const lobbyPipeline = redisClient.pipeline();
	lobbyPipeline.hset(`room:${roomId}`, {
		hostId,
		state: "WAITING",
	});
	lobbyPipeline.expire(`room:${roomId}`, 7200);
	lobbyPipeline.hset(`room:${roomId}:state`, {
		hostId,
		status: "LOBBY",
	});
	lobbyPipeline.expire(`room:${roomId}:state`, 7200);
	await lobbyPipeline.exec();

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
		});

	const questions = room.quiz.Question.map((q) => JSON.stringify(q));
	if (questions.length === 0) {
		logger.warn(
			` [RoomController] No questions found for quiz ${room.quiz.id} in room ${roomId}`,
		);
		return c.json(
			{ success: false, message: "Quiz has no questions! Cannot start." },
			400,
		);
	}

	const roomQuestionsData = room.quiz.Question.map(
		(q: any, index: number) => ({
			roomId: room.id,
			questionId: q.id,
			questionOrder: index,
		}),
	);

	const playerScores: Record<string, string> = {};
	Object.keys(lobbyPlayers).forEach((userId) => {
		if (validUserSet.has(userId)) playerScores[userId] = "0";
	});
	room.players.forEach((p) => {
		if (validUserSet.has(p.userId) && !playerScores[p.userId]) playerScores[p.userId] = "0";
	});

	// Batch all Redis initialization operations in ONE pipeline
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

	// Batch all database setup in ONE atomic transaction
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
	if (!room) throw new Error("Room not found");

	const roomQuestions = room.questions;
	const playerAnswersToCreate: any[] = [];

	const questionMap = new Map<string, any>((room.quiz?.Question || []).map((q: any) => [q.id, q]));

	// Pipeline: Fetch answers for all questions in ONE Redis roundtrip
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

	// Validate user IDs before DB writes to prevent FK crashes
	const allUserIds = Array.from(
		new Set([...Object.keys(scores), ...playerAnswersToCreate.map((a) => a.userId)]),
	).filter(Boolean);

	const validUsers = await prisma.user.findMany({
		where: { id: { in: allUserIds } },
		select: { id: true },
	});
	const validUserSet = new Set(validUsers.map((u: any) => u.id));

	const safeAnswers = playerAnswersToCreate.filter((a) => validUserSet.has(a.userId));

	// Transaction: Batch update player scores, insert answers, and mark room FINISHED in 1 DB trip
	const scoreUpdates = Object.entries(scores)
		.filter(([userId, s]) => validUserSet.has(userId) && !Number.isNaN(parseInt(s, 10)))
		.map(([userId, s]) =>
			prisma.roomPlayer.updateMany({
				where: { roomId: room.id, userId },
				data: { score: parseInt(s, 10) },
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

	// Pipeline: Clean Redis keys in ONE roundtrip without blocking KEYS command
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

	logger.info(` Finalized room ${roomId} with ${safeAnswers.length} player answers`);
	return c.json({ success: true, message: "Game finalized" }, 200);
});
