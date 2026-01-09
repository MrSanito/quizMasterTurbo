"use client";

import React from "react";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const QuizNotFound = ({
  title = "Quiz Not Found",
  message = "Something went wrong while loading this quiz. It may have been removed or never existed.",
}: {
  title?: string;
  message?: string;
}) => {
  const router = useRouter();

  return (
    <div className="antialiased text-white min-h-[84dvh] flex flex-col relative overflow-hidden selection:bg-pink-500/30 selection:text-pink-200">
      <style jsx>{`
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-move 8s ease infinite;
        }
        @keyframes gradient-move {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-0 w-full sm:w-[800px] h-[600px] bg-red-600/10 blur-[120px] rounded-full opacity-40 mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-full sm:w-[800px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full opacity-40 mix-blend-screen" />
      </div>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center relative max-w-2xl mx-auto">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl -z-10 animate-pulse" />

          <div className="flex justify-center mb-6">
            <AlertTriangle size={64} className="text-red-400" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight animate-gradient text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-pink-500 to-purple-500">
            {title}
          </h1>

          <p className="mt-6 text-neutral-400 text-sm sm:text-lg max-w-md mx-auto">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              href="/"
              className="btn btn-primary border-none bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2"
            >
              <Home size={18} />
              Back to Home
            </Link>

            <button
              onClick={() => router.back()}
              className="btn btn-ghost text-pink-500 hover:text-pink-400 hover:bg-pink-500/10 px-8 h-12 rounded-full text-sm font-medium transition-all flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-neutral-600 font-mono tracking-widest opacity-50">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          QUIZ_ERROR
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-75" />
        </div>
      </main>
    </div>
  );
};

export default QuizNotFound;
