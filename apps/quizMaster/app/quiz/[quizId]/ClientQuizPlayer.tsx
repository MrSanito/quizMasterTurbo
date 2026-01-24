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
      <div className="min-h-[80dvh] flex items-center justify-center p-6">
        <div className="card bg-base-200 shadow-2xl max-w-lg w-full border border-base-300">
          <div className="card-body gap-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2">
                🧠 {quiz.title}
              </h1>
              <p className="text-sm opacity-70 mt-1">
                Think fast. Click faster. No mercy.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center bg-base-100 rounded-xl p-4 shadow">
                <ListChecks className="w-6 h-6 text-info mb-1" />
                <span className="text-lg font-bold">
                  {quiz.questions.length}
                </span>
                <span className="text-xs opacity-70">Questions</span>
              </div>

              <div className="flex flex-col items-center bg-base-100 rounded-xl p-4 shadow">
                <Clock className="w-6 h-6 text-warning mb-1" />
                <span className="text-lg font-bold">20s</span>
                <span className="text-xs opacity-70">Per Question</span>
              </div>

              <div className="flex flex-col items-center bg-base-100 rounded-xl p-4 shadow">
                <Trophy className="w-6 h-6 text-success mb-1" />
                <span className="text-lg font-bold">+4 / -1</span>
                <span className="text-xs opacity-70">Scoring</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                setStarted(true);
                setQuestionStartTime(Date.now());
              }}
              className="btn btn-primary btn-lg gap-2 group"
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
    <div className="min-h-[75dvh] flex items-center justify-center p-6 bg-base-200/40">
      <div className="w-full max-w-2xl rounded-3xl bg-base-100 shadow-2xl border border-base-300">
        <div className="flex flex-col gap-8 p-6 md:p-8">
          {/* ================= TOP BAR ================= */}
          <div className="flex items-start justify-between">
            {/* Progress */}
            <p className="text-sm opacity-60 font-medium">
              Question {currentQuestionIndex + 1} / {quiz.questions.length}
            </p>

            {/* Right Stack */}
            <div className="flex flex-col items-end gap-3">
              {/* Score */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-200 shadow-sm font-semibold text-primary">
                <Trophy className="w-4 h-4" />
                <span>{score}</span>
                <span className="text-xs opacity-60">pts</span>
              </div>

              {/* Auto */}
              <label className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-200 shadow-sm cursor-pointer text-sm hover:scale-[1.03] transition">
                <Zap className="w-4 h-4 text-warning" />
                <span className="hidden sm:inline">Auto</span>
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                  className="toggle toggle-primary toggle-sm"
                />
              </label>
            </div>
          </div>

          {/* ================= TIMER ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-info" />
                <span>Time left</span>
              </div>

              <div
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
                  timeLeft <= 5
                    ? "bg-error text-white animate-pulse"
                    : "bg-base-200 text-primary"
                }`}
              >
                {timeLeft}s
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-base-300 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  timeLeft <= 5 ? "bg-error" : "bg-primary"
                }`}
                style={{ width: `${(timeLeft / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* ================= QUESTION ================= */}
          <h2 className="text-xl md:text-2xl font-semibold leading-snug text-center">
            {currentQuestion.questionText}
          </h2>

          {/* ================= OPTIONS ================= */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOptionIndex === index;

              let stateClass = "bg-base-100 border-base-300 hover:bg-base-200";

              if (isAnswered) {
                if (option.isCorrect) {
                  stateClass = "bg-success text-white border-success";
                } else if (isSelected) {
                  stateClass = "bg-error text-white border-error";
                } else {
                  stateClass = "bg-base-200 border-base-300 opacity-60";
                }
              }

              return (
                <button
                  key={index}
                  disabled={isAnswered || isSubmitting}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${stateClass}`}
                >
                  <span className="text-left">{option.text}</span>

                  {isAnswered && option.isCorrect && (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {isAnswered && isSelected && !option.isCorrect && (
                    <XCircle className="w-5 h-5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ================= ACTIONS ================= */}
          {isAnswered && (
            <div className="flex justify-end pt-4">
              {!autoNext && !isLastQuestion && (
                <button
                  onClick={handleNextQuestion}
                  className="btn btn-primary gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {isLastQuestion && (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn btn-success gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Finish Quiz"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
