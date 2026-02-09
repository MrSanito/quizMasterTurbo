
import { Request, Response } from "express";
import { prisma } from "@repo/db";

/* ================= SAVE GAME ================= */

export const saveGame = async (req: Request, res: Response) => {
  try {
    const { roomId, results } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "roomId is required",
      });
    }

    if (!results || !Array.isArray(results)) {
        // It's possible results is null/undefined if something went wrong, 
        // but we should at least mark the room as finished.
        console.warn(`[GameController] No results provided for room ${roomId}`);
    }

    console.log(`[GameController] Saving game results for room: ${roomId}`);

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
                    hasJoinedGame: true 
                }
            });

            // Save Answers
            if (answers && Array.isArray(answers)) {
                for (const ans of answers) {
                    // Find RoomQuestion
                    const roomQuestion = await prisma.roomQuestion.findFirst({
                        where: { roomId, questionId: ans.questionId }
                    });

                    if (roomQuestion) {
                        try {
                            // Check if answer already exists to avoid duplicates (idempotency)
                            const existing = await prisma.playerAnswer.findUnique({
                                where: {
                                    roomQuestionId_userId: {
                                        roomQuestionId: roomQuestion.id,
                                        userId: userId
                                    }
                                }
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
                                    }
                                });
                            }
                        } catch (err) {
                            console.error(`[GameController] Error saving answer for user ${userId} q ${ans.questionId}:`, err);
                        }
                    } else {
                        console.warn(`[GameController] RoomQuestion not found for roomId ${roomId} questionId ${ans.questionId}`);
                    }
                }
            }
        }
    }

    return res.status(200).json({
      success: true,
      message: "Game saved successfully",
    });

  } catch (error: any) {
    console.error("[GameController] Save Game Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

/* ================= GET RESULT ================= */

export const getGameResult = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({
        success: false,
        message: "roomId is required and must be a string",
      });
    }

    // Fetch Room Logic
    const room = await prisma.room.findUnique({
      where: { id: roomId },
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
                        Option: true
                    }
                }
            }
        },
        questions: {
            orderBy: {
                questionOrder: 'asc'
            }
        }
      },
    });

    if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }
  
      // We also need the answers given by each player
      const allAnswers = await prisma.playerAnswer.findMany({
          where: { roomId },
          include: {
              roomQuestion: true
          }
      });
  
      // Transform Data for Frontend
      // @ts-ignore - Prisma types are sometimes finicky with includes in this setup
      const results = room.players.map((rp: any) => {
          // Get answers for this player
          const playerAnswers = allAnswers.filter(a => a.userId === rp.userId);
          
          // Map answers to the actual questions (to get text, correct option, etc)
          // We iterate through the QUIZ questions to maintain order and include skipped ones
           // @ts-ignore
          const answersDetail = room.quiz.Question.map((q: any) => {
              // Find the RoomQuestion ID for this Question ID
               // @ts-ignore
              const roomQ = room.questions.find((rq: any) => rq.questionId === q.id);
              if (!roomQ) return null;
  
              const ans = playerAnswers.find(a => a.roomQuestionId === roomQ.id);
              const correctOption = q.Option.find((o: any) => o.isCorrect);
              const selectedOption = q.Option.find((o: any) => o.id === ans?.selectedOptionId || o.text === ans?.selectedOptionId); // Handle ID vs Text mismatch if any
  
              return {
                  questionId: q.id,
                  questionText: q.questionText,
                  selectedOptionId: ans?.selectedOptionId || null,
                  selectedOptionText: selectedOption ? selectedOption.text : (ans?.selectedOptionId === "TIMEOUT" ? "Refused to Answer" : ans?.selectedOptionId), 
                  correctOptionId: correctOption?.id,
                  correctOptionText: correctOption?.text,
                  isCorrect: ans?.isCorrect || false,
                  points: ans?.pointsEarned || 0,
                  timeTaken: ans?.responseTimeMs || 0
              };
          }).filter(Boolean);
  
          return {
              user: rp.user,
              score: rp.score,
              answers: answersDetail
          };
      });
  
      return res.status(200).json({
        success: true,
        results,
      });
  
    } catch (error: any) {
      console.error("[GameController] Get Result Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message
      });
    }
  };
