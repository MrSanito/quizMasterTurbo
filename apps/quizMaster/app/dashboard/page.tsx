"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import QuizPlayerHistory from "@/app/dashboard/Components/QuizPlayerHistory";
import { data } from "@/app/dashboard/data";
import Card from "@/components/Card";
import FriendRequest from "@/components/FriendRequest";
import Loading from "@/components/Loading";
import MaxTryReached from "../(auth)/components/MaxTryReached";
import NotLoginComponent from "../(auth)/components/NotLoginComponent";
import api from "../lib/api";

/* ================= CONSTANTS ================= */

const PAGE_BG = "bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7]";
const FALLBACK_AVATAR = "/avatars/avatar1.svg";

// PLACEHOLDER: point this to your real sign-up route
const SIGNUP_HREF = "/signup";

type PendingAction = "logout" | "logoutAll" | null;

const MODAL_COPY = {
	logout: {
		title: "Confirm logout",
		message: "Are you sure you want to log out? Your current session will end.",
		confirmLabel: "Log out",
	},
	logoutAll: {
		title: "Log out of all sessions?",
		message: "This signs you out on every device, including this one.",
		confirmLabel: "Log out everywhere",
	},
} as const;

type AuthUser = NonNullable<ReturnType<typeof useUser>["user"]>;

type Session = {
	id: string;
	os?: string;
	browser?: string;
	deviceName?: string;
	deviceType?: string;
	ipAddress?: string;
	isCurrent?: boolean;
	lastUsedAt?: string;
	createdAt?: string;
};

/* ================= HELPERS ================= */

