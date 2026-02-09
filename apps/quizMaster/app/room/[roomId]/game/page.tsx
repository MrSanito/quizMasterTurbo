"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import api from "@/app/lib/api";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUser } from "@/app/(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import RealTimeQuizPlayer from "@/components/RealTimeQuizPlayer";
import { Trophy } from "lucide-react";

/* ---------------- Types ---------------- */

type GameState = "WAITING" | "COUNTDOWN" | "PLAYING" | "BREAK" | "FINISHED";

type Question = {
  id: string;
  text: string;
  options: string[]; // or object array depending on your data
  // correct answer is HIDDEN
};

type LeaderboardItem = {
  userId: string;
  score: number;
  name?: string; // Optional, might need to fetch or map from id
  avatar?: string;
};

/* ---------------- Components ---------------- */

const CountdownScreen = ({ timeLeft }: { timeLeft: number }) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 animate-in fade-in zoom-in duration-500">
    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-pulse">
      {timeLeft <= 1 ? "Get Ready!" : "Game Starting..."}
    </h2>
    <div className="text-[12rem] font-black text-white drop-shadow-lg leading-none">
        {timeLeft > 0 ? timeLeft : "🚀"}
    </div>
    <div className="loading loading-ring loading-lg text-primary"></div>
  </div>
);

const WaitingScreen = () => (
   <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 animate-in fade-in duration-700">
    <div className="w-24 h-24 rounded-full border-4 border-dotted border-primary animate-spin-slow"></div>
    <h2 className="text-3xl font-bold opacity-80">Waiting for next question...</h2>
    <p className="text-sm opacity-50">Get ready to be fast!</p>
  </div>
)



