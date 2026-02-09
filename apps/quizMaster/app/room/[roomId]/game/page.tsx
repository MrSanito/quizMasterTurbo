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
    <div className="max-w-xl w-full mx-auto p-4 flex flex-col gap-8 animate-in zoom-in duration-300">
      
      {/* Result Card */}
      <div className="card bg-base-100 shadow-lg border border-base-200">
        <div className="p-8 text-center">
             <h3 className="uppercase tracking-widest text-xs font-bold opacity-40 mb-3">Correct Answer</h3>
             <p className="text-2xl md:text-3xl font-bold text-success">{correctAnswer}</p>
        </div>
        <div className="card-body p-8 pt-0 text-center border-t border-base-100">
             <div className="flex flex-col gap-2 mt-4">
                 <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Your Score</span>
                 <span className="text-5xl font-black text-primary tracking-tighter">{myScore}</span>
             </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
          <div className="divider text-xs font-semibold opacity-30 uppercase tracking-widest">Top Players</div>
          <ul className="flex flex-col gap-2">
            {leaderboard.map((u, i) => (
              <li
                key={u.userId}
                className={`
                    flex items-center justify-between p-3 rounded-lg border transition-all
                    ${i === 0 
                        ? "bg-base-100 border-primary/20 shadow-sm" 
                        : "bg-transparent border-transparent hover:bg-base-100"
                    }
                `}
              >
                <div className="flex items-center gap-4">
                     <span className={`
                        w-6 text-center font-bold text-sm opacity-40
                     `}>
                        {i + 1}
                     </span>
                     <div className="flex flex-col">
                         <span className={`font-medium ${i === 0 ? 'text-primary font-bold' : 'text-base-content'}`}>
                            {u.name || "Unknown Player"}
                         </span>
                     </div>
                </div>
                <span className={`font-mono font-bold ${i === 0 ? 'text-primary' : 'opacity-60'}`}>
                    {u.score}
                </span>
              </li>
            ))}
          </ul>
      </div>
    </div>
  );
};

const FinalScreen = ({ leaderboard }: { leaderboard: LeaderboardItem[] }) => (
   <div className="flex flex-col items-center justify-center min-h-[90vh] gap-8 p-6 animate-in fade-in duration-1000">
    <div className="text-center space-y-4">
         <h1 className="text-5xl md:text-7xl font-black text-base-content tracking-tight">
          Game Over
        </h1>
        <p className="text-xl opacity-40 font-light">Final Statistics</p>
    </div>
    
    <div className="card w-full max-w-lg bg-base-100 shadow-xl border border-base-200">
      <div className="card-body p-0">
        <div className="flex flex-col divide-y divide-base-100">
           {leaderboard.map((u, i) => (
             <div 
                key={u.userId} 
                className={`flex items-center justify-between p-5 ${
                    i === 0 ? 'bg-base-50' : ''
                }`}
             >
                <div className="flex items-center gap-4">
                     <div className={`
                        w-8 h-8 rounded flex items-center justify-center text-sm font-bold
                        ${i === 0 ? 'bg-primary text-primary-content' : 'bg-base-200 opacity-50'}
                     `}>
                        {i + 1}
                     </div>
                     <div className="flex flex-col">
                        <span className={`font-bold text-lg ${i===0 ? 'text-primary' : ''}`}>
                            {u.name || "Unknown Player"}
                        </span>
                     </div>
                </div>
                <div className="text-right">
                    <span className={`block text-xl font-bold ${i===0 ? 'text-primary' : 'opacity-60'}`}>{u.score}</span>
                </div>
             </div>
           ))}
        </div>
      </div>
      <div className="p-6 bg-base-50/50 flex justify-center border-t border-base-100">
        <a href="/dashboard" className="btn btn-primary btn-outline btn-wide">
            Return to Dashboard
        </a>
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
            player: { 
                id: user.id, 
                name: user.firstName + " " + user.lastName || user.username || "Guest", 
                avatar: user.avatar 
            } 
        });
    });

    // SYNC: Restores state on reconnect
    socket.on("game:sync", (data: any) => {
        console.log("🔄 Sync:", data);
        if (data.leaderboard) {
            console.log("📊 Sync Leaderboard Data:", data.leaderboard);
            setLeaderboard(data.leaderboard);
        }
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
    socket.on("game:scoreUpdate", (data: { userId: string, score: number, name?: string }) => {
        setLeaderboard(prev => {
            const exists = prev.find(p => p.userId === data.userId);
            let newList;
            if (exists) {
                newList = prev.map(p => p.userId === data.userId ? { ...p, score: data.score, name: data.name || p.name } : p);
            } else {
                newList = [...prev, { userId: data.userId, score: data.score, name: data.name }];
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
        <div className="hidden md:flex flex-col w-80 bg-base-100 rounded-xl shadow-lg border border-base-200 h-fit sticky top-24 overflow-hidden">
            <div className="p-4 bg-primary text-primary-content flex items-center justify-between shadow-sm">
                <h3 className="font-black text-lg flex items-center gap-2 tracking-tight">
                    <Trophy className="w-5 h-5 text-yellow-500 fill-current" /> 
                    LEADERBOARD
                </h3>
                <span className="text-xs font-bold opacity-60 bg-white/20 px-2 py-1 rounded">LIVE</span>
            </div>
            <div className="flex flex-col divide-y divide-base-200 max-h-[70vh] overflow-y-auto">
                {leaderboard.length === 0 && <div className="p-8 text-center opacity-40 font-medium text-sm">Waiting for players...</div>}
                
                {leaderboard.map((p, i) => (
                    <div key={p.userId} className={`
                        flex items-center justify-between p-3 hover:bg-base-50 transition-colors
                        ${p.userId === user.id ? 'bg-blue-50/80 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
                    `}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`
                                w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                                ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                  i === 1 ? 'bg-gray-100 text-gray-700' :
                                  i === 2 ? 'bg-orange-100 text-orange-700' :
                                  'bg-base-200 text-base-content/60'}
                            `}>
                                {i + 1}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={`font-bold text-sm truncate w-28 ${p.userId === user.id ? 'text-blue-700' : ''}`}>
                                    {p.name || "Unknown Player"}
                                </span>
                            </div>
                        </div>
                        <span className="font-mono font-bold text-sm text-primary">{p.score}</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};
export default GamePage;