"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useUser } from "../../../../(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import NotLoginComponent from "../../../../(auth)/components/NotLoginComponent";
import MaxTryReached from "../../../../(auth)/components/MaxTryReached";

/* ================= TYPES ================= */

type AttemptQuestionRaw = {
  questionId: string;
  selectedOptionText: string | null;
  correctOptionText: string;
  isCorrect: boolean;
  timeTaken: number;
};

type QuizQuestion = {
  id: string;
  questionText: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
};

type NormalizedQuestion = {
  questionId: string;
  questionText: string;
  options: {
    text: string;
    isCorrect: boolean;
    isSelected: boolean;
  }[];
  selectedOptionText: string | null;
  correctOptionText: string;
  timeTaken: number;
};

/* ================= NORMALIZER ================= */

function normalizeAttempt(
  attemptQuestions: AttemptQuestionRaw[],
  quizQuestions: QuizQuestion[]
): NormalizedQuestion[] {
  const quizMap = new Map(quizQuestions.map((q) => [q.id, q]));

  return attemptQuestions.map((aq) => {
    const quizQ = quizMap.get(aq.questionId);

    return {
      questionId: aq.questionId,
      questionText: quizQ?.questionText ?? "Unknown Question",
      selectedOptionText: aq.selectedOptionText,
      correctOptionText: aq.correctOptionText,
      timeTaken: aq.timeTaken,
      options:
        quizQ?.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.text === aq.correctOptionText,
          isSelected: opt.text === aq.selectedOptionText,
        })) ?? [],
    };
  });
}

/* ================= COMPONENT ================= */

export default function ClientQuizResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { loading, isLogin, isGuest, guest, user, isMaxTryReached } = useUser();

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [quizId, setQuizId] = useState<string>("");

  /* ================= FETCH ================= */

  useEffect(() => {
    // 🚫 Don't fetch if auth blocks the page
    if (loading || isMaxTryReached || (!isLogin && !isGuest) || !attemptId)
      return;

    const fetchResult = async () => {
      try {
        const authPayload = isLogin
          ? { userId: user.id }
          : { guestId: guest.id };

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/result/${attemptId}`,
          {
            params: {
              auth: JSON.stringify(authPayload),
            },
          }
        );

        const attempt = res.data?.attempt ?? res.data?.data?.attempt;

        if (
          !attempt ||
          !Array.isArray(attempt.questions) ||
          !Array.isArray(attempt.quiz?.questions)
        ) {
          throw new Error("Invalid result response");
        }

        setQuestions(
          normalizeAttempt(attempt.questions, attempt.quiz.questions)
        );
        setQuizId(attempt.quizId);
      } catch (err: any) {
        console.error("❌ Fetch result error:", err);

        // ✅ BACKEND-AWARE ERROR HANDLING
        if (err.response) {
          const status = err.response.status;
          const message = err.response.data?.message || "Something went wrong";

          if (status === 403) {
            setError(message); // "Access denied: this attempt is not yours"
          } else if (status === 401) {
            setError("You are not authorized. Please login again.");
          } else if (status === 404) {
            setError("Quiz attempt not found.");
          } else {
            setError(message);
          }
        } else {
          // network / unknown error
          setError("Network error. Please try again.");
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, loading, isLogin, isGuest, isMaxTryReached]);

  /* ---------------- GUARDS (AFTER HOOKS) ---------------- */

  // 1️⃣ Auth loading
  if (loading) {
    return <Loading />;
  }

  // 2️⃣ Guest blocked
  if (isMaxTryReached) {
    return <MaxTryReached />;
  }

  // 3️⃣ Not logged in & not guest
  if (!isLogin && !isGuest) {
    return <NotLoginComponent />;
  }

  // 4️⃣ Page data loading
  if (pageLoading) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center text-error">
        {error}
      </div>
    );
  }

  /* ================= CALCULATIONS ================= */

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let totalTime = 0;

  questions.forEach((q) => {
    totalTime += q.timeTaken;
    if (q.selectedOptionText === null) skipped++;
    else if (q.selectedOptionText === q.correctOptionText) correct++;
    else wrong++;
  });

  const score = correct * 4 - wrong;

  /* ================= UI ================= */

  return (
    <div className="min-h-[80dvh] flex justify-center px-4 py-6">
      <div className="max-w-3xl w-full space-y-4">
        {/* SUMMARY */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4 text-center">
            <h1 className="text-xl font-bold text-primary">
              Quiz Completed 🎉
            </h1>

            <div className="text-4xl font-bold mt-2">{score}</div>
            <p className="text-sm opacity-70">Final Score</p>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <Stat label="Correct" value={correct} color="bg-success" />
              <Stat label="Wrong" value={wrong} color="bg-error" />
              <Stat label="Skipped" value={skipped} color="bg-warning" />
            </div>

            <p className="mt-3 text-xs opacity-70">⏱ {totalTime}s total</p>

            <div className="mt-4 flex justify-center gap-2">
              <Link href={`/quiz/${quizId}`} className="btn btn-sm btn-primary">
                Retry
              </Link>
              <Link href="/categories" className="btn btn-sm btn-ghost">
                Categories
              </Link>
            </div>
          </div>
        </div>

        {/* REVIEW */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4 space-y-4">
            <h2 className="text-sm font-bold opacity-80">Answer Review</h2>

            {questions.map((q, idx) => (
              <div key={q.questionId} className="space-y-2">
                <p className="text-sm font-medium">
                  {idx + 1}. {q.questionText}
                </p>

                {/* OPTIONS */}
                <div className="flex flex-col items-center gap-2">
                  {q.options.map((opt, i) => {
                    let cls = "bg-base-300";
                    if (opt.isCorrect) cls = "bg-success text-white";
                    else if (opt.isSelected) cls = "bg-error text-white";

                    return (
                      <div
                        key={i}
                        className={`w-full max-w-md px-3 py-2 rounded text-sm ${cls}`}
                      >
                        {opt.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= STAT ================= */

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded p-2 text-white text-center ${color}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] opacity-90">{label}</div>
    </div>
  );
}
