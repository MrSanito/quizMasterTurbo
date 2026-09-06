"use client";

import {
	BarChart2,
	CheckCircle,
	Crown,
	Home,
	RefreshCw,
	Sparkles,
	Trophy,
	User,
	Users,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";
import AbortedScreen from "@/components/AbortedScreen";
import Loading from "@/components/Loading";

const FALLBACK_AVATAR = "/avatars/avatar1.svg";

const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
	e.currentTarget.onerror = null;
	e.currentTarget.src = FALLBACK_AVATAR;
};

export default function RoomResultPage() {
	const router = useRouter();
	const { roomId } = useParams<{ roomId: string }>();
	const { user } = useUser();
	const [loading, setLoading] = useState(true);
	const [isAborted, setIsAborted] = useState(false);
	const [abortedMessage, setAbortedMessage] = useState(
		"This room has been aborted and closed.",
	);
	const [resultData, setResultData] = useState<any[] | null>(null);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		let timeoutId: NodeJS.Timeout;

		const fetchResult = async () => {
			try {
				const res = await api.get(`/game/${roomId}/result`);
				if (isMounted && res.data.success) {
					if (res.data.state === "ABORTED" || res.data.state === "ABANDONED") {
						setIsAborted(true);
						setAbortedMessage("This room was aborted and closed.");
						setLoading(false);
						return;
					}
					if (res.data.state === "FINISHED") {
						console.log("🏆 Game Finished! Results:", res.data);
						setResultData(res.data.results || []);
						setLoading(false);
					} else {
						console.log("Game not marked FINISHED yet, retrying...");
						timeoutId = setTimeout(fetchResult, 2000);
					}
				}
			} catch (err: any) {
				console.error("Failed to fetch result", err);
				if (isMounted) {
					if (
						err.response?.status === 410 ||
						err.response?.data?.state === "ABORTED"
					) {
						setIsAborted(true);
						setAbortedMessage("This room has been aborted and closed.");
					}
					setLoading(false);
				}
			}
		};

		fetchResult();

		return () => {
			isMounted = false;
			clearTimeout(timeoutId);
		};
	}, [roomId]);

	// Sorted player rankings
	const sortedPlayers = useMemo(() => {
		if (!resultData || !Array.isArray(resultData)) return [];
		return [...resultData].sort((a, b) => (b.score || 0) - (a.score || 0));
	}, [resultData]);

	// Set initial selected player to current user (or winner if not found)
	const activeSelectedUser = useMemo(() => {
		if (sortedPlayers.length === 0) return null;
		if (selectedUserId) {
			const found = sortedPlayers.find((p) => p.user?.id === selectedUserId);
			if (found) return found;
		}
		const me = sortedPlayers.find((p) => p.user?.id === user?.id);
		return me || sortedPlayers[0];
	}, [sortedPlayers, selectedUserId, user?.id]);

	// Current logged-in player rank
	const myIndex = useMemo(() => {
		if (!user?.id || sortedPlayers.length === 0) return -1;
		return sortedPlayers.findIndex((p) => p.user?.id === user?.id);
	}, [sortedPlayers, user?.id]);

	const myResult = myIndex !== -1 ? sortedPlayers[myIndex] : null;

	// Rank of whichever player is currently selected in the detail panel
	const activeIndex = useMemo(() => {
		if (!activeSelectedUser) return -1;
		return sortedPlayers.findIndex(
			(p) => p.user?.id === activeSelectedUser.user?.id,
		);
	}, [sortedPlayers, activeSelectedUser]);

	if (loading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-base-200">
				<Loading />
				<p className="animate-pulse opacity-70 font-semibold text-lg">
					Finalizing scores & analyzing results...
				</p>
			</div>
		);
	}

	if (isAborted) {
		return <AbortedScreen roomId={roomId} message={abortedMessage} />;
	}

	if (!resultData || resultData.length === 0) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-base-200 p-6 text-center">
				<div className="card bg-base-100 p-8 shadow-xl max-w-md w-full border border-base-300">
					<h2 className="text-2xl font-bold text-error">No Results Found</h2>
					<p className="opacity-70 mt-2">
						The game data is still processing or this room has not concluded yet.
					</p>
					<div className="mt-6 flex justify-center gap-3">
						<button
							onClick={() => window.location.reload()}
							className="btn btn-primary"
						>
							<RefreshCw className="w-4 h-4 mr-1" /> Retry
						</button>
						<Link href="/dashboard" className="btn btn-outline">
							<Home className="w-4 h-4 mr-1" /> Dashboard
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-base-200 via-base-100 to-base-200 py-10 px-4 sm:px-6 font-sans">
			<div className="max-w-5xl mx-auto space-y-8">
				{/* Header */}
				<div className="text-center space-y-2">
					<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1">
						<Trophy className="w-4 h-4" /> Final Standings
					</div>
					<h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
						Game Results
					</h1>
					<p className="text-sm sm:text-base opacity-60 font-medium">
						Room Code: <span className="font-mono font-bold text-primary">{roomId}</span>
					</p>
				</div>

				{/* Podium Display for Top Players */}
				{sortedPlayers.length > 0 && (
					<div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4 sm:gap-6 pt-6 pb-2">
						{/* 2nd Place */}
						{sortedPlayers[1] && (
							<div
								onClick={() => setSelectedUserId(sortedPlayers[1].user?.id)}
								className={`cursor-pointer order-2 sm:order-1 card bg-base-100 shadow-[0_20px_40px_-15px_rgba(120,135,150,0.35)] border-2 transition-all hover:scale-[1.02] p-5 flex flex-col items-center text-center w-full sm:w-64 sm:max-w-xs ${
									activeSelectedUser?.user?.id === sortedPlayers[1].user?.id
										? "border-[#77828C] ring-4 ring-[#77828C]/30"
										: "border-[#AEB8C2]"
								}`}
							>
								<div className="relative mb-3">
									<div className="w-16 h-16 rounded-full ring-4 ring-[#AEB8C2] ring-offset-2 overflow-hidden bg-base-200">
										<img
											src={`/avatars/${sortedPlayers[1].user?.avatar || "avatar1.svg"}`}
											alt={sortedPlayers[1].user?.username}
											onError={handleAvatarError}
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="absolute -bottom-2 -right-2 bg-[#AEB8C2] text-[#2B3138] font-black text-xs px-2 py-0.5 rounded-full shadow">
										#2 🥈
									</div>
								</div>
								<h3 className="font-extrabold text-base truncate max-w-[160px]">
									{sortedPlayers[1].user?.firstName || sortedPlayers[1].user?.username}
								</h3>
								<p className="text-xs opacity-50 truncate max-w-[140px]">
									@{sortedPlayers[1].user?.username}
								</p>
								<div className="mt-3 font-mono font-black text-xl text-[#5B6670]">
									{sortedPlayers[1].score} pts
								</div>
								<span
									className={`badge badge-sm badge-neutral mt-2 font-bold ${
										sortedPlayers[1].user?.id === user?.id ? "" : "invisible"
									}`}
								>
									YOU
								</span>
							</div>
						)}

						{/* 1st Place (Winner) */}
						{sortedPlayers[0] && (
							<div
								onClick={() => setSelectedUserId(sortedPlayers[0].user?.id)}
								className={`cursor-pointer order-1 sm:order-2 card bg-gradient-to-b from-[#FBF3D9] to-base-100 shadow-[0_25px_55px_-12px_rgba(212,175,55,0.45)] border-2 transition-all hover:scale-[1.03] p-6 sm:py-8 flex flex-col items-center text-center relative w-full sm:w-72 sm:max-w-xs ${
									activeSelectedUser?.user?.id === sortedPlayers[0].user?.id
										? "border-[#D4AF37] ring-4 ring-[#D4AF37]/40"
										: "border-[#D4AF37]/70"
								}`}
							>
								<div className="absolute -top-5 text-[#C79A2E] animate-bounce">
									<Crown className="w-9 h-9 fill-current" />
								</div>
								<div className="relative mb-3 mt-1">
									<div className="w-20 h-20 rounded-full ring-4 ring-[#D4AF37] ring-offset-2 overflow-hidden bg-base-200 shadow-lg">
										<img
											src={`/avatars/${sortedPlayers[0].user?.avatar || "avatar1.svg"}`}
											alt={sortedPlayers[0].user?.username}
											onError={handleAvatarError}
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="absolute -bottom-2 -right-2 bg-[#D4AF37] text-[#4A3800] font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
										#1 👑
									</div>
								</div>
								<h3 className="font-black text-lg text-[#4A3800] truncate max-w-[180px]">
									{sortedPlayers[0].user?.firstName || sortedPlayers[0].user?.username}
								</h3>
								<p className="text-xs text-[#8A6D1F] truncate max-w-[150px]">
									@{sortedPlayers[0].user?.username}
								</p>
								<div className="mt-3 font-mono font-black text-2xl text-[#B8860B]">
									{sortedPlayers[0].score} pts
								</div>
								<span
									className={`badge badge-sm badge-warning mt-2 font-bold shadow-sm ${
										sortedPlayers[0].user?.id === user?.id ? "" : "invisible"
									}`}
								>
									YOU (WINNER!)
								</span>
							</div>
						)}

						{/* 3rd Place */}
						{sortedPlayers[2] && (
							<div
								onClick={() => setSelectedUserId(sortedPlayers[2].user?.id)}
								className={`cursor-pointer order-3 sm:order-3 card bg-base-100 shadow-[0_20px_40px_-15px_rgba(193,127,69,0.35)] border-2 transition-all hover:scale-[1.02] p-5 flex flex-col items-center text-center w-full sm:w-64 sm:max-w-xs ${
									activeSelectedUser?.user?.id === sortedPlayers[2].user?.id
										? "border-[#8A5A2D] ring-4 ring-[#8A5A2D]/30"
										: "border-[#C17F45]/60"
								}`}
							>
								<div className="relative mb-3">
									<div className="w-16 h-16 rounded-full ring-4 ring-[#C17F45]/70 ring-offset-2 overflow-hidden bg-base-200">
										<img
											src={`/avatars/${sortedPlayers[2].user?.avatar || "avatar1.svg"}`}
											alt={sortedPlayers[2].user?.username}
											onError={handleAvatarError}
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="absolute -bottom-2 -right-2 bg-[#C17F45] text-[#FBF0E4] font-black text-xs px-2 py-0.5 rounded-full shadow">
										#3 🥉
									</div>
								</div>
								<h3 className="font-extrabold text-base truncate max-w-[160px]">
									{sortedPlayers[2].user?.firstName || sortedPlayers[2].user?.username}
								</h3>
								<p className="text-xs opacity-50 truncate max-w-[140px]">
									@{sortedPlayers[2].user?.username}
								</p>
								<div className="mt-3 font-mono font-black text-xl text-[#8A5A2D]">
									{sortedPlayers[2].score} pts
								</div>
								<span
									className={`badge badge-sm badge-neutral mt-2 font-bold ${
										sortedPlayers[2].user?.id === user?.id ? "" : "invisible"
									}`}
								>
									YOU
								</span>
							</div>
						)}
					</div>
				)}

				{/* Complete Room Leaderboard Table */}
				<div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden rounded-2xl">
					<div className="p-4 sm:p-5 bg-base-200/50 border-b border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<div className="flex items-center gap-2 font-bold text-base sm:text-lg">
							<Users className="w-5 h-5 text-primary shrink-0" />
							<span>All Players Scoreboard ({sortedPlayers.length})</span>
						</div>
						<span className="text-xs opacity-60">Click any row to view individual question breakdown</span>
					</div>

					<div className="overflow-x-auto">
						<table className="table table-zebra w-full">
							<thead>
								<tr className="text-xs opacity-70 bg-base-200/30">
									<th className="w-20 text-center">Rank</th>
									<th>Player</th>
									<th className="text-center">Accuracy</th>
									<th className="text-right pr-6">Score</th>
									<th className="w-28 text-center">Action</th>
								</tr>
							</thead>
							<tbody>
								{sortedPlayers.map((player, idx) => {
									const isMe = player.user?.id === user?.id;
									const isSelected = activeSelectedUser?.user?.id === player.user?.id;
									const correctCount =
										player.answers?.filter((a: any) => a.isCorrect)?.length || 0;
									const totalAnswered = player.answers?.length || 0;
									const accuracy =
										totalAnswered > 0
											? Math.round((correctCount / totalAnswered) * 100)
											: 0;

									return (
										<tr
											key={player.user?.id || idx}
											onClick={() => setSelectedUserId(player.user?.id)}
											className={`cursor-pointer transition-colors ${
												isSelected
													? "bg-primary/10 font-medium"
													: isMe
														? "bg-primary/5"
														: "hover:bg-base-200/60"
											}`}
										>
											{/* Rank */}
											<td className="text-center align-middle font-bold">
												{idx === 0 ? (
													<span className="badge font-black shadow-sm bg-[#D4AF37] text-[#4A3800] border-none">
														#1 🥇
													</span>
												) : idx === 1 ? (
													<span className="badge font-black shadow-sm bg-[#AEB8C2] text-[#2B3138] border-none">
														#2 🥈
													</span>
												) : idx === 2 ? (
													<span className="badge font-black shadow-sm bg-[#C17F45] text-[#FBF0E4] border-none">
														#3 🥉
													</span>
												) : (
													<span className="badge badge-ghost font-mono opacity-60">
														#{idx + 1}
													</span>
												)}
											</td>

											{/* Player Details */}
											<td className="align-middle">
												<div className="flex items-center gap-3">
													<div className="avatar">
														<div className="w-10 h-10 rounded-full ring-1 ring-base-300 overflow-hidden bg-base-200">
															<img
																src={`/avatars/${player.user?.avatar || "avatar1.svg"}`}
																alt={player.user?.username}
																onError={handleAvatarError}
																className="w-full h-full object-cover"
															/>
														</div>
													</div>
													<div className="flex flex-col">
														<div className="flex items-center gap-2">
															<span className="font-bold text-sm sm:text-base">
																{player.user?.firstName ||
																	player.user?.username ||
																	"Player"}
															</span>
															{isMe && (
																<span className="badge badge-xs badge-primary font-bold">
																	YOU
																</span>
															)}
														</div>
														<span className="text-xs opacity-50">
															@{player.user?.username || "player"}
														</span>
													</div>
												</div>
											</td>

											{/* Accuracy */}
											<td className="text-center align-middle">
												<div className="flex flex-col items-center justify-center">
													<span className="text-xs sm:text-sm font-semibold">
														{correctCount}/{totalAnswered} ({accuracy}%)
													</span>
													<div className="w-20 bg-base-300 rounded-full h-1.5 mt-1 overflow-hidden mx-auto">
														<div
															className="bg-success h-1.5 rounded-full"
															style={{ width: `${accuracy}%` }}
														></div>
													</div>
												</div>
											</td>

											{/* Score */}
											<td className="text-right align-middle pr-6">
												<span className="font-mono font-black text-base sm:text-lg text-primary">
													{player.score} pts
												</span>
											</td>

											{/* Action */}
											<td className="text-center align-middle">
												<button
													onClick={(e) => {
														e.stopPropagation();
														setSelectedUserId(player.user?.id);
													}}
													className={`btn btn-xs ${
														isSelected ? "btn-primary" : "btn-ghost"
													}`}
												>
													{isSelected ? "Viewing" : "Inspect"}
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				{/* Detailed Analysis for Selected Player */}
				{activeSelectedUser && (
					<div className="space-y-4 pt-4">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-base-100 p-5 rounded-2xl border border-base-300 shadow-sm">
							<div className="flex items-center gap-3.5">
								<div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/40 bg-base-200 shrink-0">
									<img
										src={`/avatars/${activeSelectedUser.user?.avatar || "avatar1.svg"}`}
										alt={activeSelectedUser.user?.username}
										onError={handleAvatarError}
										className="w-full h-full object-cover"
									/>
								</div>
								<div>
									<h3 className="font-extrabold text-lg sm:text-xl flex items-center gap-2">
										<BarChart2 className="w-5 h-5 text-primary shrink-0" />
										<span>
											{activeSelectedUser.user?.id === user?.id
												? "My Detailed Analysis"
												: `${activeSelectedUser.user?.firstName || activeSelectedUser.user?.username}'s Breakdown`}
										</span>
									</h3>
									<p className="text-xs sm:text-sm opacity-60 mt-0.5">
										Final Score:{" "}
										<span className="font-bold text-primary font-mono">
											{activeSelectedUser.score} pts
										</span>{" "}
										• Rank #{activeIndex + 1}
									</p>
								</div>
							</div>

							{activeSelectedUser.user?.id !== user?.id && myResult && (
								<button
									onClick={() => setSelectedUserId(user?.id || null)}
									className="btn btn-sm btn-outline btn-primary w-full sm:w-auto"
								>
									<User className="w-3.5 h-3.5 mr-1" /> View My Result
								</button>
							)}
						</div>

						{/* Questions Breakdown */}
						<div className="space-y-3">
							{activeSelectedUser.answers && activeSelectedUser.answers.length > 0 ? (
								activeSelectedUser.answers.map((ans: any, i: number) => (
									<div
										key={i}
										className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl shadow-sm overflow-hidden ${
											ans.isCorrect
												? "border-l-4 border-l-success"
												: "border-l-4 border-l-error"
										}`}
									>
										<input type="checkbox" defaultChecked={i === 0} />
										<div className="collapse-title text-base font-medium pr-12 py-4">
											<div className="flex items-center justify-between gap-3">
												<div className="flex items-center gap-3 min-w-0 flex-1">
													<span className="badge badge-sm badge-neutral font-mono font-bold shrink-0">
														Q{i + 1}
													</span>
													<span className="font-bold text-sm sm:text-base text-base-content break-words line-clamp-2">
														{ans.questionText}
													</span>
												</div>
												<div className="shrink-0 flex items-center">
													{ans.isCorrect ? (
														<span className="badge badge-success badge-sm gap-1 font-bold text-white shadow-sm">
															<CheckCircle className="w-3.5 h-3.5" /> Correct
														</span>
													) : (
														<span className="badge badge-error badge-sm gap-1 font-bold text-white shadow-sm">
															<XCircle className="w-3.5 h-3.5" /> Wrong
														</span>
													)}
												</div>
											</div>
										</div>
										<div className="collapse-content space-y-3 text-sm pt-2 pb-4">
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												{/* Selected Answer */}
												<div
													className={`p-3.5 rounded-xl border flex flex-col gap-1 ${
														ans.isCorrect
															? "bg-success/5 border-success/30"
															: "bg-error/5 border-error/30"
													}`}
												>
													<span className="font-bold opacity-60 text-xs uppercase tracking-wider">
														{activeSelectedUser.user?.id === user?.id
															? "Your Answer"
															: "Selected Answer"}
													</span>
													<span
														className={`font-extrabold text-sm sm:text-base ${
															ans.isCorrect ? "text-success" : "text-error"
														}`}
													>
														{ans.selectedOptionText || "(Skipped / Timed Out)"}
													</span>
												</div>

												{/* Correct Answer (if wrong) */}
												{!ans.isCorrect ? (
													<div className="p-3.5 rounded-xl border bg-success/10 border-success/30 flex flex-col gap-1">
														<span className="font-bold text-success opacity-80 text-xs uppercase tracking-wider">
															Correct Answer
														</span>
														<span className="font-extrabold text-success text-sm sm:text-base">
															{ans.correctOptionText}
														</span>
													</div>
												) : (
													<div className="p-3.5 rounded-xl border bg-base-200/40 border-base-300 flex flex-col justify-center">
														<span className="text-xs opacity-60 italic">
															✨ Answered correctly
														</span>
													</div>
												)}
											</div>

											{/* Time and Points row */}
											<div className="flex items-center justify-between text-xs opacity-70 pt-2 px-1 border-t border-base-200">
												<span className="flex items-center gap-1 font-medium">
													⏱️ Response Time:{" "}
													<strong className="font-mono text-base-content">
														{ans.timeTaken
															? `${(ans.timeTaken / 1000).toFixed(1)}s`
															: "N/A"}
													</strong>
												</span>
												<span className="flex items-center gap-1 font-medium">
													⭐ Points:{" "}
													<strong className="font-mono text-primary font-bold text-sm">
														+{ans.points || 0}
													</strong>
												</span>
											</div>
										</div>
									</div>
								))
							) : (
								<div className="p-8 text-center bg-base-100 rounded-2xl border border-base-300 opacity-60">
									No detailed answers recorded for this player.
								</div>
							)}
						</div>
					</div>
				)}

				{/* Bottom Action Bar */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
					<Link href="/room/create" className="btn btn-primary w-full sm:w-auto px-8">
						<Sparkles className="w-4 h-4 mr-1" /> Create New Room
					</Link>
					<Link href="/dashboard" className="btn btn-outline w-full sm:w-auto px-8">
						<Home className="w-4 h-4 mr-1" /> Go to Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}