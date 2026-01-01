"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function QuizResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const score = searchParams.get("score");
  const quizId = searchParams.get("quizId");

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="card bg-base-200 shadow-xl max-w-2xl w-full text-center">
        <div className="card-body">
          <h1 className="card-title text-3xl font-bold text-primary mb-6">
            Quiz Completed!
          </h1>

          <div className="mb-8">
            <div className="text-6xl font-bold text-primary mb-2">{score}</div>
            <p className="text-base-content">Your Score</p>
          </div>

          <div className="card-actions justify-center gap-4">
            <Link href={`/quiz/${quizId}`} className="btn btn-primary">
              Try Again
            </Link>
            <Link href="/categories" className="btn btn-secondary">
              Back to Categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
