import { prisma } from "@repo/db";
import { logger } from "../utils/logger.js";

/* ================= SAVE GAME ================= */

export const saveGame = async (c: any) => {
	try {
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

		await prisma.room.update({
			where: { id: roomId },
			data: {
				state: "FINISHED",
				endedAt: new Date(),
			},
		});

		if (results && Array.isArray(results)) {
			for (const playerResult of results) {
				const { userId, score, answers } = playerResult;

				await prisma.roomPlayer.updateMany({
					where: { roomId, userId },
					data: {
						score: score,
						hasJoinedGame: true,
					},
				});

				if (answers && Array.isArray(answers)) {
					for (const ans of answers) {
						const roomQuestion = await prisma.roomQuestion.findFirst({
							where: { roomId, questionId: ans.questionId },
						});

						if (roomQuestion) {
							try {
								const existing = await prisma.playerAnswer.findUnique({
									where: {
										roomQuestionId_userId: {
											roomQuestionId: roomQuestion.id,
											userId: userId,
										},
									},
								});

								if (!existing) {
									await prisma.playerAnswer.create({
										data: {
											roomId,
											roomQuestionId: roomQuestion.id,
											userId,
											selectedOptionId: ans.selectedOptionId || "TIMEOUT",
											isCorrect: ans.isCorrect,
											pointsEarned: ans.points,
											responseTimeMs: ans.timeTaken || 0,
										},
									});
								}
							} catch (err) {
								logger.error(
									err,
									`[GameController] Error saving answer for user ${userId} q ${ans.questionId}:`,
								);
							}
						} else {
							logger.warn(
								`[GameController] RoomQuestion not found for roomId ${roomId} questionId ${ans.questionId}`,
							);
						}
					}
				}
			}
		}

		return c.json(
			{
				success: true,
				message: "Game saved successfully",
			},
			200,
		);
	} catch (error: any) {
		logger.error(error, "[GameController] Save Game Error:");
		return c.json(
			{
				success: false,
				message: "Internal Server Error",
				error: error.message,
			},
			500,
		);
	}
};

/* ================= GET RESULT ================= */

export const getGameResult = async (c: any) => {
	try {
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

		const allAnswers = await prisma.playerAnswer.findMany({
			where: { roomId },
			include: {
				roomQuestion: true,
			},
		});

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
	} catch (error: any) {
		logger.error(error, "[GameController] Get Result Error:");
		return c.json(
			{
				success: false,
				message: "Internal Server Error",
				error: error.message,
			},
			500,
		);
	}
};
