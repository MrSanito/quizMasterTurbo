"use client";

import React from "react";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
const NotFound = () => {
//   const router = useRouter();
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-0 w-[full] sm:w-[800px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full opacity-40 mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[full] sm:w-[800px] h-[600px] bg-pink-600/10 blur-[120px] rounded-full opacity-40 mix-blend-screen"></div>
      </div>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 w-full h-full py-12">
        <div className="text-center relative max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>

          {/* Scale 404 text for mobile */}
          <h1 className="text-[7rem] sm:text-[12rem] font-bold leading-none tracking-tighter select-none animate-gradient text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 drop-shadow-2xl">
            404
          </h1>

          <div className="space-y-6 -mt-2 sm:-mt-8 relative">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">
              Oops! Lost in Space?
            </h2>

            <p className="text-neutral-400 text-sm sm:text-lg font-light leading-relaxed max-w-xs sm:max-w-md mx-auto">
              The page you're looking for seems to have drifted away. Let's get
              you back on track.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link
                href="/"
                className="btn btn-primary w-full sm:w-auto border-none bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 min-h-0 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Back to Home
              </Link>

              <button
                // onClick={() => router.back()}
                className="btn btn-ghost w-full sm:w-auto text-pink-500 hover:text-pink-400 hover:bg-pink-500/10 px-8 h-12 min-h-0 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Go Back
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Bottom Element - adjusted for 78vh container */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] sm:text-xs text-neutral-600 font-mono tracking-widest opacity-50">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          SYSTEM_ERROR_404
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse delay-75"></span>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
