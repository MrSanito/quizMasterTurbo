"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

// Left → right order matches the podium layout: 3rd (short), 1st (tallest, center), 2nd (medium)
const PODIUM = [
  { place: 3, barHeight: "h-28", img: "/avatars/avatar6.svg", name: "Mikasa" },
  { place: 1, barHeight: "h-40", img: "/avatars/avatar3.svg", name: "Akram" },
  { place: 2, barHeight: "h-32", img: "/avatars/avatar2.svg", name: "Vishal" },
];

export default function WinnersSection() {
  return (
    <section className="relative overflow-hidden bg-white py-24 text-gray-800">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">QuizMaster Winners</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-500">
          Compete every day and secure your place on the podium! These are our top performing champions who dominated the leaderboard.
        </p>
      </div>

      <div className="relative mx-auto mt-20 flex max-w-md items-end justify-center gap-6 px-6">
        {/* soft radial glow behind the podium, as in the source */}
        <div className="absolute left-1/2 top-0 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-100 opacity-80 blur-3xl" />

        {PODIUM.map((w) => (
          <div key={w.place} className="flex flex-col items-center">
            {/* Avatar */}
            <div className="relative -mb-6 h-20 w-20 flex items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow-md">
              <img
                src={w.img}
                alt={`${w.name}, place ${w.place}`}
                className="h-14 w-14 object-contain"
              />
            </div>
            {/* Podium Bar */}
            <div
              className={`flex ${w.barHeight} w-24 flex-col items-center justify-end rounded-t-3xl bg-gradient-to-b from-[#b2c9ff] to-[#5F37B8] pb-4 shadow-lg`}
            >
              <span className="font-bold text-white text-xs tracking-wide uppercase mb-1">
                {w.name}
              </span>
              <span className="text-3xl font-extrabold text-white">{w.place}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 flex justify-center">
        <button className="btn h-auto gap-2 rounded-full bg-[#9B6CF0] px-6 py-3 font-bold tracking-wide text-white hover:bg-[#8a5ce0] border-none shadow-lg transition-all duration-300">
          LEARN MORE <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
