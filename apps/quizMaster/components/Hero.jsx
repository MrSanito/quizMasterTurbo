"use client";

import Link from "next/link";
import React from "react";
import { FaCirclePlay } from "react-icons/fa6";
import { Check, Timer, Trophy, Flame } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const float = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const HeroSection = () => {
  return (
    <section className="bg-base-100 min-h-[86dvh] flex items-center justify-center px-6 md:px-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left Content */}
        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Join the Ultimate <br /> Quiz Challenge Today!
          </h1>

          <p className="text-lg text-gray-600">
            Dive into a world of fun and knowledge with our interactive quizzes.
            Compete on the leaderboard, tackle daily challenges, and enhance
            your skills while having a blast!
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/categories">
              <button className="btn btn-primary flex items-center gap-2">
                <FaCirclePlay />
                Start Quiz
              </button>
            </Link>

            <Link href="/signup">
              <button className="btn btn-outline">Sign Up</button>
            </Link>
          </div>
        </motion.div>

        {/* Right Visual */}
        <motion.div
          className="flex justify-center relative scale-90 sm:scale-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {/* Glow */}
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <div className="w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          </div>

          {/* Quiz Card */}
          <motion.div
            className="relative w-80 bg-base-100 rounded-2xl shadow-xl border p-5 z-10"
            variants={float}
            animate="animate"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400 uppercase">
                Science • Level 4
              </span>
              <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                <Timer size={14} />
                00:14
              </div>
            </div>

            {/* Question */}
            <h3 className="text-sm font-medium mb-4">
              Which planet is known as the Red Planet?
            </h3>

            {/* Options */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg border text-sm text-gray-500">
                Venus
              </div>

              <div className="p-3 rounded-lg border border-primary bg-primary/10 flex items-center gap-2 text-sm font-medium">
                <Check size={14} className="text-primary" />
                Mars
              </div>

              <div className="p-3 rounded-lg border text-sm text-gray-500">
                Jupiter
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500" />
                Top 5%
              </div>
              <span>Next →</span>
            </div>
          </motion.div>

          {/* Floating Streak */}
          <motion.div
            className="absolute top-6 right-0 bg-base-100 border shadow-md rounded-xl px-4 py-2 flex items-center gap-2"
            variants={float}
            animate="animate"
          >
            <Flame size={16} className="text-orange-500" />
            <div>
              <p className="text-[10px] text-gray-400">Daily Streak</p>
              <p className="text-sm font-semibold">12 Days</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
