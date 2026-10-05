import { prisma } from "@repo/db";
import { catchAsync } from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";

/* ================= SAVE GAME ================= */

export const saveGame = catchAsync(async (c: any) => {
	const { roomId, results } = await c.req.json();

	if (!roomId) {
		return c.json(
			{
				success: false,
				message: "roomId is required",
			},
			400,
		);
	}

	if (!results || !Array.isArray(results)) {
		logger.warn(`[GameController] No results provided for room ${roomId}`);
	}

	logger.info(`[GameController] Saving game results for room: ${roomId}`);

	const room = await prisma.room.findFirst({
		where: { OR: [{ id: roomId }, { roomName: roomId }] },
		include: {
			questions: {
				select: { id: true, questionId: true },
			},
			answers: {
				select: { roomQuestionId: true, userId: true },
			},
		},
	});

	if (!room) {
		return c.json(
			{
				success: false,
				message: "Room not found",
			},
			404,
		);
	}

	const roomQuestions = room.questions;
	const existingAnswers = room.answers;

	const rqMap = new Map(roomQuestions.map((rq: any) => [rq.questionId, rq.id]));
	const answeredSet = new Set(
		existingAnswers.map((a: any) => `${a.roomQuestionId}_${a.userId}`),
	);

	const answersToCreate: any[] = [];
	const playerUpdates: { userId: string; score: number }[] = [];

	if (results && Array.isArray(results)) {
		const candidateUserIds = results
			.map((r: any) => r.userId)
			.filter(Boolean);
		const validUsers = await prisma.user.findMany({
			where: { id: { in: candidateUserIds } },
			select: { id: true },
		});
		const validUserSet = new Set(validUsers.map((u: any) => u.id));

		for (const playerResult of results) {
			const { userId, score, answers } = playerResult;
			if (!validUserSet.has(userId)) continue;

			playerUpdates.push({
				userId,
				score: typeof score === "number" ? score : 0,
			});

			if (answers && Array.isArray(answers)) {
				for (const ans of answers) {
					const rqId = rqMap.get(ans.questionId);
					if (!rqId) continue;

					const key = `${rqId}_${userId}`;
					if (answeredSet.has(key)) continue;
					answeredSet.add(key);

					answersToCreate.push({
						roomId: room.id,
						roomQuestionId: rqId,
						userId,
						selectedOptionId: ans.selectedOptionId || "TIMEOUT",
						isCorrect: Boolean(ans.isCorrect),
						pointsEarned: typeof ans.points === "number" ? ans.points : 0,
						responseTimeMs:
							typeof ans.timeTaken === "number" ? ans.timeTaken : 0,
					});
				}
			}
		}
	}

	// Execute room update, player score updates, and answers creation in ONE atomic transaction
	const txOps: any[] = [
		prisma.room.update({
			where: { id: room.id },
			data: {
				state: "FINISHED",
				endedAt: new Date(),
			},
		}),
		...playerUpdates.map((p) =>
			prisma.roomPlayer.updateMany({
				where: { roomId: room.id, userId: p.userId },
				data: {
					score: p.score,
					hasJoinedGame: true,
				},
			}),
		),
	];

	if (answersToCreate.length > 0) {
		txOps.push(
			prisma.playerAnswer.createMany({
				data: answersToCreate,
				skipDuplicates: true,
			}),
		);
	}

	await prisma.$transaction(txOps);

	return c.json(
		{
			success: true,
			message: "Game saved successfully",
		},
		200,
	);
});

/* ================= GET RESULT ================= */

export const getGameResult = catchAsync(async (c: any) => {
	const roomId = c.req.param("roomId");

	if (!roomId || typeof roomId !== "string") {
		return c.json(
			{
				success: false,
				message: "roomId is required and must be a string",
			},
			400,
		);
	}

	const room = await prisma.room.findFirst({
		where: {
			OR: [{ id: roomId }, { roomName: roomId }],
		},
		include: {
			players: {
				include: {
					user: {
						select: {
							id: true,
							username: true,
							firstName: true,
							avatar: true,
						},
					},
				},
				orderBy: {
					score: "desc",
				},
			},
			quiz: {
				include: {
					Question: {
						include: {
							Option: true,
						},
					},
				},
			},
			questions: {
				orderBy: {
					questionOrder: "asc",
				},
			},
			answers: {
				include: {
					roomQuestion: true,
				},
			},
		},
	});

	if (!room) {
		return c.json(
			{
				success: false,
				message: "Room not found",
			},
			404,
		);
	}

	const allAnswers = room.answers;

	const results = room.players.map((rp: any) => {
		const playerAnswers = allAnswers.filter((a) => a.userId === rp.userId);

		const answersDetail = room.quiz.Question.map((q: any) => {
			const roomQ = room.questions.find((rq: any) => rq.questionId === q.id);
			if (!roomQ) return null;

			const ans = playerAnswers.find((a) => a.roomQuestionId === roomQ.id);
			const correctOption = q.Option.find((o: any) => o.isCorrect);
			const selectedOption = q.Option.find(
				(o: any) =>
					o.id === ans?.selectedOptionId || o.text === ans?.selectedOptionId,
			);

			return {
				questionId: q.id,
				questionText: q.questionText,
				selectedOptionId: ans?.selectedOptionId || null,
				selectedOptionText: selectedOption
					? selectedOption.text
					: ans?.selectedOptionId === "TIMEOUT"
						? "Refused to Answer"
						: ans?.selectedOptionId,
				correctOptionId: correctOption?.id,
				correctOptionText: correctOption?.text,
				isCorrect: ans?.isCorrect || false,
				points: ans?.pointsEarned || 0,
				timeTaken: ans?.responseTimeMs || 0,
			};
		}).filter(Boolean);

		return {
			user: rp.user,
			score: rp.score,
			answers: answersDetail,
		};
	});

	return c.json(
		{
			success: true,
			roomName: room.roomName,
			state: room.state,
			results,
		},
		200,
	);
});