function formatDateTime(iso?: string) {
	if (!iso) return "Unknown";
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

/* ================= SHARED PIECES ================= */

// One shell for every dashboard state (guest, user, fallback) so the
// gradient, glow blobs and toast container live in a single place.
function PageShell({
	children,
	centered = false,
}: {
	children: ReactNode;
	centered?: boolean;
}) {
	return (
		<div
			className={`relative min-h-screen overflow-hidden px-4 ${PAGE_BG} ${
				centered
					? "flex flex-col items-center justify-center py-10"
					: "py-6"
			}`}
		>
			<ToastContainer position="top-center" theme="colored" />
			{/* Ambient glow, echoes the hero's palette */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

			<div
				className={`relative z-10 w-full ${
					centered ? "flex flex-col items-center" : ""
				}`}
			>
				{children}
			</div>
		</div>
	);
}

// Replaces both the old logout modal and the browser's native confirm()
function ConfirmModal({
	open,
	title,
	message,
	confirmLabel,
	loading,
	onConfirm,
	onCancel,
}: {
	open: boolean;
	title: string;
	message: string;
	confirmLabel: string;
	loading: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	const cancelRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;

		cancelRef.current?.focus();

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !loading) onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, loading, onCancel]);

	if (!open) return null;

	return (
		<div
			role="presentation"
			onClick={() => !loading && onCancel()}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirm-title"
				aria-describedby="confirm-message"
				onClick={(e) => e.stopPropagation()}
				className="w-[90%] max-w-md rounded-3xl bg-white p-6 shadow-2xl"
			>
				<h3 id="confirm-title" className="mb-2 text-lg font-bold text-gray-900">
					{title}
				</h3>
				<p id="confirm-message" className="mb-6 text-sm text-gray-500">
					{message}
				</p>

				<div className="flex justify-end gap-3">
					<button
						ref={cancelRef}
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="rounded-full bg-gray-100 px-5 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
					>
						Cancel
					</button>

					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="rounded-full bg-red-500 px-5 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
					>
						{loading ? "Please wait..." : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

function ProfileHeader({
	user,
	onEdit,
	onLogout,
}: {
	user: AuthUser;
	onEdit: () => void;
	onLogout: () => void;
}) {
	const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

	return (
		<div className="flex flex-col items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-xl md:flex-row">
			{/* Left: avatar + name */}
			<div className="mb-4 flex items-center gap-4 md:mb-0">
				<div className="h-14 w-14 overflow-hidden rounded-full ring-2 ring-[#7047C7] ring-offset-2 ring-offset-white">
					<img
						src={user.avatar ? `/avatars/${user.avatar}` : FALLBACK_AVATAR}
						alt={`${fullName || "Your"} avatar`}
						className="h-full w-full object-cover"
						onError={(e) => {
							// stop a broken fallback from looping forever
							e.currentTarget.onerror = null;
							e.currentTarget.src = FALLBACK_AVATAR;
						}}
					/>
				</div>
				<div className="flex flex-col">
					<span className="text-sm font-medium text-gray-500">
						Welcome back,
					</span>
					<h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
						{fullName || "Player"}
					</h2>
				</div>
			</div>

			{/* Right: actions */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onEdit}
					className="flex h-10 min-h-[2.5rem] items-center justify-center rounded-full bg-[#F0DE4A] px-6 font-bold text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg"
				>
					Edit Profile
				</button>

				<button
					type="button"
					onClick={onLogout}
					className="flex h-10 min-h-[2.5rem] items-center justify-center rounded-full border border-red-200 bg-white px-6 font-semibold text-red-500 transition-all duration-300 hover:bg-red-50"
				>
					Logout
				</button>
			</div>
		</div>
	);
}

/* ================= ACTIVE SESSIONS ================= */

function ActiveSessions({ onLogoutAll }: { onLogoutAll: () => void }) {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [revokingId, setRevokingId] = useState<string | null>(null);

	// `silent` = refresh the list without flashing the spinner (used after revoke)
	const fetchSessions = useCallback(async (silent = false) => {
		try {
			if (!silent) setLoading(true);
			setError(null);

			const res = await api.get("/auth/sessions");
			if (res.data?.success) {
				setSessions(res.data.sessions || []);
			} else {
				setError("Failed to load active sessions.");
			}
		} catch (err) {
			console.error("Failed to fetch sessions", err);
			setError("Error fetching sessions.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSessions();
	}, [fetchSessions]);

	const handleRevoke = async (sessionId: string) => {
		setRevokingId(sessionId);
		try {
			const res = await api.post(`/auth/revoke/${sessionId}`);
			if (res.data?.success) {
				toast.success("Session revoked successfully");
				await fetchSessions(true);
			} else {
				toast.error(res.data?.message || "Failed to revoke session");
			}
		} catch (err: any) {
			console.error("Failed to revoke session", err);
			toast.error(err.response?.data?.message || "Error revoking session");
		} finally {
			setRevokingId(null);
		}
	};

	// This device first, then most recently used
	const ordered = useMemo(
		() =>
			[...sessions].sort((a, b) => {
				if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
				const at = new Date(a.lastUsedAt || a.createdAt || 0).getTime();
				const bt = new Date(b.lastUsedAt || b.createdAt || 0).getTime();
				return bt - at;
			}),
		[sessions],
	);

	return (
		<section
			aria-labelledby="sessions-heading"
			className="mx-auto mt-12 max-w-7xl rounded-3xl border border-gray-100 bg-white p-6 shadow-xl"
		>
			<div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<h2
					id="sessions-heading"
					className="text-xl font-bold text-gray-900 sm:text-2xl"
				>
					Active Sessions
				</h2>

				{sessions.length > 1 && (
					<button
						type="button"
						onClick={onLogoutAll}
						className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
					>
						Log out of all sessions
					</button>
				)}
			</div>

			{/* PLACEHOLDER (security banner): "Turn on two-factor authentication"
			    card here once 2FA exists. */}

			{loading ? (
				<div className="flex justify-center p-4" aria-busy="true">
					<span className="h-6 w-6 animate-spin rounded-full border-2 border-[#7047C7]/20 border-t-[#7047C7]" />
				</div>
			) : error ? (
				<div role="alert" className="flex items-center gap-3">
					<p className="text-sm text-red-500">{error}</p>
					<button
						type="button"
						onClick={() => fetchSessions()}
						className="rounded-full px-3 py-1 text-sm font-semibold text-[#7047C7] transition hover:bg-[#7047C7]/10"
					>
						Try again
					</button>
				</div>
			) : ordered.length === 0 ? (
				<p className="text-sm text-gray-400">No active sessions found.</p>
			) : (
				<ul className="space-y-4">
					{ordered.map((session) => (
						<li
							key={session.id}
							className={`flex items-center justify-between rounded-xl border p-4 ${
								session.isCurrent
									? "border-[#7047C7]/30 bg-[#7047C7]/5"
									: "border-gray-100 bg-gray-50"
							}`}
						>
							{/* PLACEHOLDER (device icon + approx. location): desktop / phone
							    icon from the user agent, and city from the IP. */}
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold text-gray-800">
										{session.os || "Unknown OS"} •{" "}
										{session.browser || "Unknown Browser"}
									</span>
									{session.isCurrent && (
										<span className="rounded-full bg-[#7047C7]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7047C7]">
											This device
										</span>
									)}
								</div>
								{session.deviceName && (
									<span className="text-xs font-medium text-gray-600">
										{session.deviceName}
									</span>
								)}
								<span className="text-xs text-gray-500">
									IP: {session.ipAddress || "Unknown"}
								</span>
								<span className="text-[11px] text-gray-400">
									Last active:{" "}
									{formatDateTime(session.lastUsedAt || session.createdAt)}
								</span>
							</div>

							{!session.isCurrent && (
								<button
									type="button"
									onClick={() => handleRevoke(session.id)}
									disabled={revokingId === session.id}
									className="rounded-full px-4 py-1.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
								>
									{revokingId === session.id ? "Revoking..." : "Revoke"}
								</button>
							)}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

/* ================= PAGE ================= */

const Dashboard = () => {
	const {
		user,
		guest,
		loading,
		isLogin,
		isGuest,
		isMaxTryReached,
		guestLeft,
		refreshAuth,
	} = useUser();
	const router = useRouter();

	const [pendingAction, setPendingAction] = useState<PendingAction>(null);
	const [actionLoading, setActionLoading] = useState(false);

	const closeModal = useCallback(() => setPendingAction(null), []);

	const handleLogout = async () => {
		setActionLoading(true);
		try {
			await api.post("/auth/logout"); // cookie cleared by Express
			await refreshAuth?.();
			router.replace("/login");
			router.refresh(); // refetch auth state
		} catch (err: any) {
			console.error("Logout failed", err);
			toast.error(err.response?.data?.message || "Couldn't log out. Try again.");
		} finally {
			setActionLoading(false);
			setPendingAction(null);
		}
	};

	// Logs out EVERY session, including this device
	const handleLogoutAll = async () => {
		setActionLoading(true);
		try {
			const res = await api.post("/auth/logoutall");
			if (res.data?.success) {
				toast.success("All sessions revoked");
				await refreshAuth?.();
				router.replace("/login");
			} else {
				toast.error(res.data?.message || "Failed to revoke all sessions");
			}
		} catch (err: any) {
			console.error("Failed to revoke all sessions", err);
			toast.error(err.response?.data?.message || "Error revoking sessions");
		} finally {
			setActionLoading(false);
			setPendingAction(null);
		}
	};

	const handleConfirm = () =>
		pendingAction === "logoutAll" ? handleLogoutAll() : handleLogout();

	/* ---------- State routing (highest priority first) ---------- */

	// 1. Loading
	if (loading) {
		return <Loading />;
	}

	// 2. Blocked guest
	if (isMaxTryReached) {
		return <MaxTryReached />;
	}

	// 3. Not logged in at all
	if (!isLogin && !isGuest) {
		return <NotLoginComponent />;
	}

	const viewerId = isLogin ? user?.id : isGuest ? guest?.id : undefined;
	const viewerType = isLogin ? "user" : "guest";

	// 4. Guest user (allowed but limited)
	if (isGuest) {
		return (
			<PageShell centered>
				<h1 className="sr-only">Dashboard</h1>

				<div className="flex flex-col items-center rounded-3xl bg-white px-10 py-8 shadow-2xl">
					<h2 className="text-xl font-bold text-[#7047C7]">Guest Mode</h2>
					<p className="mt-2 text-sm text-gray-500">Tries left: {guestLeft}</p>

					{/* PLACEHOLDER: real sign-up route in SIGNUP_HREF above */}
					<Link
						href={SIGNUP_HREF}
						className="mt-4 rounded-full bg-[#F0DE4A] px-5 py-2 text-sm font-bold text-black shadow-md transition hover:bg-[#e6d43f]"
					>
						Create an account to keep your history
					</Link>
				</div>

				<div className="w-full">
					<QuizPlayerHistory viewerId={viewerId} viewerType={viewerType} />
				</div>
			</PageShell>
		);
	}

	// 5. Logged-in user dashboard
	if (isLogin && user) {
		const copy = MODAL_COPY[pendingAction ?? "logout"];

		return (
			<PageShell>
				<h1 className="sr-only">Dashboard</h1>

				<div className="mx-auto w-full max-w-7xl p-4">
					<ProfileHeader
						user={user}
						onEdit={() => router.push("/dashboard/profile/edit")}
						onLogout={() => setPendingAction("logout")}
					/>
				</div>

				{/* PLACEHOLDER (stats row): quizzes played, current streak, rank —
				    needs a small /quizzes/stats endpoint. */}

				{/* Cards */}
				<div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 pt-8 sm:gap-4 lg:grid-cols-4">
					{Array.isArray(data) &&
						data.map((element) => (
							<Card
								key={element.title}
								title={element.title}
								icon={element.icon}
								content={element.Content}
								server={element.server}
								progressBar={element.progressBar}
							/>
						))}
				</div>

				<QuizPlayerHistory viewerId={viewerId} viewerType={viewerType} />
				<FriendRequest />

				<ActiveSessions onLogoutAll={() => setPendingAction("logoutAll")} />

				<ConfirmModal
					open={pendingAction !== null}
					title={copy.title}
					message={copy.message}
					confirmLabel={copy.confirmLabel}
					loading={actionLoading}
					onConfirm={handleConfirm}
					onCancel={closeModal}
				/>
			</PageShell>
		);
	}

	// 6. Fallback (should never happen)
	return (
		<PageShell centered>
			<div className="rounded-3xl bg-white px-8 py-6 shadow-2xl">
				<p role="alert" className="text-sm font-semibold text-red-500">
					Something went wrong. Please refresh.
				</p>
			</div>
		</PageShell>
	);
};

export default Dashboard;