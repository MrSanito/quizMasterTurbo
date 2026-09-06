"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { io } from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";
import {
	Trophy,
} from "lucide-react";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";
import AbortedScreen from "@/components/AbortedScreen";
import Loading from "@/components/Loading";
import RealTimeQuizPlayer from "@/components/RealTimeQuizPlayer";

/* ---------------- Types ---------------- */

type GameState = "WAITING" | "COUNTDOWN" | "PLAYING" | "BREAK" | "FINISHED" | "ABORTED";

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
			{timeLeft > 0 ? timeLeft : ""}
		</div>
		<div className="loading loading-ring loading-lg text-primary"></div>
	</div>
);

const WaitingScreen = () => (
	<div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 animate-in fade-in duration-700">
		<div className="w-24 h-24 rounded-full border-4 border-dotted border-primary animate-spin-slow"></div>
		<h2 className="text-3xl font-bold opacity-80">
			Waiting for next question...
		</h2>
		<p className="text-sm opacity-50">Get ready to be fast!</p>
	</div>
);

const ResultScreen = ({
	correctAnswer,
	leaderboard,
	myScore,
}: {
	correctAnswer: string;
	leaderboard: LeaderboardItem[];
	myScore: number;
}) => (
	<div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 animate-in fade-in zoom-in duration-300">
		<h2 className="text-4xl font-black text-secondary">Round Over!</h2>
		<div className="card w-96 bg-base-100 shadow-xl border border-base-200">
			<div className="card-body items-center text-center">
				<h3 className="card-title text-sm opacity-70">Correct Answer:</h3>
				<p className="text-2xl font-bold text-success">
					{correctAnswer || "Time's Up!"}
				</p>
				<div className="divider"></div>
				<div className="stat">
					<div className="stat-title">Current Score</div>
					<div className="stat-value text-primary">{myScore} pts</div>
				</div>
			</div>
		</div>
	</div>
);

const FinalScreen = ({
	leaderboard,
}: {
	leaderboard: LeaderboardItem[];
}) => (
	<div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 animate-in zoom-in duration-500">
		<h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
			Podium Finish
		</h1>
		<div className="flex items-end justify-center gap-4 h-64">
			{/* 2nd Place */}
			{leaderboard[1] && (
				<div className="flex flex-col items-center">
					<span className="font-bold mb-2">{leaderboard[1].name || "Player 2"}</span>
					<div className="w-24 bg-slate-300 h-36 rounded-t-lg flex items-center justify-center text-2xl font-black text-slate-700 shadow-lg">
						2
					</div>
					<span className="text-sm font-semibold mt-1">{leaderboard[1].score} pts</span>
				</div>
			)}
			{/* 1st Place */}
			{leaderboard[0] && (
				<div className="flex flex-col items-center">
					<div className="badge badge-warning gap-1 mb-2 font-bold animate-bounce">
						👑 Winner
					</div>
					<span className="font-extrabold mb-2 text-lg text-primary">{leaderboard[0].name || "Winner"}</span>
					<div className="w-28 bg-yellow-400 h-48 rounded-t-lg flex items-center justify-center text-4xl font-black text-yellow-900 shadow-xl">
						1
					</div>
					<span className="font-bold text-primary mt-1">{leaderboard[0].score} pts</span>
				</div>
			)}
			{/* 3rd Place */}
			{leaderboard[2] && (
				<div className="flex flex-col items-center">
					<span className="font-bold mb-2">{leaderboard[2].name || "Player 3"}</span>
					<div className="w-24 bg-amber-700/40 h-24 rounded-t-lg flex items-center justify-center text-2xl font-black text-amber-900 shadow-lg">
						3
					</div>
					<span className="text-sm font-semibold mt-1">{leaderboard[2].score} pts</span>
				</div>
			)}
		</div>
	</div>
);

/* ---------------- Main Component ---------------- */

