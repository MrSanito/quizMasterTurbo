"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { io } from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";
import AbortedScreen from "@/components/AbortedScreen";
import Loading from "@/components/Loading";
import {
	Activity,
	AlertTriangle,
	Bell,
	Check,
	Clock,
	Copy,
	Crown,
	Gamepad2,
	Loader2,
	Play,
	Radio,
	Trash2,
	UserMinus,
	UserPlus,
	Users,
	Volume2,
	Wifi,
	WifiOff,
} from "lucide-react";

/* ---------------- Types ---------------- */

export interface ActivityEvent {
	id: string;
	type: "JOIN" | "LEAVE" | "HOST_DISCONNECT" | "HOST_RECONNECT";
	name: string;
	avatar?: string;
	message: string;
	timestamp: number;
}

/* ---------------- Login Block ---------------- */

const LoginRequired = () => (
	<div className="relative min-h-[85vh] overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-6 py-16 flex flex-col items-center justify-center text-center">
		<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl motion-reduce:hidden" />
		<div className="relative z-10 w-full max-w-md rounded-[28px] bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl flex flex-col items-center gap-4 text-white">
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl mb-2">
				🔒
			</div>
			<h2 className="text-2xl font-extrabold">Login required</h2>
			<p className="text-sm text-slate-200">
				You need an authenticated account to enter multiplayer rooms.
			</p>
			<a
				href="/login"
				className="mt-2 w-full py-3.5 px-6 rounded-2xl bg-[#F0DE4A] text-black font-extrabold hover:bg-[#e6d43f] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B32B4]"
			>
				Log in to play
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
	const [activeTab, setActiveTab] = useState<"players" | "activity">("players");
	const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>([]);
	const [latestBanner, setLatestBanner] = useState<ActivityEvent | null>(null);
	const [hostGraceSeconds, setHostGraceSeconds] = useState<number | null>(null);

	const [screen, setScreen] = useState<"Loading" | "Success" | "Failed" | "Aborted">(
		"Loading",
	);
	const [abortedMessage, setAbortedMessage] = useState<string>(
		"This room has been aborted and closed.",
	);
	const [roomDetail, setRoomDetail] = useState<any>([]);

	const isBlocked = !loading && (!isLogin || isGuest);

	// Host Disconnect Countdown Timer (30s grace period)
	useEffect(() => {
		if (hostGraceSeconds === null || hostGraceSeconds <= 0) return;

		const timer = setInterval(() => {
			setHostGraceSeconds((prev) => {
				if (prev === null || prev <= 1) {
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [hostGraceSeconds !== null && hostGraceSeconds > 0]);

	const copyRoomCode = () => {
		if (roomId) {
			navigator.clipboard.writeText(roomId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const formatEventTime = (ts: number) => {
		try {
			return new Date(ts).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
		} catch {
			return "Just now";
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
			toast.error(
				error.response?.data?.message || error.message || "Failed to start game",
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
						const parsed = typeof value === "string" ? JSON.parse(value) : value;
						return {
							id,
							name: parsed.username || parsed.name || `Player_${id.slice(0, 4)}`,
							avatar: parsed.avatar || "avatar1.svg",
							socketId: parsed.socketId || "",
							score: parsed.score || 0,
							connected: parsed.connected ?? true,
						};
					});
				}

				setPlayers(list);
			};

			const onLetStart = () => {
				router.push(`/room/${roomId}/game`);
			};

			// Transient Real-time Announcements (Frontend State only)
			const onPlayerJoined = (data: {
				userId: string;
				name?: string;
				avatar?: string;
				timestamp?: number;
			}) => {
				const playerName = data.name || `Player_${data.userId?.slice(0, 4)}`;
				const playerAvatar = data.avatar || "avatar1.svg";

				const newEv: ActivityEvent = {
					id: `join-${Date.now()}-${Math.random()}`,
					type: "JOIN",
					name: playerName,
					avatar: playerAvatar,
					message: "joined the waiting room",
					timestamp: data.timestamp || Date.now(),
				};
				setActivityLogs((prev) => [newEv, ...prev].slice(0, 50));
				setLatestBanner(newEv);

				// Proactively update players list if not yet present
				setPlayers((prev) => {
					if (prev.some((p) => p.id === data.userId)) return prev;
					return [
						...prev,
						{
							id: data.userId,
							name: playerName,
							avatar: playerAvatar,
							connected: true,
							score: 0,
						},
					];
				});
			};

			const onPlayerLeft = (data: {
				userId: string;
				name?: string;
				avatar?: string;
				timestamp?: number;
			}) => {
				const playerName = data.name || `Player_${data.userId?.slice(0, 4)}`;
				const newEv: ActivityEvent = {
					id: `leave-${Date.now()}-${Math.random()}`,
					type: "LEAVE",
					name: playerName,
					avatar: data.avatar || "avatar1.svg",
					message: "left the lobby",
					timestamp: data.timestamp || Date.now(),
				};
				setActivityLogs((prev) => [newEv, ...prev].slice(0, 50));
				setLatestBanner(newEv);

				// Proactively remove player from grid immediately
				setPlayers((prev) => prev.filter((p) => p.id !== data.userId));
			};

			const onHostDisconnected = (data: {
				message?: string;
				gracePeriod?: number;
				seconds?: number;
			}) => {
				const seconds = data?.seconds || 30;
				setHostGraceSeconds(seconds);
				toast.warn(data.message || `Host disconnected. Room will be destroyed in ${seconds}s.`);

				const newEv: ActivityEvent = {
					id: `host-dc-${Date.now()}-${Math.random()}`,
					type: "HOST_DISCONNECT",
					name: "Host Organizer",
					message: data.message || `Host disconnected. Room will be destroyed in ${seconds}s.`,
					timestamp: Date.now(),
				};
				setActivityLogs((prev) => [newEv, ...prev].slice(0, 50));
				setLatestBanner(newEv);
			};

			const onHostCountdown = (data: { seconds: number }) => {
				if (typeof data?.seconds === "number") {
					setHostGraceSeconds(data.seconds);
				}
			};

			const onHostReconnected = () => {
				setHostGraceSeconds(null);
				toast.success("Host returned & reconnected to the room!");

				const newEv: ActivityEvent = {
					id: `host-rec-${Date.now()}-${Math.random()}`,
					type: "HOST_RECONNECT",
					name: "Host Organizer",
					message: "Host returned & reconnected to the room!",
					timestamp: Date.now(),
				};
				setActivityLogs((prev) => [newEv, ...prev].slice(0, 50));
				setLatestBanner(newEv);
			};

			const onRoomAborted = (data: any) => {
				setHostGraceSeconds(null);
				setAbortedMessage(data?.message || "Host has left the room. The room has been destroyed.");
				setScreen("Aborted");
			};

			const onSocketError = (errData: any) => {
				console.error("Lobby socket error:", errData);
				if (
					errData?.message === "Room not active" ||
					errData?.message?.toLowerCase().includes("aborted") ||
					errData?.message?.toLowerCase().includes("closed") ||
					errData?.message?.toLowerCase().includes("destroyed")
				) {
					setAbortedMessage(errData.message || "This room has been aborted and closed.");
					setScreen("Aborted");
					return;
				}
				toast.error(errData?.message || "An error occurred");
			};

			const onDuplicateSession = (data: any) => {
				const msg = data?.message || "You opened this quiz room in another tab or window.";
				toast.warn(msg);
				setAbortedMessage(msg);
				setScreen("Aborted");
			};

			socket.on("connect", onConnect);
			socket.on("lobby:players", onPlayers);
			socket.on("lobby:startingRoom", onLetStart);
			socket.on("lobby:playerJoined", onPlayerJoined);
			socket.on("lobby:playerLeft", onPlayerLeft);
			socket.on("lobby:hostDisconnected", onHostDisconnected);
			socket.on("lobby:hostCountdown", onHostCountdown);
			socket.on("game:hostCountdown", onHostCountdown);
			socket.on("lobby:hostReconnected", onHostReconnected);
			socket.on("game:hostReconnected", onHostReconnected);
			socket.on("lobby:duplicateSession", onDuplicateSession);
			socket.on("game:duplicateSession", onDuplicateSession);
			socket.on("lobby:aborted", onRoomAborted);
			socket.on("game:aborted", onRoomAborted);
			socket.on("error", onSocketError);
		};

		initSocket();

		return () => {
			isCancelled = true;
			if (socket) {
				if (socket.connected && player) {
					socket.emit("lobby:leave", { roomId, player });
				}
				socket.off("connect");
				socket.off("lobby:players");
				socket.off("lobby:startingRoom");
				socket.off("lobby:playerJoined");
				socket.off("lobby:playerLeft");
				socket.off("lobby:hostDisconnected");
				socket.off("lobby:hostCountdown");
				socket.off("game:hostCountdown");
				socket.off("lobby:hostReconnected");
				socket.off("game:hostReconnected");
				socket.off("lobby:duplicateSession");
				socket.off("game:duplicateSession");
				socket.off("lobby:aborted");
				socket.off("game:aborted");
				socket.off("error");
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

				if (!roomData || roomData.state === "ABORTED" || roomData.state === "ABANDONED") {
					setAbortedMessage("This room has been aborted and closed.");
					setScreen("Aborted");
					return;
				}

				if (roomData.state === "FINISHED") {
					router.replace(`/room/${roomId}/result`);
					return;
				}

				if (roomData.state === "PLAYING" || roomData.state === "COUNTDOWN") {
					router.replace(`/room/${roomId}/game`);
					return;
				}

				setRoomDetail(roomData);
				setScreen("Success");
			} catch (err: any) {
				if (err.response?.status === 410 || err.response?.data?.state === "ABORTED") {
					setAbortedMessage("This room was closed and destroyed.");
					setScreen("Aborted");
					return;
				}
				if (err.response?.status === 403) {
					const roomDataFromAPI = await api.get(`/room/${roomId}/`);
					const roomData = roomDataFromAPI.data.room;
					if (!roomData || roomData.state === "ABORTED" || roomData.state === "ABANDONED") {
						setAbortedMessage("This room has been aborted and closed.");
						setScreen("Aborted");
						return;
					}
					if (roomData.state === "FINISHED") {
						router.replace(`/room/${roomId}/result`);
						return;
					}
					if (roomData.state === "PLAYING" || roomData.state === "COUNTDOWN") {
						router.replace(`/room/${roomId}/game`);
						return;
					}
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
	if (screen === "Aborted") {
		return <AbortedScreen roomId={roomId} message={abortedMessage} />;
	}

	if (screen === "Failed") {
		return (
			<div className="min-h-[85vh] bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] flex flex-col items-center justify-center p-6 text-white text-center">
				<div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[28px] max-w-md w-full shadow-2xl">
					<WifiOff className="w-14 h-14 text-rose-400 mx-auto mb-4 opacity-90" />
					<h3 className="text-xl font-bold mb-2">Room error</h3>
					<p className="text-sm text-slate-200 mb-6">
						Unable to connect to this lobby. The room may have expired or does not exist.
					</p>
					<button
						onClick={() => router.push("/quiz/mode")}
						className="w-full py-3 px-6 rounded-2xl bg-[#F0DE4A] text-black font-extrabold hover:bg-[#e6d43f] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B32B4]"
					>
						Back to modes
					</button>
				</div>
			</div>
		);
	}

	const isHost = roomDetail?.hostId === user?.id;

	return (
		<div className="relative min-h-[90vh] overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4 py-10 sm:py-12 flex flex-col items-center justify-center">
			<ToastContainer position="top-center" theme="colored" />
			{/* Ambient background glow — one, kept quiet */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl motion-reduce:hidden" />

			{/* Screen-reader announcements for live lobby events */}
			<div className="sr-only" role="status" aria-live="polite">
				{latestBanner ? `${latestBanner.name} ${latestBanner.message}` : ""}
			</div>

			<main className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-6">
				{/* Header: quiz name + join code as one hero unit */}
				<header className="w-full text-center">
					<div className="mb-2 inline-flex items-center gap-1.5 text-[#F0DE4A]">
						<Gamepad2 size={16} />
						<span className="text-xs font-bold">Live lobby</span>
					</div>
					<h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
						{roomDetail?.roomName || "Quiz Arena"}
					</h1>
					<p className="mt-1 text-sm text-slate-300">
						Share the code below and wait for {isHost ? "you" : "the host"} to start the game.
					</p>
				</header>

				{/* Room Code Card */}
				<div className="w-full rounded-[28px] bg-white/10 backdrop-blur-xl border border-white/20 p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
							<Gamepad2 size={24} />
						</div>
						<div>
							<p className="text-xs text-slate-300 font-bold">Room code</p>
							<p className="text-xl md:text-2xl font-black text-white font-mono tracking-widest">
								{roomId}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto">
						{/* Connection status */}
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
							{socketId ? (
								<>
									<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
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
							aria-label="Copy room code"
							className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
						>
							{copied ? (
								<>
									<Check size={14} className="text-emerald-300" />
									<span>Copied</span>
								</>
							) : (
								<>
									<Copy size={14} />
									<span>Copy code</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* Host Disconnected Countdown Banner — one deliberate motion, not three */}
				{hostGraceSeconds !== null && (
					<div
						role="alert"
						className="w-full rounded-[28px] bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 p-5 text-white shadow-2xl border-2 border-rose-300/40 flex flex-col md:flex-row items-center justify-between gap-4"
					>
						<div className="flex items-center gap-4">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner">
								<AlertTriangle className="text-amber-200" size={28} />
							</div>
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<h3 className="text-lg font-black tracking-tight">Host disconnected</h3>
									<span className="px-2.5 py-0.5 rounded-full bg-black/40 text-[10px] font-black uppercase tracking-wider text-amber-300">
										Grace period
									</span>
								</div>
								<p className="text-xs text-rose-100 font-medium max-w-md mt-0.5">
									Waiting for the host to return. If they don't reconnect in time, this room will close.
								</p>
							</div>
						</div>

						{/* Countdown Timer Pill */}
						<div className="flex items-center gap-3 bg-black/40 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-md">
							<Clock className="text-amber-300" size={22} />
							<div className="text-center">
								<p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300">
									Room closes in
								</p>
								<p className="text-2xl font-black font-mono tracking-widest text-white animate-pulse motion-reduce:animate-none">
									00:{hostGraceSeconds < 10 ? `0${hostGraceSeconds}` : hostGraceSeconds}s
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Live Announcement Banner for the latest event */}
				{latestBanner && (
					<div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
						<div className="flex items-center gap-2 overflow-hidden">
							<span className="p-1 rounded-full bg-[#F0DE4A] text-black">
								<Volume2 size={12} />
							</span>
							<span className="text-[#F0DE4A] font-extrabold text-[10px]">Just now:</span>
							<span className="truncate text-slate-100">
								<strong className="text-white">{latestBanner.name}</strong>{" "}
								{latestBanner.message}
							</span>
						</div>
						<span className="text-[10px] text-slate-300 whitespace-nowrap">
							{formatEventTime(latestBanner.timestamp)}
						</span>
					</div>
				)}

				{/* Main Lobby Container with Tabs */}
				<div className="w-full rounded-[28px] bg-white/95 p-6 shadow-2xl border border-white/40 flex flex-col">
					{/* Tabs */}
					<div
						className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 gap-3"
						role="tablist"
						aria-label="Lobby views"
					>
						<div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100/90 border border-slate-200">
							<button
								role="tab"
								aria-selected={activeTab === "players"}
								onClick={() => setActiveTab("players")}
								className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7047C7] ${
									activeTab === "players"
										? "bg-white text-[#340C97] shadow-sm"
										: "text-slate-600 hover:text-slate-900"
								}`}
							>
								<Users size={15} />
								<span>Contenders</span>
								<span
									className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
										activeTab === "players"
											? "bg-[#340C97] text-white"
											: "bg-slate-200 text-slate-700"
									}`}
								>
									{players.length}
								</span>
							</button>

							<button
								role="tab"
								aria-selected={activeTab === "activity"}
								onClick={() => setActiveTab("activity")}
								className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7047C7] ${
									activeTab === "activity"
										? "bg-white text-[#340C97] shadow-sm"
										: "text-slate-600 hover:text-slate-900"
								}`}
							>
								<Activity size={15} />
								<span>Live activity</span>
								<span
									className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
										activeTab === "activity"
											? "bg-[#340C97] text-white"
											: "bg-slate-200 text-slate-700"
									}`}
								>
									{activityLogs.length > 0 && (
										<span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping motion-reduce:animate-none" />
									)}
									{activityLogs.length}
								</span>
							</button>
						</div>

						{activeTab === "activity" && activityLogs.length > 0 && (
							<button
								onClick={() => setActivityLogs([])}
								className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
								title="Clear activity log"
							>
								<Trash2 size={13} />
								<span>Clear</span>
							</button>
						)}
					</div>

					{/* TAB 1: Players View */}
					{activeTab === "players" && (
						<div role="tabpanel" aria-label="Contenders">
							{players.length === 0 ? (
								<div className="py-10 text-center flex flex-col items-center justify-center text-slate-400">
									<Users className="w-12 h-12 mb-2 stroke-1 text-slate-300" />
									<p className="text-sm font-bold text-slate-600">
										Waiting for contenders to join...
									</p>
									<p className="text-xs text-slate-400">
										Share the room code to invite players.
									</p>
								</div>
							) : (
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
														{isPlayerHost ? "Host & organizer" : "Contender"}
													</p>
												</div>

												{isPlayerHost && (
													<span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F0DE4A] text-black shadow-xs">
														Host
													</span>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}

					{/* TAB 2: Live Activity View (Frontend State Only) */}
					{activeTab === "activity" && (
						<div role="tabpanel" aria-label="Live activity" className="flex flex-col">
							{activityLogs.length === 0 ? (
								<div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
									<div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#7047C7] flex items-center justify-center mb-3">
										<Bell size={24} />
									</div>
									<p className="text-sm font-bold text-slate-700">No activity yet</p>
									<p className="text-xs text-slate-400 max-w-xs mt-1">
										Joins and leaves will show up here as they happen.
									</p>
								</div>
							) : (
								<div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
									{activityLogs.map((ev) => {
										const isJoin = ev.type === "JOIN";
										const isLeave = ev.type === "LEAVE";
										const isHostDc = ev.type === "HOST_DISCONNECT";
										const isHostRec = ev.type === "HOST_RECONNECT";

										return (
											<div
												key={ev.id}
												className={`flex items-center justify-between p-3 rounded-2xl border transition-all animate-in fade-in slide-in-from-left-2 duration-300 motion-reduce:animate-none ${
													isJoin
														? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950"
														: isLeave
														? "bg-rose-50/70 border-rose-200/80 text-rose-950"
														: isHostDc
														? "bg-amber-50/70 border-amber-200/80 text-amber-950"
														: "bg-purple-50/70 border-purple-200/80 text-purple-950"
												}`}
											>
												<div className="flex items-center gap-3 min-w-0">
													<div
														className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
															isJoin
																? "bg-emerald-500 text-white"
																: isLeave
																? "bg-rose-500 text-white"
																: isHostDc
																? "bg-amber-500 text-white"
																: "bg-purple-600 text-white"
														}`}
													>
														{isJoin && <UserPlus size={16} />}
														{isLeave && <UserMinus size={16} />}
														{isHostDc && <Clock size={16} />}
														{isHostRec && <Crown size={16} />}
													</div>

													<div className="min-w-0">
														<div className="flex items-center gap-2">
															<span className="text-xs font-black truncate text-slate-900">
																{ev.name}
															</span>
															<span
																className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
																	isJoin
																		? "bg-emerald-200 text-emerald-800"
																		: isLeave
																		? "bg-rose-200 text-rose-800"
																		: isHostDc
																		? "bg-amber-200 text-amber-800"
																		: "bg-purple-200 text-purple-800"
																}`}
															>
																{isJoin
																	? "Joined"
																	: isLeave
																	? "Left"
																	: isHostDc
																	? "Host disconnected"
																	: "Host reconnected"}
															</span>
														</div>
														<p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
															{ev.message}
														</p>
													</div>
												</div>

												<div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 whitespace-nowrap pl-2">
													<Clock size={11} />
													<span>{formatEventTime(ev.timestamp)}</span>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}

					{/* Start Game / Waiting Section */}
					<div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center">
						{isHost ? (
							<button
								onClick={startGameHandler}
								disabled={startingStatus}
								className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#340C97] to-[#7047C7] hover:from-[#2e0988] hover:to-[#633cb8] text-white font-extrabold text-base shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#340C97] focus-visible:ring-offset-2"
							>
								{startingStatus ? (
									<>
										<Loader2 size={18} className="animate-spin motion-reduce:animate-none" />
										<span>Launching quiz game...</span>
									</>
								) : (
									<>
										<Play size={18} fill="currentColor" />
										<span>Start game for everyone</span>
									</>
								)}
							</button>
						) : (
							<div className="flex items-center gap-3 py-3 px-5 rounded-2xl bg-purple-50 border border-purple-100 text-[#340C97] text-sm font-bold w-full justify-center text-center">
								<Radio size={16} className="animate-pulse motion-reduce:animate-none text-[#7047C7]" />
								<span>Waiting for the host to launch the game...</span>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
};

export default RoomLobbyPage;