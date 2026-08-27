"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import QuizPlayerHistory from "@/app/dashboard/Components/QuizPlayerHistory";
import { data } from "@/app/dashboard/data";
import Card from "@/components/Card";
import FriendRequest from "@/components/FriendRequest";
import Loading from "@/components/Loading";
import MaxTryReached from "../(auth)/components/MaxTryReached";
import api from "../lib/api";

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

	useEffect(() => {
		if (!loading && !isLogin && !isGuest) {
			router.replace("/login");
		}
	}, [loading, isLogin, isGuest, router]);

	const [logOutModal, setLogOutModal] = useState(false);

	const [sessions, setSessions] = useState<any[]>([]);
	const [sessionsLoading, setSessionsLoading] = useState(true);
	const [sessionError, setSessionError] = useState<string | null>(null);

	const fetchSessions = useCallback(async () => {
		try {
			setSessionsLoading(true);
			const res = await api.get("/auth/sessions");
			if (res.data?.success) {
				setSessions(res.data.sessions || []);
			} else {
				setSessionError("Failed to load active sessions.");
			}
		} catch (err: any) {
			setSessionError("Error fetching sessions.");
			console.error(err);
		} finally {
			setSessionsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isLogin) {
			fetchSessions();
		}
	}, [isLogin, fetchSessions]);

	const handleRevokeSession = async (sessionId: string) => {
		try {
			const res = await api.post(`/auth/revoke/${sessionId}`);
			if (res.data?.success) {
				fetchSessions();
			} else {
				alert(res.data?.message || "Failed to revoke session");
			}
		} catch (err) {
			console.error("Failed to revoke session", err);
			alert("Error revoking session");
		}
	};

	const handleLogoutAllOther = async () => {
		if (
			!confirm(
				"Are you sure you want to log out of all sessions? This will log you out of this device as well.",
			)
		) {
			return;
		}
		try {
			const res = await api.post("/auth/logoutall");
			if (res.data?.success) {
				if (refreshAuth) {
					await refreshAuth();
				}
				router.push("/login");
			} else {
				alert(res.data?.message || "Failed to revoke all sessions");
			}
		} catch (err) {
			console.error("Failed to revoke all sessions", err);
			alert("Error revoking sessions");
		}
	};

	// const api = axios.create({
	//   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
	//   withCredentials: true, //  REQUIRED
	// });

	const handleLogout = async () => {
		try {
			await api.post("/auth/logout"); //  cookie cleared by Express
			await refreshAuth();
			router.refresh(); // refetch auth state
			router.replace("/login"); // go to login
		} catch (err) {
			console.error("Logout failed", err);
		}
	};

	const viewerId =
		!loading && isLogin
			? user?.id
			: !loading && isGuest
				? guest?.id
				: undefined;

	const viewerType = isLogin ? "user" : "guest";

	console.log(viewerId, viewerType);

	console.log(
		user?.avatar ? `/avatars/${user.avatar}` : "/avatars/avatar1.svg",
	);

	// 1 Loading (highest priority)
	if (loading) {
		return <Loading />;
	}

	// 2 Blocked guest
	if (isMaxTryReached) {
		return <MaxTryReached />;
	}

	// 3 Not logged in at all
	if (!isLogin && !isGuest) {
		// return <NotLoginComponent />;
		return null;
	}

	// 4 Guest user (allowed but limited)
	if (isGuest) {
		return (
			<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4 py-10">
				{/* Ambient glow, echoes the hero's palette */}
				<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
				<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

				<div className="relative z-10 flex flex-col items-center rounded-3xl bg-white px-10 py-8 shadow-2xl">
					<h2 className="text-xl font-bold text-[#7047C7]">Guest Mode</h2>
					<p className="mt-2 text-sm text-gray-500">Tries left: {guestLeft}</p>
				</div>
				<div className="relative z-10 w-full">
					<QuizPlayerHistory viewerId={viewerId} viewerType={viewerType} />
				</div>
			</div>
		);
	}

	// 5 Logged-in user dashboard
	if (isLogin && user) {
		const dummyUser = {
			name: "Jane Doe",
			avatarUrl:
				"https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp",
			greeting: "Welcome back,",
		};
		return (
			<div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4 py-6">
				{/* Ambient glow, echoes the hero's palette */}
				<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
				<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

				<div className="relative z-10">
					<div>
						<div className="w-full p-4">
							{/* Card Container */}
							<div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
								{/* Left Side: Avatar & Info */}
								<div className="flex items-center gap-4 mb-4 md:mb-0">
									<div className="avatar">
										<div className="w-14 h-14 rounded-full ring-2 ring-offset-2 ring-offset-white ring-[#7047C7]">
											<img
												src={
													user?.avatar
														? `/avatars/${user.avatar}`
														: "/avatars/avatar1.svg"
												}
												alt="profile"
											/>
										</div>
									</div>
									<div className="flex flex-col">
										<span className="text-gray-500 text-sm font-medium">
											{dummyUser.greeting}
										</span>
										<h2 className="text-gray-900 text-xl md:text-2xl font-bold tracking-tight">
											{`${user.firstName} ${user.lastName}`}
										</h2>
									</div>
								</div>

								{/* Right Side: Buttons */}
								<div className="flex items-center gap-3">
									<button
										onClick={() => router.push("/dashboard/profile/edit")}
										className="flex items-center justify-center min-h-[2.5rem] h-[2.5rem] px-6 rounded-full bg-[#F0DE4A] font-bold text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg"
									>
										Edit Profile
									</button>

									<button
										onClick={() => setLogOutModal(true)}
										className="flex items-center justify-center min-h-[2.5rem] h-[2.5rem] px-6 rounded-full border border-red-200 bg-white font-semibold text-red-500 transition-all duration-300 hover:bg-red-50"
									>
										Logout
									</button>
								</div>
							</div>
						</div>
					</div>

					{/*  Logout Modal */}
					{logOutModal && (
						<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
							<div className="bg-white rounded-3xl p-6 w-[90%] max-w-md shadow-2xl">
								<h3 className="text-gray-900 text-lg font-bold mb-2">
									Confirm Logout
								</h3>
								<p className="text-gray-500 text-sm mb-6">
									Are you sure you want to log out? Your current session will
									end.
								</p>

								<div className="flex justify-end gap-3">
									<button
										onClick={() => setLogOutModal(false)}
										className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 font-semibold transition"
									>
										Cancel
									</button>

									<button
										onClick={handleLogout}
										type="submit"
										className="rounded-full border border-red-200 bg-white text-red-500 px-5 py-2.5 font-semibold transition hover:bg-red-50"
									>
										Logout
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Cards */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-8 max-w-7xl mx-auto">
						{Array.isArray(data) &&
							data.map((element, key) => (
								<Card
									key={key}
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

					{/* Active Sessions */}
					{isLogin && (
						<div className="max-w-7xl mx-auto mt-12 bg-white border border-gray-100 rounded-3xl p-6 shadow-xl">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
								<h2 className="text-xl sm:text-2xl font-bold text-gray-900">
									Active Sessions
								</h2>
								{sessions.length > 1 && (
									<button
										onClick={handleLogoutAllOther}
										className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
									>
										Log Out of All Sessions
									</button>
								)}
							</div>

							{sessionsLoading ? (
								<div className="flex justify-center p-4">
									<span className="h-6 w-6 animate-spin rounded-full border-2 border-[#7047C7]/20 border-t-[#7047C7]" />
								</div>
							) : sessionError ? (
								<p className="text-red-500 text-sm">{sessionError}</p>
							) : sessions.length === 0 ? (
								<p className="text-gray-400 text-sm">
									No active sessions found.
								</p>
							) : (
								<div className="space-y-4">
									{sessions.map((session) => (
										<div
											key={session.id}
											className={`flex items-center justify-between p-4 rounded-xl border ${
												session.isCurrent
													? "bg-[#7047C7]/5 border-[#7047C7]/30"
													: "bg-gray-50 border-gray-100"
											}`}
										>
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-2">
													<span className="font-semibold text-sm text-gray-800">
														{session.os || "Unknown OS"} •{" "}
														{session.browser || "Unknown Browser"}
													</span>
													{session.isCurrent && (
														<span className="rounded-full bg-[#7047C7]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7047C7]">
															This Device
														</span>
													)}
												</div>
												<span className="text-xs text-gray-500">
													IP: {session.ipAddress || "Unknown IP"}
												</span>
												<span className="text-[11px] text-gray-400">
													Last active:{" "}
													{new Date(
														session.lastUsedAt || session.createdAt,
													).toLocaleString()}
												</span>
											</div>
											{!session.isCurrent && (
												<button
													onClick={() => handleRevokeSession(session.id)}
													className="rounded-full px-4 py-1.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
												>
													Revoke
												</button>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		);
	}

	// 6 Fallback (should never happen)
	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4">
			<div className="relative z-10 rounded-3xl bg-white px-8 py-6 shadow-2xl">
				<p className="text-sm font-semibold text-red-500">
					Something went wrong. Please refresh.
				</p>
			</div>
		</div>
	);
};

export default Dashboard;
