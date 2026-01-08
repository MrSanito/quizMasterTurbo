"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

type AttemptQuestion = {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  timeTaken: number;
};

type AttemptResult = {
  quizId: string;
  questions: AttemptQuestion[];
};

export default function ClientQuizResult() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptResult | null>(null);

  useEffect(() => {
    if (!attemptId) return;

    const fetchResult = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/result/${attemptId}`,
          { withCredentials: true }
        );

        if (!res.data?.success) {
          throw new Error("Invalid result response");
        }

        setAttempt(res.data.result);
      } catch (err) {
        console.error("❌ Failed to fetch result:", err);
        setError("Failed to load quiz result");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-[70dvh] flex justify-center items-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-[70dvh] flex justify-center items-center text-error">
        {error ?? "Result not found"}
      </div>
    );
  }

  /* ---------------- CALCULATIONS ---------------- */

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let totalTime = 0;

  attempt.questions.forEach((q) => {
    totalTime += q.timeTaken;

    if (q.selectedOptionId === null) skipped++;
    else if (q.selectedOptionId === q.correctOptionId) correct++;
    else wrong++;
  });

  const score = correct * 4 - wrong;

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-[80dvh] flex justify-center p-8">
      <div className="max-w-3xl w-full space-y-8">
        {/* SUMMARY */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">
              Quiz Completed 🎉
            </h1>

            <div className="text-6xl font-bold mb-2">{score}</div>
            <p className="opacity-70 mb-6">Final Score</p>

            <div className="grid grid-cols-3 gap-4">
              <Stat label="Correct" value={correct} color="bg-success" />
              <Stat label="Wrong" value={wrong} color="bg-error" />
              <Stat label="Skipped" value={skipped} color="bg-warning" />
            </div>

            <p className="mt-6 opacity-70">
              ⏱️ Total Time: {totalTime}s
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <Link
                href={`/quiz/${attempt.quizId}`}
                className="btn btn-primary"
              >
                Try Again
              </Link>
              <Link href="/categories" className="btn btn-secondary">
                Back to Categories
              </Link>
            </div>
          </div>
        </div>

        {/* PER QUESTION */}
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-4">
              Question Breakdown 📊
            </h2>

            <div className="space-y-2">
              {attempt.questions.map((q, index) => {
                const status =
                  q.selectedOptionId === null
                    ? "Skipped"
                    : q.selectedOptionId === q.correctOptionId
                    ? "Correct"
                    : "Wrong";

                const color =
                  status === "Correct"
                    ? "text-success"
                    : status === "Wrong"
                    ? "text-error"
                    : "text-warning";

                return (
                  <div
                    key={q.questionId}
                    className="flex justify-between items-center p-3 rounded bg-base-300"
                  >
                    <span>Q{index + 1}</span>
                    <span className={`font-bold ${color}`}>
                      {status}
                    </span>
                    <span className="opacity-70">
                      {q.timeTaken}s
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STAT COMPONENT ---------------- */

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
    <div className={`p-4 rounded text-white ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
}
