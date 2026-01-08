"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useUser } from "@/app/(auth)/context/GetUserContext";

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

  /* 🔥 ONLY CHANGE: SAVE TEXT INSTEAD OF ID */
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
  }, [started, isAnswered, isSubmitting]);

  /* ---------------- TIME UP ---------------- */
  const handleTimeUp = () => {
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
  };

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

    /* 🔥 TEXT-BASED COMPARISON */
    setScore((prev) =>
      selectedOption.text === correctOption.text ? prev + 4 : prev - 1
    );

    if (autoNext) {
      setTimeout(handleNextQuestion, 2000);
    }
  };

  /* ---------------- NEXT QUESTION ---------------- */
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(20);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setQuestionStartTime(Date.now());
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
          `/quiz_new/${quiz.categoryId}/result/${res.data.attemptId}`
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
      <div className="min-h-[80dvh] flex items-center justify-center p-8">
        <div className="card bg-base-200 shadow-xl max-w-lg w-full">
          <div className="card-body">
            <h1 className="text-3xl font-bold text-primary mb-4">
              {quiz.title}
            </h1>

            <p>Total Questions: {quiz.questions.length}</p>
            <p>Time per Question: 20 seconds</p>
            <p>Scoring: +4 / -1</p>

            <button
              onClick={() => {
                setStarted(true);
                setQuestionStartTime(Date.now());
              }}
              className="btn btn-primary mt-6"
            >
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
    <div className="min-h-[75dvh] flex items-center justify-center p-8">
      <div className="card bg-base-200 shadow-xl max-w-2xl w-full">
        <div className="card-body">
          {/* HEADER */}
          <div className="flex justify-between mb-4">
            <div>
              Question {currentQuestionIndex + 1} / {quiz.questions.length}
              <div className="font-bold text-primary">Score: {score}</div>
            </div>

            {/* 🔥 AUTO NEXT STILL HERE */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoNext}
                onChange={(e) => setAutoNext(e.target.checked)}
                className="checkbox checkbox-primary checkbox-sm"
              />
              Auto next
            </label>
          </div>

          {/* TIMER */}
          <div className="mb-4">
            <div className="w-full bg-base-300 h-2 rounded">
              <div
                className="bg-primary h-2 rounded transition-all"
                style={{ width: `${(timeLeft / 20) * 100}%` }}
              />
            </div>
            <p className="text-right mt-1">Time left: {timeLeft}s</p>
          </div>

          {/* QUESTION */}
          <h2 className="text-xl mb-6">{currentQuestion.questionText}</h2>

          {/* OPTIONS */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                disabled={isAnswered || isSubmitting}
                onClick={() => handleOptionSelect(index)}
                className={`w-full p-4 rounded text-left ${
                  isAnswered
                    ? option.isCorrect
                      ? "bg-success text-white"
                      : selectedOptionIndex === index
                        ? "bg-error text-white"
                        : "bg-base-300"
                    : "bg-base-300 hover:bg-base-100"
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>

          {/* ACTIONS */}
          {isAnswered && (
            <div className="mt-6 flex justify-end gap-3">
              {!autoNext && !isLastQuestion && (
                <button
                  onClick={handleNextQuestion}
                  className="btn btn-primary"
                >
                  Next
                </button>
              )}

              {isLastQuestion && (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn btn-success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Quiz"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
