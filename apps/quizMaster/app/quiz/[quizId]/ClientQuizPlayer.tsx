"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import { Clock, ChevronRight, Zap, CheckCircle, ListChecks, Trophy, Play,XCircle  } from "lucide-react";


export default function ClientQuizPlayer({ quiz }) {
  const router = useRouter();

  /* ---------------- AUTH ---------------- */
  const { isLogin, user, guest, incrementGuestCount } = useUser();

  /* ---------------- STATE ---------------- */
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);

  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );
  const [isAnswered, setIsAnswered] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [answers, setAnswers] = useState<
    Record<
      string,
      {
        selectedOptionText: string | null;
        correctOptionText: string;
        timeTaken: number;
      }
    >
  >({});

  const [startTime] = useState(() => Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(
    null
  );

  /* ---------------- NEXT QUESTION ---------------- */
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(20);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, quiz.questions.length]);

  /* ---------------- TIME UP ---------------- */
  const handleTimeUp = useCallback(() => {
    const q = quiz.questions[currentQuestionIndex];
    const correctOption = q.options.find((o) => o.isCorrect)!;

    const timeSpent = questionStartTime
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : 20;

    setAnswers((prev) => ({
      ...prev,
      [q._id]: {
        selectedOptionText: null,
        correctOptionText: correctOption.text,
        timeTaken: timeSpent,
      },
    }));

    setIsAnswered(true);

    if (autoNext) {
      setTimeout(handleNextQuestion, 2000);
    }
  }, [
    quiz,
    currentQuestionIndex,
    questionStartTime,
    autoNext,
    handleNextQuestion,
  ]);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!started || isAnswered || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, isAnswered, isSubmitting, handleTimeUp]);

  /* ---------------- OPTION SELECT ---------------- */
  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered || isSubmitting) return;

    const q = quiz.questions[currentQuestionIndex];
    const selectedOption = q.options[optionIndex];
    const correctOption = q.options.find((o) => o.isCorrect)!;

    const timeSpent = Math.floor(
      (Date.now() - (questionStartTime ?? Date.now())) / 1000
    );

    setSelectedOptionIndex(optionIndex);
    setIsAnswered(true);

    setAnswers((prev) => ({
      ...prev,
      [q._id]: {
        selectedOptionText: selectedOption.text,
        correctOptionText: correctOption.text,
        timeTaken: timeSpent,
      },
    }));

    setScore((prev) =>
      selectedOption.text === correctOption.text ? prev + 4 : prev - 1
    );

    if (autoNext) {
      setTimeout(handleNextQuestion, 2000);
    }
  };

  /* ---------------- SUBMIT QUIZ ---------------- */
  const handleSubmitQuiz = async () => {
    try {
      setIsSubmitting(true);

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const questionsPayload = quiz.questions.map((q) => {
        const a = answers[q._id];
        const correctOption = q.options.find((o) => o.isCorrect)!;

        return {
          questionId: q._id,
          selectedOptionText: a?.selectedOptionText ?? null,
          correctOptionText: correctOption.text,
          isCorrect: a?.selectedOptionText === correctOption.text,
          timeTaken: a?.timeTaken ?? 20,
        };
      });

      const authPayload = isLogin ? { userId: user.id } : { guestId: guest.id };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/${quiz._id}/submit`,
        {
          score,
          total: quiz.totalPoints,
          timeTaken,
          questions: questionsPayload,
          ...authPayload,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data?.attemptId) {
        incrementGuestCount();
        router.replace(
          `/quiz/${quiz.categoryId}/result/${res.data.attemptId}`
        );
      } else {
        throw new Error("attemptId missing");
      }
    } catch (err) {
      console.error("❌ Submit failed:", err);
      alert("Failed to submit quiz");
      setIsSubmitting(false);
    }
  };

  /* ---------------- START SCREEN ---------------- */
  if (!started) {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center p-4 sm:p-6">
        <div className="card bg-base-200 shadow-2xl w-full max-w-md sm:max-w-lg border border-base-300">
          <div className="card-body gap-5 sm:gap-6">
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
                🧠 {quiz.title}
              </h1>
              <p className="text-sm opacity-70 mt-1">
                Think fast. Click faster. No mercy.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex flex-row sm:flex-col items-center bg-base-100 rounded-xl p-3 sm:p-4 shadow gap-3 sm:gap-1">
                <ListChecks className="w-6 h-6 text-info shrink-0 sm:mb-1" />
                <div className="text-left sm:text-center">
                  <span className="text-base sm:text-lg font-bold block">
                    {quiz.questions.length}
                  </span>
                  <span className="text-xs opacity-70">Questions</span>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center bg-base-100 rounded-xl p-3 sm:p-4 shadow gap-3 sm:gap-1">
                <Clock className="w-6 h-6 text-warning shrink-0 sm:mb-1" />
                <div className="text-left sm:text-center">
                  <span className="text-base sm:text-lg font-bold block">
                    20s
                  </span>
                  <span className="text-xs opacity-70">Per Question</span>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center bg-base-100 rounded-xl p-3 sm:p-4 shadow gap-3 sm:gap-1">
                <Trophy className="w-6 h-6 text-success shrink-0 sm:mb-1" />
                <div className="text-left sm:text-center">
                  <span className="text-base sm:text-lg font-bold block">
                    +4 / -1
                  </span>
                  <span className="text-xs opacity-70">Scoring</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                setStarted(true);
                setQuestionStartTime(Date.now());
              }}
              className="btn btn-primary btn-lg gap-2 group w-full sm:w-auto"
            >
              <Play className="w-5 h-5 group-hover:translate-x-1 transition" />
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  /* ---------------- QUIZ UI ---------------- */
  return (
    <div className="min-h-[75dvh] flex items-center justify-center px-3 py-4 sm:p-5 bg-base-200/40 font-sans">
      <div className="w-full max-w-sm sm:max-w-xl rounded-2xl bg-base-100 shadow-xl border border-base-300">
        <div className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-5 md:p-8">
          {/* ================= TOP HEADER ================= */}
          <div className="flex items-start justify-between w-full">
            <p className="text-xs sm:text-sm opacity-60 font-medium mt-1">
              Question {currentQuestionIndex + 1} / {quiz.questions.length}
            </p>

            <div className="flex flex-col items-end gap-1.5">
              <label className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-base-200/60 hover:bg-base-200 transition cursor-pointer">
                <Zap
                  className={`w-3.5 h-3.5 ${
                    autoNext ? "text-warning" : "opacity-40"
                  }`}
                />
                <span className="text-[11px] font-semibold opacity-70">
                  Auto Next
                </span>
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                  className="toggle toggle-xs toggle-primary"
                />
              </label>

              <div className="flex items-center gap-1 text-[11px] font-bold opacity-60 px-1">
                <Trophy className="w-3 h-3" />
                <span>{score} pts</span>
              </div>
            </div>
          </div>

          {/* ================= TIMER ================= */}
          <div className="space-y-2">
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-1.5 mb-1 opacity-70">
                <span className="text-xs font-medium">Time Left</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span
                className={`text-3xl sm:text-4xl font-bold leading-none tabular-nums transition-colors ${
                  timeLeft <= 5 ? "text-error animate-pulse" : ""
                }`}
              >
                {timeLeft}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-base-300 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 5 ? "bg-error" : "bg-primary"
                }`}
                style={{ width: `${(timeLeft / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* ================= QUESTION ================= */}
          <h2 className="text-xl sm:text-2xl font-bold leading-snug">
            {currentQuestion.questionText}
          </h2>

          {/* ================= OPTIONS ================= */}
          <div className="space-y-2.5 mt-1">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOptionIndex === index;

              let stateClass =
                "bg-base-100 border-base-300 hover:bg-base-200 hover:border-base-content/20 active:scale-[0.99]";

              if (isAnswered) {
                if (option.isCorrect) {
                  stateClass = "bg-success/10 text-success border-success";
                } else if (isSelected) {
                  stateClass = "bg-error/10 text-error border-error";
                } else {
                  stateClass = "bg-base-100 border-base-200 opacity-50";
                }
              }

              return (
                <button
                  key={index}
                  disabled={isAnswered || isSubmitting}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-200 group ${stateClass} ${
                    isSelected && !isAnswered
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <span className="text-left text-sm sm:text-base font-medium">
                    {option.text}
                  </span>

                  {isAnswered && option.isCorrect && (
                    <CheckCircle className="w-5 h-5 shrink-0" />
                  )}
                  {isAnswered && isSelected && !option.isCorrect && (
                    <XCircle className="w-5 h-5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ================= ACTIONS ================= */}
          {isAnswered && (
            <div className="flex justify-end pt-1 animate-in fade-in slide-in-from-bottom-2">
              {!autoNext && !isLastQuestion && (
                <button
                  onClick={handleNextQuestion}
                  className="btn btn-primary btn-md gap-2 px-6 rounded-full"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {isLastQuestion && (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn btn-success btn-md gap-2 px-6 rounded-full text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Finish"}
                  {!isSubmitting && <Trophy className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
