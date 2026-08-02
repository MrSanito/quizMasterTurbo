"use client";

import React from "react";
import { Play } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] pb-40 pt-6">
      {/* bottom-left wave cutout, matches the diagonal white shape in the source design */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-2/3 text-white md:h-56"
        viewBox="0 0 500 200"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,200 L0,60 C140,140 300,200 500,200 Z" />
      </svg>

      {/* Hero content */}
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pt-14 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-[2.75rem]">
            Daily Quiz, Daily Bonus- Play Today!
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            QuizKwik is the daily Trivia and quiz playing platform. It brings some exciting
            surprises every day.
          </p>
          <Link href="/quiz/mode">
            <button className="btn mt-8 h-auto gap-2 rounded-full bg-[#F0DE4A] px-6 py-3 font-bold tracking-wide text-black hover:bg-[#e6d43f] border-none">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[#F0DE4A]">
                <Play size={11} fill="currentColor" />
              </span>
              PLAY TODAY
            </button>
          </Link>
        </div>

        {/* Hero illustration */}
        <div className="hidden items-center justify-center md:flex">
          <img
            src="/images/—Pngtree—win clipart cartoon smiling boy_12151547 (1).png"
            alt="Smiling Boy Cartoon"
            className="w-full max-w-sm rounded-[2.5rem] drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
