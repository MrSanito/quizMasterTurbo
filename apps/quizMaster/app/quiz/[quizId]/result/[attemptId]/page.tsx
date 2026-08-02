"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, CheckCircle, XCircle, Clock, RotateCcw, LayoutGrid, Sparkles, HelpCircle } from "lucide-react";
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
          }
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
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] flex items-center justify-center text-white">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] flex items-center justify-center p-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-2xl max-w-md w-full">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 rounded-full bg-[#7047C7] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#5B32B4] transition"
          >
            Back to Categories
          </Link>
        </div>
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4 py-12 flex flex-col items-center">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

      {/* Bottom wave cutout */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-2/3 text-white/[0.04] md:h-56"
        viewBox="0 0 500 200"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,200 L0,60 C140,140 300,200 500,200 Z" />
      </svg>

      <div className="relative z-10 w-full max-w-4xl space-y-8">
        {/* SUMMARY CARD */}
        <div className="rounded-3xl bg-white p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#340C97]/10 text-[#340C97] text-xs font-extrabold uppercase tracking-wider mb-4">
            <Sparkles size={14} />
            Quiz Completed
          </div>

          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-10 h-10 text-[#F0DE4A] drop-shadow-md" />
            <span className="text-5xl font-extrabold text-gray-900 tracking-tight">{score}</span>
            <span className="text-sm font-bold text-gray-400 self-end mb-1">PTS</span>
          </div>
          <p className="text-xs text-gray-500 font-semibold mb-6">Final Score</p>

          {/* Stat Pill Badges */}
          <div className="flex flex-wrap justify-center gap-3 w-full max-w-lg mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Correct: {correct}</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Wrong: {wrong}</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Skipped: {skipped}</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-50 border border-purple-200 text-[#7047C7] text-xs font-bold">
              <Clock className="w-4 h-4 text-[#7047C7]" />
              <span>Time: {totalTime}s</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 w-full sm:w-auto">
            {quizId && (
              <Link
                href={`/quiz/${quizId}`}
                className="flex items-center justify-center gap-2 rounded-full bg-[#F0DE4A] px-6 py-3 font-bold tracking-wide text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg text-xs"
              >
                <RotateCcw size={14} />
                RETRY QUIZ
              </Link>
            )}
            <Link
              href="/categories"
              className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-6 py-3 text-xs font-bold text-gray-700 transition-all duration-300 hover:bg-gray-100"
            >
              <LayoutGrid size={14} />
              BROWSE CATEGORIES
            </Link>
          </div>
        </div>

        {/* ANSWER REVIEW */}
        <div className="space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-white/80 pl-2">
            Detailed Answer Review
          </h2>

          {questions.map((q, idx) => (
            <div
              key={q.questionId}
              className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-extrabold text-gray-900 text-base leading-snug">
                  {idx + 1}. {q.questionText}
                </p>
                <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 shrink-0">
                  <Clock size={12} />
                  {q.timeTaken}s
                </span>
              </div>

              <div className="grid gap-2.5">
                {q.options.map((opt, i) => {
                  const isCorrect = opt.isCorrect;
                  const isSelected = opt.isSelected;

                  let style = "bg-gray-50 border-gray-200 text-gray-700";
                  let badge = null;

                  if (isCorrect) {
                    style = "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold";
                    badge = (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle size={15} /> Correct
                      </span>
                    );
                  } else if (isSelected) {
                    style = "bg-red-50 border-red-400 text-red-900 font-bold";
                    badge = (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                        <XCircle size={15} /> Your Answer
                      </span>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-all ${style}`}
                    >
                      <span>{opt.text}</span>
                      {badge}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