const GamePage = () => {
	const router = useRouter();
	const { user, loading, isLogin, accessToken } = useUser();
	const { roomId } = useParams<{ roomId: string }>();

	// Socket & State
	const socketRef = useRef<any>(null);
	const [gameState, setGameState] = useState<GameState>("WAITING");
	const [abortedMessage, setAbortedMessage] = useState<string>(
		"This room has been aborted and closed.",
	);
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
		if (!user || !roomId || !isLogin) return;

		let socket: any = null;
		let isCancelled = false;

		const initSocket = async () => {
			let ticket: string | null = null;
			try {
				const ticketRes = await api.post("/auth/ws-ticket");
				if (ticketRes.data?.success) {
					ticket = ticketRes.data.ticket;
				}
			} catch (err) {
				console.warn("Could not fetch WS single-use ticket, using fallback:", err);
			}

			if (isCancelled) return;

			// Connect
			socket = io(process.env.NEXT_PUBLIC_WS_BASE_URL!, {
				transports: ["websocket", "polling"],
				withCredentials: true,
				auth: {
					ticket: ticket || undefined,
					token: accessToken || undefined,
				},
				query: { roomId, userId: user.id },
			});

			socketRef.current = socket;

			socket.on("connect_error", (err: any) => {
				console.error("❌ Game Socket Auth / Connection Error:", err.message);
			});

			// Listeners
			socket.on("connect", () => {
				console.log(" Connected to Game Socket");
				socket.emit("game:join", {
					roomId,
					player: {
						id: user.id,
						name:
							`${user.firstName} ${user.lastName}` || user.username || "Guest",
						avatar: user.avatar,
					},
				});
			});

		// SYNC: Restores state on reconnect
		socket.on("game:sync", (data: any) => {
			console.log(" Sync:", data);
			if (
				data.error === "Room has been aborted and closed" ||
				data.gameState === "ABORTED" ||
				data.status === "ABORTED"
			) {
				setAbortedMessage(
					data.message || data.error || "This room has been aborted and closed.",
				);
				setGameState("ABORTED");
				return;
			}
			if (data.leaderboard) {
				console.log(" Sync Leaderboard Data:", data.leaderboard);
				setLeaderboard(data.leaderboard);
			}
			setGameState(data.gameState);
			setMyScore(data.myScore);

			if (data.currentQuestion) {
				setCurrentQuestion(data.currentQuestion);
				setTimeLeft(data.timeLeft || 15);
				// Prefer server startTime, else approximate
				setStartTime(
					data.startTime || Date.now() - (data.elapsedMs || 0),
				);
			} else {
				setCurrentQuestion(null);
			}

			if (data.gameState === "PLAYING") {
				setQIndex(data.questionIndex);
				setTotalQ(data.totalQuestions);
			}

			if (data.alreadyAnswered) {
				setSelectedAnswer(data.userAnswer || "SUBMITTED");
			} else {
				setSelectedAnswer(null);
			}
		});

		// COUNTDOWN
		socket.on("game:countdown", (data: any) => {
			console.log(" Countdown:", data);
			setGameState("COUNTDOWN"); // Ensure we are in countdown state
			setTimeLeft(data.timeLeft);
		});

		// START QUESTION
		socket.on("game:questionStart", (data: any) => {
			console.log(" Question Start:", data);
			setGameState("PLAYING");
			setCurrentQuestion(data.question);
			setQIndex(data.questionIndex);
			setTotalQ(data.totalQuestions);
			setTimeLeft(data.timeLimit);
			setStartTime(data.startTime || Date.now()); // Sync Timer
			setSelectedAnswer(null); // Reset answer
		});

		// LIVE SCORE UPDATE
		socket.on(
			"game:scoreUpdate",
			(data: { userId: string; score: number; name?: string }) => {
				setLeaderboard((prev) => {
					const exists = prev.find((p) => p.userId === data.userId);
					let newList;
					if (exists) {
						newList = prev.map((p) =>
							p.userId === data.userId
								? { ...p, score: data.score, name: data.name || p.name }
								: p,
						);
					} else {
						newList = [
							...prev,
							{ userId: data.userId, score: data.score, name: data.name },
						];
					}
					return newList.sort((a, b) => b.score - a.score); // Keep sorted
				});

				if (data.userId === user.id) {
					setMyScore(data.score);
				}
			},
		);

		// Live Answer Result (Instant Feedback)
		socket.on(
			"game:answerResult",
			(data: {
				isCorrect: boolean;
				correctOptionText?: string;
				points: number;
				newScore: number;
			}) => {
				console.log(" Answer Result:", data);
				if (data.isCorrect) {
					toast.success(`Correct! +${data.points}`);
					new Audio("/sounds/correct.mp3").play().catch((_e) => {}); // Optional sound
				} else {
					toast.error(`Wrong! ${data.points}`);
					new Audio("/sounds/wrong.mp3").play().catch((_e) => {}); // Optional sound
				}
				setMyScore(Number(data.newScore)); // Update score immediately

				// Pass result to Player Component
				setInstantFeedback({
					isCorrect: data.isCorrect,
					correctOptionText: data.correctOptionText, // Backend should send this if we want to show it
				});
			},
		);

		// END QUESTION (Show Results)
		socket.on("game:questionEnd", (data: any) => {
			console.log(" Question End:", data);
			setGameState("BREAK");
			setLastCorrectAnswer(data.correctOptionId); // backend sends text
			setLeaderboard(data.leaderboard);
			const me = data.leaderboard.find((p: any) => p.userId === user.id);
			if (me) setMyScore(me.score);
			setInstantFeedback(null); // Reset for next
		});

		// GAME FINISHED
		socket.on("game:finished", (data: any) => {
			console.log(" Game Finished:", data);
			setGameState("FINISHED");
			setLeaderboard(data.results);

			// Redirect to Result Page after 5 seconds to allow worker to finish
			setTimeout(() => {
				router.replace(`/room/${roomId}/result`);
			}, 5000);
		});

		// DUPLICATE SESSION EVENT
		const onDuplicateSession = (data: any) => {
			const msg = data?.message || "You opened this quiz room in another tab or window.";
			toast.warn(msg);
			setAbortedMessage(msg);
			setGameState("ABORTED");
		};

		socket.on("lobby:duplicateSession", onDuplicateSession);
		socket.on("game:duplicateSession", onDuplicateSession);

		// ABORT EVENT
		const onRoomAborted = (data: any) => {
			setAbortedMessage(
				data?.message || "The room has been closed.",
			);
			setGameState("ABORTED");
		};

		socket.on("lobby:aborted", onRoomAborted);
		socket.on("game:aborted", onRoomAborted);

		// ERRORS
		socket.on("error", (data: any) => {
			console.error("Socket Error:", data);

			if (
				data?.message === "Room not active" ||
				data?.message === "User is not a participant in this game" ||
				data?.message?.toLowerCase().includes("aborted") ||
				data?.message?.toLowerCase().includes("closed") ||
				data?.message?.toLowerCase().includes("destroyed")
			) {
				setAbortedMessage(data.message || "This room has been aborted and closed.");
				setGameState("ABORTED");
				return;
			}
			toast.error(data?.message || "An unknown error occurred");
		});
		};

		initSocket();

		return () => {
			isCancelled = true;
			if (socket) {
				socket.off("lobby:aborted");
				socket.off("game:aborted");
				socket.off("lobby:duplicateSession");
				socket.off("game:duplicateSession");
				socket.disconnect();
			}
		};
	}, [roomId, user?.id, isLogin, accessToken, router.replace]);

	// State for instant feedback
	const [instantFeedback, setInstantFeedback] = useState<{
		isCorrect: boolean;
		correctOptionText?: string;
	} | null>(null);

	// 2. Redirect on Finish
	useEffect(() => {
		if (gameState === "FINISHED") {
			console.log(" Game state is FINISHED, redirecting to result page...");
			const timer = setTimeout(() => {
				router.replace(`/room/${roomId}/result`);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [gameState, roomId, router.replace]);

	// 3. Actions
	const handleAnswer = (answer: string, timeTaken: number) => {
		if (selectedAnswer) return; // prevent double click
		setSelectedAnswer(answer);

		// Emit
		const socket = socketRef.current;
		if (socket) {
			socket.emit("game:submitAnswer", { roomId, answer, timeTaken });
		}
	};

	/* Render */
	if (loading) return <Loading />;
	if (!user) return <div className="p-10 text-center">Please Login</div>;

	if (gameState === "ABORTED") {
		return <AbortedScreen roomId={roomId} message={abortedMessage} />;
	}

	return (
		<div className="min-h-screen bg-base-200 flex flex-col font-sans">
			<ToastContainer position="top-center" theme="colored" />

			{/* Navbar */}
			<div className="navbar bg-base-100 shadow-md px-4 sticky top-0 z-50">
				<div className="flex-1">
					<span className="font-black text-2xl text-primary">
						QuizMaster Live
					</span>
				</div>
				<div className="flex-none gap-4">
					<div className="badge badge-lg font-bold">My Score: {myScore}</div>
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
							instantFeedback={instantFeedback} //  Pass feedback
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
						<span className="text-xs font-bold opacity-60 bg-white/20 px-2 py-1 rounded">
							LIVE
						</span>
					</div>
					<div className="flex flex-col divide-y divide-base-200 max-h-[70vh] overflow-y-auto">
						{leaderboard.length === 0 && (
							<div className="p-8 text-center opacity-40 font-medium text-sm">
								Waiting for players...
							</div>
						)}

						{leaderboard.map((p, i) => (
							<div
								key={p.userId}
								className={`
                        flex items-center justify-between p-3 hover:bg-base-50 transition-colors
                        ${p.userId === user.id ? "bg-blue-50/80 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}
                    `}
							>
								<div className="flex items-center gap-3 overflow-hidden">
									<div
										className={`
                                w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                                ${
																	i === 0
																		? "bg-yellow-100 text-yellow-700"
																		: i === 1
																			? "bg-gray-100 text-gray-700"
																			: i === 2
																				? "bg-orange-100 text-orange-700"
																				: "bg-base-200 text-base-content/60"
																}
                            `}
									>
										{i + 1}
									</div>
									<div className="flex flex-col min-w-0">
										<span
											className={`font-bold text-sm truncate w-28 ${p.userId === user.id ? "text-blue-700" : ""}`}
										>
											{p.name || "Unknown Player"}
										</span>
									</div>
								</div>
								<span className="font-mono font-bold text-sm text-primary">
									{p.score}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
export default GamePage;
