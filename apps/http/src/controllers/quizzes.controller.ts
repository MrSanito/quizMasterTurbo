import { prisma } from "@repo/db/lib/prisma.ts";

export const getQuiz = async (req: Request, res: Response) => {
  console.log("get quiz")
  const { quizId } = req.params;
  console.log(req.params);

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

        questions: {
          select: {
            id: true,
            questionText: true,
            points: true,
            negativePoints: true,

            options: {
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

    // 🔄 Format into Mongo-style output
    const formattedQuiz = {
      _id: quiz.id,
      quizNumber: quiz.quizNumber,
      title: quiz.title,
      categoryId: quiz.categoryId,
      timeLimit: quiz.timeLimit,
      totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),

      questions: quiz.questions.map((q) => ({
        _id: q.id,
        questionText: q.questionText,
        points: q.points,
        negativePoints: q.negativePoints,

        options: shuffleArray(
          q.options.map((o) => ({
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
      err,
      message: "Failed to fetch quiz",
    });
  }
};

export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { score, total, timeTaken, questions, userId, guestId } = req.body;
    console.log("ATTEMPT DATA", {
      quizId,
      userId,
      guestId,
      score,
    });

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

    // 🔐 AUTH VALIDATION
    if ((userId && guestId) || (!userId && !guestId)) {
      return res.status(400).json({
        success: false,
        message: "Either userId or guestId is required",
      });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: userId ?? null,
        guestId: guestId ?? null,
        score,
        total,
        timeTaken,
        questions, // minimal snapshot
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

export const resultOfQuiz = (req: Request, res: Response) => {
  console.log("lalal");
};

export const historyQuiz = async (req: Request, res: Response) => {};

export const getQuizResultByAttemptId = async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    console.log(attemptId)

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required",
      });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        quiz: {
          select: {
            title: true,
            quizNumber: true,
            categoryId: true,
            questions: {
              select: {
                id: true,
                questionText: true,
                options: {
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

    console.log(attempt)
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


export const getQuizHistory = async (req: Request, res: Response) => {

  console.log("aa gayi request on quizzes/history")
  try {
    const { viewerId, viewerType } = req.query as {
      viewerId?: string;
      viewerType?: "user" | "guest";
    };

    console.log(viewerId, viewerType)

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
        quiz: {
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
