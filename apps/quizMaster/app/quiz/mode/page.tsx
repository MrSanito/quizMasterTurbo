"use client";

import React from "react";
import Link from "next/link";
import { Users, Brain } from "lucide-react";

const QuizModePage = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl italic font-bold text-blue-500 ">Choose how you want to play</h2>
        <p className="text-sm opacity-60">Pick a mode to get started</p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Multiplayer */}
        <Link
          href="/room/create"
          className="group w-64 h-40 rounded-xl border bg-base-100
                     transition-all duration-200
                     hover:-translate-y-1 hover:shadow-md hover:border-base-300
                     flex flex-col items-center justify-center gap-3"
        >
          <Users
            size={32}
            className="opacity-80 transition-transform duration-200 group-hover:scale-105"
          />
          <h3 className="font-medium">Multiplayer</h3>
          <p className="text-xs opacity-60 text-center px-4">
            Play live with friends
          </p>
        </Link>

        {/* Solo */}
        <Link
          href="/categories"
          className="group w-64 h-40 rounded-xl border bg-base-100
                     transition-all duration-200
                     hover:-translate-y-1 hover:shadow-md hover:border-base-300
                     flex flex-col items-center justify-center gap-3"
        >
          <Brain
            size={32}
            className="opacity-80 transition-transform duration-200 group-hover:scale-105"
          />
          <h3 className="font-medium">Solo Quiz</h3>
          <p className="text-xs opacity-60 text-center px-4">
            Practice by category
          </p>
        </Link>
      </div>
    </div>
  );
};

export default QuizModePage;
