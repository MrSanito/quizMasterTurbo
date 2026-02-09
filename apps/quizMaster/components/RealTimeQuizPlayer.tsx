"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, CheckCircle, XCircle, Zap, Trophy, ChevronRight } from "lucide-react";

interface RealTimeQuizPlayerProps {
  question: {
    id: string; // or _id
    text: string;
    options: { text: string; isCorrect?: boolean }[] | string[];
  };
  qIndex: number;
  totalQuestions: number;
  score: number;
  timeLeft: number; // 🔥 ADDED
  startTime: number; // 🔥 ADDED
  onAnswer: (answer: string, timeTaken: number) => void; // 🔥 ADDED
  isAnswered: boolean;
  correctAnswer?: string; // Only available after answer/timeout
  instantFeedback?: { isCorrect: boolean, correctOptionText?: string } | null; // 🔥 NEW PROP
}

export default function RealTimeQuizPlayer({
  question,
  qIndex,
  totalQuestions,
  score,
  timeLeft: initialTimeLeft,
  startTime,
  onAnswer,
  isAnswered,
  correctAnswer,
  instantFeedback, // Destructure
}: RealTimeQuizPlayerProps) {
    
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [localTimeLeft, setLocalTimeLeft] = useState(initialTimeLeft);

  // Normalize options to objects if they are strings
  const options = useMemo(() => {
      if (!question.options) return [];
      return question.options.map(opt => 
          typeof opt === 'string' ? { text: opt } : opt
      );
  }, [question.options]);

  // Sync timer with server start time
  useEffect(() => {
    const interval = setInterval(() => {
    // ... same timer logic ...
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, Math.ceil(initialTimeLeft - elapsed));
      setLocalTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 100); 
    return () => clearInterval(interval);
  }, [startTime, initialTimeLeft]);

  const handleOptionSelect = (optionText: string) => {
    if (isAnswered) return;
    setSelectedOption(optionText);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    onAnswer(optionText, timeTaken);
  };

  // Reset local state when question changes
  useEffect(() => {
      setSelectedOption(null);
      setLocalTimeLeft(initialTimeLeft);
  }, [question.id, initialTimeLeft]); // removed startTime to avoid flickering

  return (
    <div className="min-h-[75dvh] flex items-center justify-center px-3 py-4 sm:p-5 bg-base-200/40 font-sans">
      <div className="w-full max-w-sm sm:max-w-xl rounded-2xl bg-base-100 shadow-xl border border-base-300">
        <div className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-5 md:p-8">
          
          {/* Header & Timer (Keep same) */}
          <div className="flex items-start justify-between w-full">
            <p className="text-xs sm:text-sm opacity-60 font-medium mt-1">Question {qIndex + 1} / {totalQuestions}</p>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1 text-[11px] font-bold opacity-60 px-1">
                <Trophy className="w-3 h-3" />
                <span>{score} pts</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-1.5 mb-1 opacity-70">
                <span className="text-xs font-medium">Time Left</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className={`text-3xl sm:text-4xl font-bold leading-none tabular-nums transition-colors ${localTimeLeft <= 5 ? "text-error animate-pulse" : ""}`}>{localTimeLeft}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-base-300 overflow-hidden">
              <div className={`h-full transition-all duration-1000 ease-linear ${localTimeLeft <= 5 ? "bg-error" : "bg-primary"}`} style={{ width: `${(localTimeLeft / initialTimeLeft) * 100}%` }} />
            </div>
            
            {/* Waiting Message */}
            {isAnswered && localTimeLeft > 0 && !instantFeedback && (
                 <div className="flex items-center gap-2 text-xs font-bold text-warning animate-pulse mt-1">
                    <Clock className="w-3 h-3" />
                    Waiting for server confirmation...
                 </div>
            )}
             {/* Result Message (Instant) */}
            {instantFeedback && (
                 <div className={`flex items-center gap-2 text-xs font-bold mt-1 ${instantFeedback.isCorrect ? 'text-success' : 'text-error'}`}>
                    {instantFeedback.isCorrect ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                    {instantFeedback.isCorrect ? "Correct! Waiting for others..." : "Wrong! Waiting for others..."}
                 </div>
            )}
          </div>

          {/* Question */}
          <h2 className="text-xl sm:text-2xl font-bold leading-snug">{question.text}</h2>

          {/* Options */}
          <div className="space-y-2.5 mt-1">
            {options.map((option, index) => {
              const optionText = option.text;
              const isSelected = selectedOption === optionText;

              let stateClass = "bg-base-100 border-base-300 hover:bg-base-200 hover:border-base-content/20 active:scale-[0.99]";

              // Priority 1: Correct Answer Revealed (End of Question)
              if (correctAnswer) {
                 if (optionText === correctAnswer) {
                    stateClass = "bg-success/10 text-success border-success";
                 } else if (isSelected) {
                    stateClass = "bg-error/10 text-error border-error";
                 } else {
                    stateClass = "bg-base-100 border-base-200 opacity-50";
                 }
              } 
              // Priority 2: Instant Feedback (Right/Wrong immediately for ME)
              else if (instantFeedback && isSelected) {
                  if (instantFeedback.isCorrect) {
                       stateClass = "bg-success/10 text-success border-success";
                  } else {
                       stateClass = "bg-error/10 text-error border-error";
                  }
              }
              // Priority 3: Just Selected (Waiting)
              else if (isSelected) {
                  stateClass = "bg-primary/10 text-primary border-primary";
              }
              // Priority 4: Disabled if answered
              else if (isAnswered) {
                   stateClass = "bg-base-100 border-base-200 opacity-50 cursor-not-allowed";
              }

              return (
                <button
                  key={index}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(optionText)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-200 group ${stateClass} ${
                    isSelected && !isAnswered ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <span className="text-left text-sm sm:text-base font-medium">{optionText}</span>
 
                  {/* Icons */}
                  {/* Correct (End of Q or Instant) */}
                  {((correctAnswer && optionText === correctAnswer) || (instantFeedback?.isCorrect && isSelected)) && (
                    <CheckCircle className="w-5 h-5 shrink-0" />
                  )}
                  
                  {/* Wrong (End of Q or Instant) */}
                  {((correctAnswer && isSelected && optionText !== correctAnswer) || (instantFeedback && !instantFeedback.isCorrect && isSelected)) && (
                    <XCircle className="w-5 h-5 shrink-0" />
                  )}
                  
                  {/* Selected (Waiting) */}
                  {isAnswered && !correctAnswer && !instantFeedback && isSelected && (
                     <div className="badge badge-primary badge-sm">Selected</div>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
