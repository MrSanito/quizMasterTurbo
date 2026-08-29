import { prisma } from "@repo/db";
import { logger } from "../utils/logger.js";

export async function saveGameResultsService(roomId: string, results?: any[]) {
	// 1. Update Room State to FINISHED
	await prisma.room.update({
		where: { id: roomId },
		data: {
			state: "FINISHED",
			endedAt: new Date(),
		},
	});

	// 2. Process Results
	if (results && Array.isArray(results)) {
		for (const playerResult of results) {
			const { userId, score, answers } = playerResult;

			// Update RoomPlayer score and hasJoinedGame
			await prisma.roomPlayer.updateMany({
				where: { roomId, userId },
				data: {
					score: score,
					hasJoinedGame: true,
				},
			});

			// Save Answers
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
							console.error(
								`[GameService] Error saving answer for user ${userId} q ${ans.questionId}:`,
								err,
							);
						}
					}
				}
			}
		}
	}
}

export async function getGameResultService(roomId: string) {
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

	if (!room) return null;

	const allAnswers = await prisma.playerAnswer.findMany({
		where: { roomId: room.id },
		include: {
			roomQuestion: true,
		},
	});

	const results = room.players.map((rp: any) => {
		const playerAnswers = allAnswers.filter((a: any) => a.userId === rp.userId);

		const answersDetail = room.quiz.Question.map((q: any) => {
			const roomQ = room.questions.find((rq: any) => rq.questionId === q.id);
			if (!roomQ) return null;

			const ans = playerAnswers.find((a: any) => a.roomQuestionId === roomQ.id);
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

	return {
		roomName: room.roomName,
		state: room.state,
		results,
	};
}
