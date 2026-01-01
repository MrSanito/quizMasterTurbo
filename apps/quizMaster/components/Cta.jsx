"use client";
import React from "react";
import Link from "next/link";

const Cta = () => {
  return (
    <section className="bg-base-100 py-20">
      <div className="container mx-auto px-5 lg:px-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left Content */}
          <div className="max-w-xl text-left">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Join the Quiz Challenge Today!
            </h1>
            <p className="text-base text-gray-600 mb-6">
              Sign up now to access exciting quizzes and daily challenges
              tailored just for you!
            </p>

            {/* Buttons */}
            <div className="flex gap-4">
              <Link
                href="/signup"
                className="btn btn-primary px-6 py-3 text-white"
              >
                Sign Up
              </Link>
              <Link href="/login" className="btn btn-outline px-6 py-3">
                Log In
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full max-w-xs lg:max-w-sm">
            <div className="bg-gray-300 rounded-lg w-full h-60 flex items-center justify-center shadow-lg">
              <span className="text-gray-500">Image Placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
