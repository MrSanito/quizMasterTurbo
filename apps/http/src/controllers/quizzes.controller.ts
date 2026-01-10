import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { prisma } from "@repo/db";

/* ================= GET QUIZ ================= */

export const getQuiz = async (
  req: Request<{ quizId: string }>,
  res: Response
) => {
  console.log("get quiz");
  const { quizId } = req.params;

  if (!quizId) {
    return res.status(400).json({
      success: false,
      message: "Quiz ID is required in the URL parameters",
    });
  }

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        quizNumber: true,
        title: true,
        categoryId: true,
        timeLimit: true,
        Question: {
          select: {
            id: true,
            questionText: true,
            points: true,
            negativePoints: true,
            Option: {
              select: {
                id: true,
                text: true,
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    function shuffleArray<T>(array: T[]): T[] {
      return [...array].sort(() => Math.random() - 0.5);
    }

    const formattedQuiz = {
      _id: quiz.id,
      quizNumber: quiz.quizNumber,
      title: quiz.title,
      categoryId: quiz.categoryId,
      timeLimit: quiz.timeLimit,
      totalPoints: quiz.Question.reduce((sum, q) => sum + q.points, 0),
      questions: quiz.Question.map((q:any) => ({
        _id: q.id,
        questionText: q.questionText,
        points: q.points,
        negativePoints: q.negativePoints,
        options: shuffleArray(
          q.Option.map((o:any) => ({
            _id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          }))
        ),
      })),
    };

    return res.status(200).json({
      success: true,
      formattedQuiz,
    });
  } catch (err) {
    console.error("❌ getQuiz error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz",
    });
  }
};

/* ================= SUBMIT QUIZ ================= */

interface SubmitQuizBody {
  score: number;
  total: number;
  timeTaken: number;
  questions: any[];
  userId?: string;
  guestId?: string;
}

export const submitQuiz = async (
  req: Request<{ quizId: string }, {}, SubmitQuizBody>,
  res: Response
) => {
  try {
    const { quizId } = req.params;
    const { score, total, timeTaken, questions, userId, guestId } = req.body;

    if (
      typeof score !== "number" ||
      typeof total !== "number" ||
      typeof timeTaken !== "number" ||
      !Array.isArray(questions)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }

    if ((userId && guestId) || (!userId && !guestId)) {
      return res.status(400).json({
        success: false,
        message: "Either userId or guestId is required",
      });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        id: randomUUID(),
        quizId,
        userId: userId ?? null,
        guestId: guestId ?? null,
        score,
        total,
        timeTaken,
        questions,
      },
    });

    return res.status(201).json({
      success: true,
      attemptId: attempt.id,
    });
  } catch (err) {
    console.error("❌ Quiz submit error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit quiz",
    });
  }
};

/* ================= RESULT / HISTORY PLACEHOLDERS ================= */

export const resultOfQuiz = (req: Request, res: Response) => {
  console.log("lalal");
};

export const historyQuiz = async (req: Request, res: Response) => {};

/* ================= RESULT BY ATTEMPT ================= */

export const getQuizResultByAttemptId = async (
  req: Request<{ attemptId: string }>,
  res: Response
) => {
  try {
    const { attemptId } = req.params;
    const { auth }: any = req.query;

    if (!auth) {
      return res.status(400).json({
        success: false,
        message: "auth query missing",
      });
    }

    let authContext: any;

    try {
      const authPayload = JSON.parse(auth);
      if (authPayload.userId) {
        authContext = { type: "user", userId: authPayload.userId };
      } else if (authPayload.guestId) {
        authContext = { type: "guest", guestId: authPayload.guestId };
      } else {
        throw new Error();
      }
    } catch {
      console.log(res)
      return res.status(400).json({
        success: false,
        message: "Invalid auth format",
      });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        Quiz: {
          select: {
            title: true,
            quizNumber: true,
            categoryId: true,
            Question: {
              select: {
                id: true,
                questionText: true,
                Option: {
                  select: {
                    text: true,
                    isCorrect: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
       return res.status(404).json({
        success: false,
        message: "Quiz attempt not found",
      });
    }

    const isUserMatch =
      authContext.userId && attempt.userId === authContext.userId;

    const isGuestMatch =
      authContext.guestId && attempt.guestId === authContext.guestId;

    if (!isUserMatch && !isGuestMatch) {
      return res.status(403).json({
        success: false,
        message: "Access denied: this attempt is not yours",
      });
    }

    return res.status(200).json({
      success: true,
      attempt,
    });
  } catch (err) {
    console.error("❌ Fetch attempt error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz result",
    });
  }
};

/* ================= QUIZ HISTORY ================= */

export const getQuizHistory = async (req: Request, res: Response) => {
  try {
    const { viewerId, viewerType } = req.query as {
      viewerId?: string;
      viewerType?: "user" | "guest";
    };

    if (!viewerId || !viewerType) {
      return res.status(400).json({
        success: false,
        message: "viewerId and viewerType are required",
      });
    }

    const where =
      viewerType === "user" ? { userId: viewerId } : { guestId: viewerId };

    const attempts = await prisma.quizAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        score: true,
        total: true,
        timeTaken: true,
        createdAt: true,
        Quiz: {
          select: {
            id: true,
            title: true,
            categoryId: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      attempts,
    });
  } catch (err) {
    console.error("❌ History fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz history",
    });
  }
};
