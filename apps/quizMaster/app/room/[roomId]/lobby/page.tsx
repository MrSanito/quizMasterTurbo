"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";
import {
	Check,
	Copy,
	Crown,
	Gamepad2,
	Play,
	Radio,
	Sparkles,
	Users,
	Wifi,
	WifiOff,
} from "lucide-react";

/* ---------------- Login Block ---------------- */

const LoginRequired = () => (
	<div className="relative min-h-[85vh] overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-6 py-16 flex flex-col items-center justify-center text-center">
		<div className="relative z-10 w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl flex flex-col items-center gap-4 text-white">
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl mb-2">
				🔒
			</div>
			<h2 className="text-2xl font-extrabold">Login Required</h2>
			<p className="text-sm text-slate-200">
				You need an authenticated account to enter multiplayer rooms.
			</p>
			<a
				href="/login"
				className="mt-2 w-full py-3.5 px-6 rounded-2xl bg-[#F0DE4A] text-black font-extrabold hover:bg-[#e6d43f] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg text-center"
			>
				Login to Play
			</a>
		</div>
	</div>
);

/* ---------------- Lobby Page ---------------- */

const RoomLobbyPage = () => {
	const router = useRouter();
	const { user, loading, isLogin, isGuest, isMaxTryReached, accessToken } = useUser();
	const { roomId } = useParams<{ roomId: string }>();
	const [startingStatus, setStartingStatus] = useState<boolean>(false);
	const [copied, setCopied] = useState(false);

	const socketRef = useRef<any>(null);
	const [socketId, setSocketId] = useState<false | string>(false);
	const [players, setPlayers] = useState<any[]>([]);
	const [screen, setScreen] = useState<"Loading" | "Success" | "Failed">(
		"Loading",
	);
	const [roomDetail, setRoomDetail] = useState<any>([]);

	const isBlocked = !loading && (!isLogin || isGuest);

	const copyRoomCode = () => {
		if (roomId) {
			navigator.clipboard.writeText(roomId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const startGameHandler = async () => {
		const socket = socketRef.current;
		if (!socket) {
			console.error("Socket not initialized");
			return;
		}
		console.log("User clicked Start Game for room:", roomId);
		setStartingStatus(true);

		try {
			// 1. Call API to initialize game in Redis/DB
			console.log(`Calling API: /room/${roomId}/start`);
			const res = await api.post(`/room/${roomId}/start`);
			console.log("API Response:", res.data);

			if (res.data.success) {
				// 2. Notify Server to start game for everyone
				console.log("Emitting 'lobby:letsstart' to WS for room:", roomId);
				if (socket.connected) {
					socket.emit("lobby:letsstart", { roomId, hostId: user.id });
					console.log("Emit sent!");
				} else {
					console.error("Socket disconnected! Cannot emit start command.");
					socket.connect();
				}
			}
		} catch (error: any) {
			console.error("Failed to start game:", error);
			alert(
				"Failed to start game: " +
					(error.response?.data?.message || error.message),
			);
			setStartingStatus(false);
		}
	};

	const player = user
		? {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`,
				avatar: user.avatar,
			}
		: null;

	/* Connect & listen */
	useEffect(() => {
		if (!roomId || !player || !isLogin) return;

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

			socket = io(process.env.NEXT_PUBLIC_WS_BASE_URL!, {
				transports: ["websocket", "polling"],
				withCredentials: true,
				auth: {
					ticket: ticket || undefined,
					token: accessToken || undefined,
				},
				query: {
					roomId,
				},
			});

			socketRef.current = socket;

			socket.on("connect_error", (err: any) => {
				console.error("❌ Socket Connection / Auth Error:", err.message);
			});

			const onConnect = () => {
				console.log("connected to ws");
				setSocketId(socket.id);
				socket.emit("lobby:join", { roomId, player });
				socket.emit("set_location", "lobby");
			};

			const onPlayers = (data: any) => {
				let list: any[] = [];
				if (!data) return;

				if (Array.isArray(data)) {
					list = data;
				} else if (Array.isArray(data.players)) {
					list = data.players;
				} else {
					list = Object.entries(data).map(([id, value]: any) => {
						const parsed = JSON.parse(value);
						return {
							id,
							name: parsed.username,
							avatar: parsed.avatar,
							socketId: parsed.socketId,
							score: parsed.score,
						};
					});
				}

				setPlayers(list);
			};

			const onLetStart = () => {
				router.push(`/room/${roomId}/game`);
			};

			socket.on("connect", onConnect);
			socket.on("lobby:players", onPlayers);
			socket.on("lobby:startingRoom", onLetStart);
		};

		initSocket();

		return () => {
			isCancelled = true;
			if (socket) {
				socket.off("connect");
				socket.off("lobby:players");
				socket.off("lobby:startingRoom");
				socket.disconnect();
			}
		};
	}, [roomId, player?.id, isLogin, accessToken]);

	useEffect(() => {
		if (loading || isMaxTryReached || !isLogin || !roomId || !user?.id) return;

		const updateStatusToLobby = async () => {
			try {
				const res = await api.post(`/room/${roomId}/lobby`, {
					hostId: user.id,
				});
				console.log("response from the server", res.data);

				const roomDataFromAPI = await api.get(`/room/${roomId}/`);
				const roomData = roomDataFromAPI.data.room;

				if (
					roomData.state === "PLAYING" ||
					roomData.state === "FINISHED" ||
					roomData.state === "COUNTDOWN"
				) {
					router.replace(`/room/${roomId}/game`);
					return;
				}

				setRoomDetail(roomData);
				setScreen("Success");
			} catch (err: any) {
				if (err.response?.status === 403) {
					const roomDataFromAPI = await api.get(`/room/${roomId}/`);
					const roomData = roomDataFromAPI.data.room;
					setRoomDetail(roomData);
					setScreen("Success");
					return;
				}
				console.error("Failed to fetch room details", err);
				setScreen("Failed");
			}
		};

		updateStatusToLobby();
	}, [loading, isLogin, isMaxTryReached, roomId, user?.id]);

	/* ---------------- UI ---------------- */

	if (loading) return <Loading />;
	if (isBlocked) return <LoginRequired />;
	if (screen === "Loading") return <Loading />;

	if (screen === "Failed") {
		return (
			<div className="min-h-[85vh] bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] flex flex-col items-center justify-center p-6 text-white text-center">
				<div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl max-w-md w-full shadow-2xl">
					<WifiOff className="w-14 h-14 text-rose-400 mx-auto mb-4 opacity-90" />
					<h3 className="text-xl font-bold mb-2">Room Error</h3>
					<p className="text-sm text-slate-200 mb-6">
						Unable to connect to this lobby. The room may have expired or does not exist.
					</p>
					<button
						onClick={() => router.push("/quiz/mode")}
						className="w-full py-3 px-6 rounded-2xl bg-[#F0DE4A] text-black font-extrabold hover:bg-[#e6d43f] transition-all"
					>
						Back to Modes
					</button>
				</div>
			</div>
		);
	}

	const isHost = roomDetail?.hostId === user?.id;

	return (
		<div className="relative min-h-[90vh] overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4 py-12 flex flex-col items-center justify-center">
			{/* Ambient background glows */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

			{/* Background wave cutout */}
			<svg
				className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-2/3 text-white/[0.04] md:h-56"
				viewBox="0 0 500 200"
				preserveAspectRatio="none"
				fill="currentColor"
			>
				<path d="M0,200 L0,60 C140,140 300,200 500,200 Z" />
			</svg>

			<div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-6">
				{/* Top Header Badge */}
				<div className="text-center">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F0DE4A] text-xs font-extrabold uppercase tracking-wider mb-3 shadow-sm">
						<Sparkles size={14} />
						MULTIPLAYER LOBBY
					</div>
					<h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
						{roomDetail?.roomName || "Quiz Arena"}
					</h1>
				</div>

				{/* Room Code Card */}
				<div className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
							<Gamepad2 size={24} />
						</div>
						<div>
							<p className="text-xs uppercase tracking-wider text-slate-300 font-bold">
								Room Code
							</p>
							<p className="text-xl md:text-2xl font-black text-white font-mono tracking-widest">
								{roomId}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto">
						{/* Realtime Live Status */}
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
							{socketId ? (
								<>
									<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
									<Wifi size={13} />
									<span>Live</span>
								</>
							) : (
								<>
									<span className="h-2 w-2 rounded-full bg-amber-400" />
									<span>Connecting</span>
								</>
							)}
						</div>

						{/* Copy Button */}
						<button
							onClick={copyRoomCode}
							className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 active:scale-95"
						>
							{copied ? (
								<>
									<Check size={14} className="text-emerald-300" />
									<span>Copied</span>
								</>
							) : (
								<>
									<Copy size={14} />
									<span>Copy Code</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* Players Card */}
				<div className="w-full rounded-3xl bg-white/95 p-6 shadow-2xl border border-white/40 flex flex-col">
					<div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
						<div className="flex items-center gap-2">
							<Users className="text-[#340C97]" size={20} />
							<h3 className="font-extrabold text-gray-900 text-lg">
								Waiting Room
							</h3>
						</div>
						<span className="rounded-full bg-[#340C97]/10 px-3.5 py-1 text-xs font-black text-[#340C97]">
							{players.length} {players.length === 1 ? "Player" : "Players"}
						</span>
					</div>

					{/* Players Grid / List */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
						{players.map((p) => {
							const isPlayerHost = roomDetail?.hostId === p.id;
							return (
								<div
									key={p.id}
									className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-colors shadow-sm"
								>
									<div className="relative">
										<div className="w-11 h-11 rounded-full ring-2 ring-[#7047C7] ring-offset-2 overflow-hidden bg-purple-100 flex items-center justify-center">
											<img
												src={
													p?.avatar
														? `/avatars/${p.avatar}`
														: "/avatars/avatar4.svg"
												}
												alt={p.name}
												className="w-full h-full object-cover"
											/>
										</div>
										{isPlayerHost && (
											<div className="absolute -top-1.5 -right-1.5 bg-[#F0DE4A] text-black p-0.5 rounded-full shadow-sm">
												<Crown size={12} className="stroke-[2.5]" />
											</div>
										)}
									</div>

									<div className="flex-1 min-w-0">
										<p className="text-sm font-bold text-gray-900 truncate">
											{p.name}
										</p>
										<p className="text-[11px] font-medium text-gray-500">
											{isPlayerHost ? "Host & Organizer" : "Contender"}
										</p>
									</div>

									{isPlayerHost && (
										<span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[#F0DE4A] text-black shadow-xs">
											Host
										</span>
									)}
								</div>
							);
						})}
					</div>

					{/* Start Game / Waiting Section */}
					<div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center">
						{isHost ? (
							<button
								onClick={startGameHandler}
								disabled={startingStatus}
								className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#340C97] to-[#7047C7] hover:from-[#2e0988] hover:to-[#633cb8] text-white font-extrabold text-base shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{startingStatus ? (
									<>
										<span className="loading loading-spinner loading-sm" />
										<span>Launching Quiz Game...</span>
									</>
								) : (
									<>
										<Play size={18} fill="currentColor" />
										<span>Start Game for Everyone</span>
									</>
								)}
							</button>
						) : (
							<div className="flex items-center gap-3 py-3 px-5 rounded-2xl bg-purple-50 border border-purple-100 text-[#340C97] text-sm font-bold w-full justify-center text-center">
								<Radio size={16} className="animate-pulse text-[#7047C7]" />
								<span>Waiting for the Host to launch the game...</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default RoomLobbyPage;
