"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useUser } from "../../../../(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import NotLoginComponent from "../../../../(auth)/components/NotLoginComponent";
import MaxTryReached from "../../../../(auth)/components/MaxTryReached";
import api from "@/app/lib/api";

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
  Option: {
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
  quizQuestions: QuizQuestion[],
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
        quizQ?.Option.map((opt) => ({
          text: opt.text,
          isCorrect: opt.text === aq.correctOptionText,
          isSelected: opt.text === aq.selectedOptionText,
        })) ?? [],
    };
  });
}

/* ================= COMPONENT ================= */

export default function ClientQuizResult() {
  const params = useParams();
  const { attemptId } = params as { attemptId: string };

  const { loading, isLogin, isGuest, guest, user, isMaxTryReached } = useUser();

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [quizId, setQuizId] = useState<string>("");

  /* ================= FETCH ================= */

  useEffect(() => {
    if (loading || isMaxTryReached || (!isLogin && !isGuest) || !attemptId)
      return;

    const fetchResult = async () => {
      try {
        const authPayload = isLogin
          ? { userId: user.id }
          : { guestId: guest.id };

        const res = await api.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/result/${attemptId}`,
          {
            params: {
              auth: JSON.stringify(authPayload),
            },
          },
        );

        const attempt = res.data?.attempt ?? res.data?.data?.attempt;
        const quizQuestions = attempt?.Quiz?.Question;

        if (
          !attempt ||
          !Array.isArray(attempt.questions) ||
          !Array.isArray(quizQuestions)
        ) {
          throw new Error("Invalid result response");
        }

        setQuestions(normalizeAttempt(attempt.questions, quizQuestions));
        setQuizId(attempt.quizId);
      } catch (err: any) {
        if (err.response) {
          const status = err.response.status;
          const message = err.response.data?.message || "Something went wrong";
          if (status === 403) setError(message);
          else if (status === 401)
            setError("You are not authorized. Please login again.");
          else if (status === 404) setError("Quiz attempt not found.");
          else setError(message);
        } else {
          setError("Network error. Please try again.");
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, loading, isLogin, isGuest, isMaxTryReached]);

  /* ================= GUARDS ================= */

  if (loading) return <Loading />;
  if (isMaxTryReached) return <MaxTryReached />;
  if (!isLogin && !isGuest) return <NotLoginComponent />;

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
    <div className="min-h-[80dvh] bg-base-200 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* SUMMARY */}
        <div className="rounded-2xl bg-base-100 border border-base-300 shadow p-6 text-center">
          <h1 className="text-xl font-bold text-primary">Quiz Completed</h1>

          <div className="mt-2 text-5xl font-extrabold">{score}</div>
          <p className="text-sm opacity-60">Final Score</p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Stat label="Correct" value={correct} tone="success" />
            <Stat label="Wrong" value={wrong} tone="error" />
            <Stat label="Skipped" value={skipped} tone="warning" />
            <Stat label="Time" value={`${totalTime}s`} tone="info" />
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link href={`/quiz/${quizId}`} className="btn btn-sm btn-primary">
              Retry
            </Link>
            <Link href="/categories" className="btn btn-sm btn-ghost">
              Categories
            </Link>
          </div>
        </div>

        {/* REVIEW */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase opacity-70">
            Answer Review
          </h2>

          {questions.map((q, idx) => (
            <div
              key={q.questionId}
              className="rounded-xl bg-base-100 border border-base-300 p-5 space-y-3"
            >
              <p className="font-medium">
                {idx + 1}. {q.questionText}
              </p>

              <div className="grid gap-2">
                {q.options.map((opt, i) => {
                  const isCorrect = opt.isCorrect;
                  const isSelected = opt.isSelected;

                  let style = "border-base-300 bg-base-200 text-base-content";
                  let icon = null;

                  if (isCorrect) {
                    style = "border-success bg-success/10";
                    icon = "✔";
                  } else if (isSelected) {
                    style = "border-error bg-error/10";
                    icon = "✖";
                  }

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg border px-4 py-2 text-sm ${style}`}
                    >
                      <span>{opt.text}</span>
                      {icon && (
                        <span className="text-sm font-bold opacity-70">
                          {icon}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-xs opacity-60">⏱ {q.timeTaken}s</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= STAT ================= */

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "success" | "error" | "warning" | "info";
}) {
  return (
    <div
      className={`px-4 py-2 rounded-full text-sm font-semibold bg-${tone}/10 text-${tone}`}
    >
      {label}: {value}
    </div>
  );
}
