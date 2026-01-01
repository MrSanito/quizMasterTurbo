"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientQuizPlayer({ quiz }) {
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute per question
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const router = useRouter();

  // Timer effect
  useEffect(() => {
    if (!started || isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, isAnswered]);

  const handleTimeUp = () => {
    setIsAnswered(true);
    setSelectedOption(null);
  };

  const handleOptionSelect = (optionIndex) => {
    if (isAnswered) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isCorrect = currentQuestion.options[optionIndex].isCorrect;

    if (isCorrect) {
      setScore((prev) => prev + 4); // +4 points for correct answer
    } else {
      setScore((prev) => prev - 1); // -1 point for incorrect answer
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(60);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz completed
      router.push(
        `/quiz/${quiz._id}/results?score=${score}&quizId=${quiz._id}`
      );
    }
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="card bg-base-200 shadow-xl max-w-2xl w-full">
          <div className="card-body">
            <h1 className="card-title text-3xl font-bold text-primary mb-4">
              {quiz.title}
            </h1>
            <div className="space-y-4 text-base-content">
              <p>Total Questions: {quiz.questions.length}</p>
              <p>Time per Question: 1 minute</p>
              <p>Scoring: +4 for correct, -1 for incorrect</p>
            </div>
            <div className="card-actions justify-end mt-8">
              <button
                onClick={() => setStarted(true)}
                className="btn btn-primary"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="card bg-base-200 shadow-xl max-w-2xl w-full">
        <div className="card-body">
          {/* Progress and Score */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-base-content">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </div>
            <div className="text-primary font-bold">Score: {score}</div>
          </div>

          {/* Timer */}
          <div className="mb-6">
            <div className="w-full bg-base-300 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
            <div className="text-right text-base-content mt-2">
              Time Left: {timeLeft}s
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl text-base-content mb-6">
              {currentQuestion.questionText}
            </h2>
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    isAnswered
                      ? option.isCorrect
                        ? "bg-success text-white"
                        : selectedOption === index
                        ? "bg-error text-white"
                        : "bg-base-300 text-base-content"
                      : "bg-base-300 text-base-content hover:bg-base-100"
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>

          {/* Next Button */}
          {isAnswered && (
            <div className="card-actions justify-end">
              <button onClick={handleNextQuestion} className="btn btn-primary">
                {currentQuestionIndex < quiz.questions.length - 1
                  ? "Next Question"
                  : "Finish Quiz"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
