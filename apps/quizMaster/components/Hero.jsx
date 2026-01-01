"use client";

import Link from "next/link";
import React from "react";

const HeroSection = () => {
  return (
    <section className="bg-base-100 min-h-screen flex items-center justify-center px-6 md:px-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Join the Ultimate <br /> Quiz Challenge Today!
          </h1>
          <p className="text-lg text-gray-600">
            Dive into a world of fun and knowledge with our interactive quizzes.
            Compete on the leaderboard, tackle daily challenges, and enhance
            your skills while having a blast!
          </p>

          {/* Buttons */}
          <div className="flex gap-4">
            <Link href="/dashboard" passHref>
              <button className="btn btn-primary">Explore</button>
            </Link>
            <Link href="/signup" passHref>
              <button className="btn btn-outline">Sign Up</button>
            </Link>
          </div>
        </div>

        {/* Right Image Placeholder */}
        <div className="hidden md:flex justify-center">
          <div className="w-full h-72 md:h-96 bg-base-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Image Placeholder</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