const ResultScreen = ({
  correctAnswer,
  leaderboard,
  myScore,
}: {
  correctAnswer: string;
  leaderboard: LeaderboardItem[];
  myScore: number;
}) => {
  return (
    <div className="max-w-md w-full mx-auto p-4 flex flex-col gap-6 text-center animate-in zoom-in duration-300">
      
      {/* Result Card */}
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="bg-success text-success-content p-6">
             <h3 className="uppercase tracking-widest text-xs font-bold opacity-80 mb-2">Correct Answer</h3>
             <p className="text-3xl font-black">{correctAnswer}</p>
        </div>
        <div className="card-body p-6 bg-base-100">
             <div className="flex flex-col gap-1">
                 <span className="text-sm opacity-60">Your Current Score</span>
                 <span className="text-5xl font-black text-primary">{myScore}</span>
             </div>
        </div>
      </div>

      <div className="divider opacity-50 text-xs">TOP 5 PLAYERS</div>

      {/* Leaderboard List */}
      <ul className="flex flex-col gap-2">
        {leaderboard.map((u, i) => (
          <li
            key={u.userId}
            className={`
                flex items-center justify-between p-3 rounded-xl border-2 transition-all
                ${i === 0 ? "bg-amber-50 border-amber-400 shadow-amber-200 shadow-md scale-105" : "bg-base-100 border-base-200"}
            `}
          >
            <div className="flex items-center gap-3">
                 <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${i === 0 ? 'bg-amber-400 text-white' : 'bg-base-300 opacity-50'}
                 `}>
                    #{i + 1}
                 </div>
                 <div className="flex flex-col items-start leading-none">
                     <span className="font-bold text-sm">{u.userId.slice(0, 10)}</span>
                     {i === 0 && <span className="text-[10px] text-amber-600 font-bold">👑 LEADER</span>}
                 </div>
            </div>
            <span className="font-mono font-bold text-lg opacity-80">{u.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FinalScreen = ({ leaderboard }: { leaderboard: LeaderboardItem[] }) => (
   <div className="flex flex-col items-center justify-center min-h-[90vh] gap-8 p-4 bg-[url('/confetti-bg.svg')] bg-cover animate-in fade-in duration-1000">
    <div className="text-center space-y-2">
         <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary drop-shadow-xl">
          GAME OVER
        </h1>
        <p className="text-xl opacity-60 font-medium">The results are in!</p>
    </div>
    
    <div className="card w-full max-w-xl bg-base-100/90 backdrop-blur shadow-2xl border-4 border-base-300">
      <div className="card-body">
        <h2 className="card-title justify-center mb-6 text-2xl font-bold uppercase tracking-wider">🏆 Final Standings</h2>
        
        <div className="flex flex-col gap-4">
           {leaderboard.map((u, i) => (
             <div 
                key={u.userId} 
                className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                    i === 0 ? 'bg-yellow-50 border-yellow-400 relative overflow-hidden' : 'bg-base-100 border-base-200'
                }`}
             >
                {/* Gold Shine Effect */}
                {i === 0 && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 translate-x-[-150%] animate-shimmer" />}
                
                <div className="flex items-center gap-4 z-10">
                     <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shadow-inner
                        ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-white ring-4 ring-yellow-200' : ''}
                        ${i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : ''}
                        ${i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' : ''}
                        ${i > 2 ? 'bg-base-200 text-opacity-50' : ''}
                     `}>
                        {i + 1}
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-lg">{u.userId.slice(0, 12)}</span>
                        {i === 0 && <span className="text-xs font-bold text-yellow-600">WINNER</span>}
                     </div>
                </div>
                <div className="text-right z-10">
                    <span className="block text-2xl font-black">{u.score}</span>
                    <span className="text-xs opacity-50 font-bold uppercase">Points</span>
                </div>
             </div>
           ))}
        </div>
        
        <div className="card-actions justify-center mt-8">
            <a href="/dashboard" className="btn btn-primary btn-wide btn-lg shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
                Return to Dashboard
            </a>
        </div>
      </div>
    </div>
   </div>
)


const GamePage = () => {
  const router = useRouter();
  const { user, loading, isLogin } = useUser();
  const { roomId } = useParams<{ roomId: string }>();
  
  // Socket & State
  const socketRef = useRef<any>(null);
  const [gameState, setGameState] = useState<GameState>("WAITING");
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Game Data
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  
  // User Data
  const [myScore, setMyScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // Results
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  // 1. Init Socket
  useEffect(() => {
    if (!user || !roomId) return;

    // Connect
    socketRef.current = io(process.env.NEXT_PUBLIC_WS_BASE_URL!, {
        transports: ["websocket"],
        query: { roomId, userId: user.id } // Pass initial params if needed
    });

    const socket = socketRef.current;

    // Listeners
    socket.on("connect", () => {
        console.log("🔌 Connected to Game Socket");
        socket.emit("game:join", { 
            roomId, 
            player: { id: user.id, name: user.firstName, avatar: user.avatar } 
        });
    });

    // SYNC: Restores state on reconnect
    socket.on("game:sync", (data: any) => {
        console.log("🔄 Sync:", data);
        setGameState(data.gameState);
        setMyScore(data.myScore);
        
        if (data.currentQuestion) {
            setCurrentQuestion(data.currentQuestion);
            setTimeLeft(data.timeLeft || 15);
            // Prefer server startTime, else approximate
            setStartTime(data.startTime || (Date.now() - ((15 - (data.timeLeft || 15)) * 1000)));
            
            // Sync Progress
            if (data.questionIndex !== undefined) setQIndex(data.questionIndex);
            if (data.totalQuestions !== undefined) setTotalQ(data.totalQuestions);

            // Restore Answer
            if (data.userAnswer) {
                setSelectedAnswer(data.userAnswer);
            } else {
                setSelectedAnswer(null);
            }
        }
    });

    // 🕒 COUNTDOWN (Server Driven)
    socket.on("game:countdown", (data: { timeLeft: number }) => {
        console.log("⏳ Countdown:", data.timeLeft);
         setGameState("COUNTDOWN"); // Ensure we are in countdown state
        setTimeLeft(data.timeLeft);
    });

    // START QUESTION
    socket.on("game:questionStart", (data: any) => {
        console.log("❓ Question Start:", data);
        setGameState("PLAYING");
        setCurrentQuestion(data.question);
        setQIndex(data.questionIndex);
        setTotalQ(data.totalQuestions);
        setTimeLeft(data.timeLimit);
        setStartTime(data.startTime || Date.now()); // Sync Timer
        setSelectedAnswer(null); // Reset answer
    });

    // LIVE SCORE UPDATE
    socket.on("game:scoreUpdate", (data: { userId: string, score: number }) => {
        setLeaderboard(prev => {
            const exists = prev.find(p => p.userId === data.userId);
            let newList;
            if (exists) {
                newList = prev.map(p => p.userId === data.userId ? { ...p, score: data.score } : p);
            } else {
                newList = [...prev, { userId: data.userId, score: data.score }];
            }
            return newList.sort((a,b) => b.score - a.score); // Keep sorted
        });
        
        if (data.userId === user.id) {
            setMyScore(data.score);
        }
    });

    // Live Answer Result (Instant Feedback)
    socket.on("game:answerResult", (data: { isCorrect: boolean, correctOptionText?: string, points: number, newScore: number }) => {
        console.log("📝 Answer Result:", data);
        if (data.isCorrect) {
            toast.success(`Correct! +${data.points}`);
            new Audio("/sounds/correct.mp3").play().catch(e => {}); // Optional sound
        } else {
            toast.error(`Wrong! ${data.points}`);
            new Audio("/sounds/wrong.mp3").play().catch(e => {}); // Optional sound
        }
        setMyScore(Number(data.newScore)); // Update score immediately
        
        // Pass result to Player Component
        setInstantFeedback({
            isCorrect: data.isCorrect,
            correctOptionText: data.correctOptionText // Backend should send this if we want to show it
        });
    });

    // END QUESTION (Show Results)
    socket.on("game:questionEnd", (data: any) => {
        console.log("🛑 Question End:", data);
        setGameState("BREAK");
        setLastCorrectAnswer(data.correctOptionId); // backend sends text
        setLeaderboard(data.leaderboard);
        const me = data.leaderboard.find((p: any) => p.userId === user.id);
        if(me) setMyScore(me.score);
        setInstantFeedback(null); // Reset for next
    });

    // GAME FINISHED
    socket.on("game:finished", (data: any) => {
        console.log("🏁 Game Finished:", data);
        setGameState("FINISHED");
        setLeaderboard(data.results);
        
        // Redirect to Result Page after 3 seconds
        setTimeout(() => {
            router.replace(`/room/${roomId}/result`);
        }, 3000);
    });

    // ERRORS
    socket.on("error", (data: any) => {
        console.error("Socket Error:", data);
        toast.error(data.message || "An unknown error occurred");
        
        // Redirect to Lobby if room is not active/valid
        if (data.message === "Room not active" || data.message === "User is not a participant in this game") {
             setTimeout(() => {
                 router.replace(`/room/${roomId}/lobby`);
             }, 2000);
        }
    });

    return () => {
        socket.disconnect();
    };
  }, [roomId, user]);
  
  // State for instant feedback
  const [instantFeedback, setInstantFeedback] = useState<{ isCorrect: boolean, correctOptionText?: string } | null>(null);


  // 2. Redirect on Finish
  useEffect(() => {
    if (gameState === "FINISHED") {
        console.log("🏁 Game state is FINISHED, redirecting to result page...");
         const timer = setTimeout(() => {
            router.replace(`/room/${roomId}/result`);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [gameState, roomId]);

  // 3. Actions
  const handleAnswer = (answer: string, timeTaken: number) => {
    if (selectedAnswer) return; // prevent double click
    setSelectedAnswer(answer);
    
    // Emit
    const socket = socketRef.current;
    if(socket) {
        socket.emit("game:submitAnswer", { roomId, answer, timeTaken });
    }
  };


  /* Render */
  if (loading) return <Loading />;
  if (!user) return <div className="p-10 text-center">Please Login</div>;

  return (
    <div className="min-h-screen bg-base-200 flex flex-col font-sans">
      <ToastContainer position="top-center" theme="colored" />
      
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-md px-4 sticky top-0 z-50">
        <div className="flex-1">
            <span className="font-black text-2xl text-primary">
                QuizMaster Live 🔴
            </span>
        </div>
        <div className="flex-none gap-4">
             <div className="badge badge-lg font-bold">
                My Score: {myScore}
             </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
        
        {/* LEFT: Game Area */}
        <div className="flex-1">
            {gameState === "WAITING" && <WaitingScreen />}
            {gameState === "COUNTDOWN" && <CountdownScreen timeLeft={timeLeft} />}
            
            {gameState === "PLAYING" && currentQuestion && (
                <RealTimeQuizPlayer 
                    question={currentQuestion}
                    qIndex={qIndex}
                    totalQuestions={totalQ}
                    score={myScore}
                    timeLeft={timeLeft}
                    startTime={startTime}
                    onAnswer={handleAnswer}
                    isAnswered={!!selectedAnswer}
                    instantFeedback={instantFeedback} // 🔥 Pass feedback
                />
            )}

            {gameState === "BREAK" && (
                <ResultScreen 
                    correctAnswer={lastCorrectAnswer}
                    leaderboard={leaderboard}
                    myScore={myScore}
                />
            )}

            {gameState === "FINISHED" && (
                <FinalScreen leaderboard={leaderboard} />
            )}
        </div>

        {/* RIGHT: Live Scoreboard (Cricket Style) */}
        <div className="hidden md:flex flex-col w-80 bg-base-100 rounded-xl shadow-lg border border-base-300 h-fit sticky top-24">
            <div className="p-4 border-b border-base-200 bg-base-200/50 rounded-t-xl">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-warning" /> 
                    Live Standings
                </h3>
            </div>
            <div className="p-2 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
                {leaderboard.length === 0 && <p className="text-center p-4 opacity-50 text-sm">Waiting for scores...</p>}
                
                {leaderboard.map((p, i) => (
                    <div key={p.userId} className={`flex items-center justify-between p-3 rounded-lg border ${p.userId === user.id ? 'bg-primary/10 border-primary' : 'bg-base-100 border-base-200'}`}>
                        <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-warning text-warning-content' : 'bg-base-300'}`}>
                                {i + 1}
                            </span>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm truncate w-32">{p.name || p.userId.slice(0, 8)}</span>
                            </div>
                        </div>
                        <span className="font-mono font-bold">{p.score}</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};
export default GamePage;