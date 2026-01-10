"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

/* ================= TYPES ================= */

type QuizHistoryItem = {
  id: string;
  score: number;
  total: number;
  timeTaken: number;
  createdAt: string;
  quiz: {
    id: string;
    title: string;
    categoryId: string;
  };
};

type QuizPlayerHistoryProps = {
  viewerId?: string;
  viewerType?: "user" | "guest";
};

/* ================= COMPONENT ================= */

export default function QuizPlayerHistory({
  viewerId,
  viewerType,
}: QuizPlayerHistoryProps) {
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 🚫 HARD GUARD (THIS MATTERS)
    if (!viewerId || !viewerType) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/history`,
          {
            params: { viewerId, viewerType },
            withCredentials: true,
          }
        );

        console.log("HISTORY RESPONSE 👉", res);

        const payload = res.data;

        if (!payload || !Array.isArray(payload.attempts)) {
          console.error("BAD SHAPE 👉", payload);
          throw new Error("Invalid history response");
        }

        const attempts = payload.attempts;


        // ✅ Normalize Prisma casing (Quiz → quiz)
        const normalized: QuizHistoryItem[] = attempts.map((a: any) => ({
          id: a.id,
          score: a.score,
          total: a.total,
          timeTaken: a.timeTaken,
          createdAt: a.createdAt,
          quiz: {
            id: a.Quiz.id,
            title: a.Quiz.title,
            categoryId: a.Quiz.categoryId,
          },
        }));

        setHistory(normalized);
      } catch (err) {
        console.error("❌ Failed to load quiz history", err);
        setError("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [viewerId, viewerType]);

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="mt-10 text-center text-neutral-400">
        Loading your quiz history… 🧠⌛
      </div>
    );
  }

  if (error) {
    return <div className="mt-10 text-center text-error">{error}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="mt-10 text-center text-neutral-400">
        You haven’t played any quizzes yet 😴
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-7xl mx-auto mt-12">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">
        🧾 Your Quiz History
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {history.map((item, index) => {
          const percent =
            item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-xl p-5 bg-base-100 shadow-md border border-base-300"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-semibold text-lg">{item.quiz.title}</h3>

                  <p className="text-sm opacity-70 mt-1">
                    Score: {item.score} / {item.total} ({percent}%)
                  </p>

                  <p className="text-xs opacity-60 mt-1">
                    ⏱ {item.timeTaken}s •{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <Link
                  href={`/quiz/${item.quiz.categoryId}/result/${item.id}`}
                  className="text-primary hover:opacity-80"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </div>

              <div className="mt-4 h-2 w-full bg-base-300 rounded">
                <div
                  className={`h-2 rounded ${
                    percent >= 60
                      ? "bg-success"
                      : percent >= 40
                        ? "bg-warning"
                        : "bg-error"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
