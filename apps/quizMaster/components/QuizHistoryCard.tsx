import React from "react";
import { FaFlask, FaCalculator, FaMusic } from "react-icons/fa";

const QuizHistoryCard = () => {
  const history = [
    {
      title: "Science",
      icon: <FaFlask className="text-primary" />,
      played: 14,
      total: 15,
      score: 48,
    },
    {
      title: "Maths",
      icon: <FaCalculator className="text-secondary" />,
      played: 15,
      total: 15,
      score: 55,
    },
    {
      title: "Music",
      icon: <FaMusic className="text-accent" />,
      played: 12,
      total: 15,
      score: 42,
    },
  ];

  return (
    <div className="w-full flex justify-center">
      <div className="card w-[90%] sm:w-[80%] lg:w-[70%] bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body gap-4">
          {/* Header */}
          <h2 className="text-lg sm:text-xl font-bold">📊 Quiz History</h2>

          {/* History Rows */}
          <div className="flex flex-col gap-3">
            {history.map((quiz, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-base-200"
              >
                {/* Left */}
                <div className="flex items-center gap-3">
                  <span className="text-lg">{quiz.icon}</span>
                  <div className="flex flex-col">
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-xs opacity-70">
                      Quizzes played: {quiz.played} / {quiz.total}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <p className="text-sm sm:text-base font-semibold">
                  {quiz.score} / 60
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-xs opacity-60">
            Score calculated from <b>4 questions × 15 points = 60</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizHistoryCard;
