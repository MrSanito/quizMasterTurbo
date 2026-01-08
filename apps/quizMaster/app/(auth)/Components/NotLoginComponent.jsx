"use client";

import React from "react";
import Link from "next/link";
import { Lock, Home, LogIn, UserPlus } from "lucide-react";

const NotLoginComponent = () => {
  return (
    <div className="antialiased min-h-[84dvh] flex flex-col relative overflow-hidden text-white selection:bg-pink-500/30 selection:text-pink-200">
      {/* Gradient animation */}
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

      {/* Background effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="absolute top-0 left-0 w-[700px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full opacity-40 mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[700px] h-[500px] bg-pink-600/10 blur-[120px] rounded-full opacity-40 mix-blend-screen"></div>
      </div>

      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-12">
        <div className="relative text-center max-w-xl w-full">
          {/* Glow orb */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-64 h-64 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center shadow-lg">
              <Lock size={28} className="text-red-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight animate-gradient text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-pink-500 to-purple-500">
            Access Locked
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-neutral-400 text-sm sm:text-lg max-w-md mx-auto leading-relaxed">
            You need to be signed in to access this page. Log in or create an
            account to unlock exclusive quizzes 🚀
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="btn border-none bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 min-h-0 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Login
            </Link>

            <Link
              href="/register"
              className="btn border-none bg-pink-600 hover:bg-pink-500 text-white px-8 h-12 min-h-0 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              Register
            </Link>
          </div>

          {/* Back home */}
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-blue-400 transition"
            >
              <Home size={14} />
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer debug-style text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-neutral-600 font-mono tracking-widest opacity-50">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        AUTH_REQUIRED
        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse delay-75"></span>
      </div>
    </div>
  );
};

export default NotLoginComponent;
