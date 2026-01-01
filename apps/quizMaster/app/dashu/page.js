/* eslint-disable react/no-unescaped-entities */
"use client"; // Add this at the top of the file
import { FaCheckCircle, FaFire, FaStar, FaTrophy } from "react-icons/fa";
import React, { useEffect, useState } from "react";

const CategoryQuizzes = () => {
  const categories = [
    { name: "Geography", quizzes: 3, color: "bg-blue-500", icon: "🌐" },
    { name: "Science", quizzes: 2, color: "bg-green-500", icon: "⚗️" },
    { name: "Movies &amp; TV", quizzes: 2, color: "bg-red-500", icon: "🎥" },
    { name: "Music", quizzes: 2, color: "bg-purple-500", icon: "🎵" },
    { name: "History", quizzes: 2, color: "bg-yellow-500", icon: "📚" },
    { name: "Sports", quizzes: 2, color: "bg-green-600", icon: "⚽" },
  ];

  const getTimeLeft = () => {
    const now = new Date();
    const indiaOffset = 5.5 * 60 * 60 * 1000; // IST offset in ms
    const istNow = new Date(now.getTime() + indiaOffset);
    const nextMidnight = new Date(
      istNow.getFullYear(),
      istNow.getMonth(),
      istNow.getDate() + 1,
      0,
      0,
      0
    );
    const timeDiff = nextMidnight - istNow;
    return Math.max(0, timeDiff);
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  // Timer to update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeLeft();
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format time (HH:MM:SS)
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center p-4 space-y-8">
      {/* Main Stats Section */}
      <div className="flex flex-wrap gap-4 justify-center w-72 sm:w-1/3">
        {[
          {
            icon: <FaCheckCircle className="text-primary text-2xl" />,
            label: "Quiz completed",
          },
          {
            icon: <FaFire className="text-error text-2xl" />,
            label: "Current streak",
          },
          {
            icon: <FaStar className="text-warning text-2xl" />,
            label: "Total points",
          },
          {
            icon: <FaTrophy className="text-success text-2xl" />,
            label: "#rank",
          },
        ].map((item, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-base-200 to-base-300 p-3 rounded-lg shadow-lg flex items-center gap-2 w-1/2 sm:w-40"
          >
            {item.icon}
            <div>
              <h3 className="text-xs font-semibold text-primary">
                {item.label}
              </h3>
              <p className="text-lg font-bold text-gray-300">00</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Quiz Challenge Section */}
      <section className="card bg-base-100 shadow-lg p-6 rounded-xl w-full sm:w-2/3">
        <div className="flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0">
          {/* Left Content */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Daily Quiz Challenge</h2>
            <h3 className="text-md font-bold">
              {"Today's Topic: Science & Nature"}
            </h3>
            <p className="text-sm text-gray-600">
              {
                "Test your knowledge in today's quiz about Earth's atmosphere and environmental science."
              }
            </p>
            <div className="flex justify-start space-x-4 mt-3">
              <p className="text-sm">
                <strong>Time to complete:</strong> 15 minutes
              </p>
              <p className="text-sm">
                <strong>Difficulty:</strong> ⭐⭐⭐
              </p>
            </div>
          </div>

          {/* Streak Progress and Timer Section */}
          <div className="flex flex-col items-center space-y-4">
            {/* Streak Tracker */}
            <div className="flex justify-center space-x-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (day, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full ${
                      index < 3 ? "bg-success" : "bg-base-300"
                    } flex items-center justify-center`}
                  >
                    <p className="text-xs text-gray-700">{day.charAt(0)}</p>
                  </div>
                )
              )}
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center space-x-4">
              <div className="bg-base-200 p-4 rounded-lg shadow-md">
                <p className="text-sm text-gray-500">Next Quiz available in:</p>
                <p className="text-lg font-bold text-primary">
                  {formatTime(timeLeft)}
                </p>
              </div>

              {/* Radial Progress */}
              <div
                className="radial-progress text-primary"
                style={{
                  "--value": (timeLeft / (24 * 60 * 60 * 1000)) * 100,
                }}
              >
                {Math.round((timeLeft / (24 * 60 * 60 * 1000)) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="Categories container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Category Quizzes</h2>
          <a href="#" className="text-primary hover:underline">
            View All
          </a>
        </div>

        {/* Tabs */}
        <div className="tabs mb-4">
          <a className="tab tab-bordered tab-active">All Categories</a>
          <a className="tab tab-bordered">Popular</a>
          <a className="tab tab-bordered">Recent</a>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-lg font-semibold">Difficulty:</span>
          <div className="btn-group">
            <button className="btn btn-outline btn-sm">Medium</button>
            <button className="btn btn-outline btn-sm">Hard</button>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`card ${category.color} text-white shadow-xl cursor-pointer`}
            >
              <div className="card-body flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold">{category.name}</h3>
                    <p className="text-sm">{category.quizzes} quizzes</p>
                  </div>
                </div>
                <span className="text-xl">➡️</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CategoryQuizzes;
