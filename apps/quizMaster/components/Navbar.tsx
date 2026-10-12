"use client";

import { Avatar } from "@mui/material";
import {
	Award,
	Brain,
	ChevronDown,
	Flame,
	LayoutDashboard,
	LogOut,
	Menu,
	Pencil,
	Trophy,
	User,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";

const Navbar = () => {
	const { user, loading, isLogin, refreshAuth } = useUser();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	/* ---------- Desktop profile hover popover ---------- */
	const [profileOpen, setProfileOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);
	const [logoutError, setLogoutError] = useState<string | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const avatarSrc = user?.avatar
		? `/avatars/${user.avatar}`
		: "/avatars/avatar1.svg";
	const fullName =
		[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Player";

	const openProfile = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setProfileOpen(true);
	};

	// Small delay so the popover doesn't flicker shut while the mouse
	// travels from the avatar to the panel.
	const closeProfile = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setProfileOpen(false), 150);
	};

	useEffect(() => {
		return () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		};
	}, []);

	const handleLogout = async () => {
		setLoggingOut(true);
		setLogoutError(null);
		try {
			await api.post("/auth/logout"); // cookie cleared by Express
			await refreshAuth?.();
			setProfileOpen(false);
			router.replace("/login");
			router.refresh();
		} catch (err) {
			console.error("Logout failed", err);
			setLogoutError("Couldn't log out. Try again.");
		} finally {
			setLoggingOut(false);
		}
	};

	return (
		<>
			{/* Navbar Container */}
			<header className="sticky top-0 z-50 w-full bg-[#340C97]/90 backdrop-blur-md border-b border-[#5B32B4]/30 transition-all duration-300">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 text-white">
					{/* Brand Logo */}
					<div className="flex items-center gap-8">
						<Link
							href="/"
							className="flex items-center gap-0.5 text-xl font-bold text-white hover:opacity-90 transition-opacity"
						>
							<img
								src="/q-logo.svg"
								alt="Q"
								className="h-9 w-9 object-contain"
							/>
							<span className="bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent font-extrabold tracking-tight">
								uizMaster
							</span>
						</Link>

						{/* Desktop Navigation Links */}
						<nav className="hidden md:flex items-center gap-1 text-sm font-medium">
							{/* Trivia Dropdown */}
							<div className="dropdown dropdown-hover relative">
								<Link
									href="/quiz/mode"
									className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
								>
									<Flame size={16} className="text-[#F0DE4A]" />
									<span>Trivia</span>
									<ChevronDown size={14} className="opacity-70" />
								</Link>
								<ul className="dropdown-content menu z-50 mt-1 w-48 rounded-2xl bg-[#1b0654] border border-[#5B32B4]/40 p-2 text-white shadow-2xl backdrop-blur-xl">
									<li>
										<Link
											href="/quiz/mode"
											className="hover:bg-[#340C97] px-3 py-2.5 rounded-xl flex items-center gap-2"
										>
											<Flame size={15} className="text-yellow-400" />
											<div>
												<div className="font-semibold text-xs">
													Daily Trivia
												</div>
												<div className="text-[10px] text-slate-400">
													Play daily challenge
												</div>
											</div>
										</Link>
									</li>
									<li>
										<Link
											href="/quiz/mode"
											className="hover:bg-[#340C97] px-3 py-2.5 rounded-xl flex items-center gap-2"
										>
											<Award size={15} className="text-indigo-400" />
											<div>
												<div className="font-semibold text-xs">
													Multiplayer Arena
												</div>
												<div className="text-[10px] text-slate-400">
													Battle live players
												</div>
											</div>
										</Link>
									</li>
								</ul>
							</div>

							{/* Quizzes Dropdown */}
							<div className="dropdown dropdown-hover relative">
								<Link
									href="/categories"
									className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
								>
									<Brain size={16} className="text-indigo-300" />
									<span>Quizzes</span>
									<ChevronDown size={14} className="opacity-70" />
								</Link>
								<ul className="dropdown-content menu z-50 mt-1 w-48 rounded-2xl bg-[#1b0654] border border-[#5B32B4]/40 p-2 text-white shadow-2xl backdrop-blur-xl">
									<li>
										<Link
											href="/categories"
											className="hover:bg-[#340C97] px-3 py-2.5 rounded-xl flex items-center gap-2"
										>
											<Brain size={15} className="text-indigo-400" />
											<div>
												<div className="font-semibold text-xs">
													All Categories
												</div>
												<div className="text-[10px] text-slate-400">
													Browse by topic
												</div>
											</div>
										</Link>
									</li>
									<li>
										<Link
											href="/practice/custom"
											className="hover:bg-[#340C97] px-3 py-2.5 rounded-xl flex items-center gap-2"
										>
											<Flame size={15} className="text-amber-400" />
											<div>
												<div className="font-semibold text-xs">
													Practice Mode
												</div>
												<div className="text-[10px] text-slate-400">
													Custom practice questions
												</div>
											</div>
										</Link>
									</li>
								</ul>
							</div>

							{/* Leaderboard Link */}
							<Link
								href="/leaderboard"
								className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
							>
								<Trophy size={16} className="text-yellow-400" />
								<span>Leaderboard</span>
							</Link>
						</nav>
					</div>

					{/* Authentication Section (Desktop) */}
					<div className="hidden md:flex items-center gap-4 text-sm font-medium">
						{isLogin ? (
							<div className="flex items-center gap-3">
								<Link
									href="/leaderboard"
									className="px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
								>
									Rankings
								</Link>

								{/* Profile trigger + hover popover */}
								<div
									className="relative"
									onMouseEnter={openProfile}
									onMouseLeave={closeProfile}
									onFocus={openProfile}
									onBlur={(e) => {
										// only close when focus leaves the whole widget
										if (!e.currentTarget.contains(e.relatedTarget as Node)) {
											closeProfile();
										}
									}}
									onKeyDown={(e) => {
										if (e.key === "Escape") setProfileOpen(false);
									}}
								>
									<Link
										href="/dashboard"
										aria-expanded={profileOpen}
										className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[#1b0654]/80 border border-[#5B32B4]/40 hover:border-indigo-400/60 transition-all shadow-md group"
									>
										<Avatar
											src={avatarSrc}
											sx={{
												width: 32,
												height: 32,
												border: "2px solid rgba(255,255,255,0.3)",
											}}
										/>
										<span className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors max-w-[100px] truncate">
											{user?.firstName || "Dashboard"}
										</span>
										<ChevronDown
											size={14}
											className={`opacity-70 transition-transform duration-200 ${
												profileOpen ? "rotate-180" : ""
											}`}
										/>
									</Link>

									{/* pt-2 keeps the hover area continuous (no dead gap between
									    the trigger and the panel) */}
									<div
										className={`absolute right-0 top-full z-50 w-64 pt-2 transition-all duration-150 ${
											profileOpen
												? "visible translate-y-0 opacity-100"
												: "pointer-events-none invisible -translate-y-1 opacity-0"
										}`}
									>
										<div className="rounded-2xl border border-[#5B32B4]/40 bg-[#1b0654] p-2 text-white shadow-2xl backdrop-blur-xl">
											{/* User summary */}
											<div className="flex items-center gap-3 rounded-xl px-3 py-3">
												<Avatar
													src={avatarSrc}
													sx={{
														width: 44,
														height: 44,
														border: "2px solid rgba(255,255,255,0.3)",
													}}
												/>
												<div className="min-w-0">
													<p className="truncate text-sm font-bold">
														{fullName}
													</p>
													{/* PLACEHOLDER (quick stats): "🔥 3-day streak · Rank #42"
													    once a /quizzes/stats endpoint exists. */}
													<p className="text-xs text-indigo-300/80">
														Signed in
													</p>
												</div>
											</div>

											<div className="my-1 h-px bg-[#5B32B4]/30" />

											<Link
												href="/dashboard"
												onClick={() => setProfileOpen(false)}
												className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold hover:bg-[#340C97]"
											>
												<LayoutDashboard size={15} className="text-[#F0DE4A]" />
												Dashboard
											</Link>
											<Link
												href="/dashboard/profile/edit"
												onClick={() => setProfileOpen(false)}
												className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold hover:bg-[#340C97]"
											>
												<Pencil size={15} className="text-indigo-300" />
												Edit profile
											</Link>

											{/* PLACEHOLDER (more shortcuts): "My quiz history", "Friends",
											    "Settings" — same Link style as above. */}

											<div className="my-1 h-px bg-[#5B32B4]/30" />

											<button
												type="button"
												onClick={handleLogout}
												disabled={loggingOut}
												className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
											>
												<LogOut size={15} />
												{loggingOut ? "Logging out..." : "Log out"}
											</button>

											{logoutError && (
												<p
													role="alert"
													className="px-3 pb-2 pt-1 text-[11px] text-red-300"
												>
													{logoutError}
												</p>
											)}
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className="flex items-center gap-3">
								<Link
									href="/login"
									className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition"
								>
									Login
								</Link>
								<Link href="/register">
									<button className="btn h-9 min-h-0 rounded-full bg-[#F0DE4A] px-5 text-black hover:bg-[#e6d43f] border-none font-bold text-xs tracking-wide shadow-md transition-all">
										REGISTER
									</button>
								</Link>
							</div>
						)}
					</div>

					{/* Mobile Hamburger Menu Button */}
					<button
						className="btn btn-square btn-ghost md:hidden text-white hover:bg-white/10"
						onClick={() => setIsOpen(!isOpen)}
						aria-label="Toggle menu"
					>
						{isOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</header>

			{/* Mobile Sidebar Navigation Drawer */}
			<div
				className={`fixed top-0 left-0 h-screen w-72 bg-[#1b0654]/95 backdrop-blur-2xl
        border-r border-[#5B32B4]/40 shadow-2xl p-6 flex flex-col justify-between
        transform transition-all duration-300 ease-out z-50
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
			>
				<div>
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<Link
							href="/"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-0.5 text-lg font-bold text-white"
						>
							<img
								src="/q-logo.svg"
								alt="Q"
								className="h-8 w-8 object-contain"
							/>
							<span>uizMaster</span>
						</Link>
						<button
							onClick={() => setIsOpen(false)}
							className="btn btn-ghost btn-circle btn-sm hover:bg-white/10 text-white"
						>
							<X size={20} />
						</button>
					</div>

					{/* User Info on Mobile */}
					{isLogin && user && (
						<Link
							href="/dashboard"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-[#340C97]/50 border border-[#5B32B4]/40 text-white hover:bg-[#340C97]/80 transition"
						>
							<Avatar
								src={avatarSrc}
								sx={{
									width: 44,
									height: 44,
									border: "2px solid rgba(255,255,255,0.3)",
								}}
							/>
							<div className="overflow-hidden">
								<p className="font-bold text-sm truncate">
									{user?.firstName} {user?.lastName}
								</p>
								<p className="text-xs text-indigo-300 opacity-80">
									View Profile
								</p>
							</div>
						</Link>
					)}

					{/* Navigation Links List */}
					<nav className="flex flex-col gap-2">
						{[
							{ href: "/", label: "Home", icon: Flame },
							{ href: "/quiz/mode", label: "Trivia & Quizzes", icon: Brain },
							{ href: "/categories", label: "Categories", icon: Award },
							{ href: "/practice/custom", label: "Practice Mode", icon: Flame },
							{ href: "/leaderboard", label: "Leaderboard", icon: Trophy },
						].map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={() => setIsOpen(false)}
									className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/90 hover:text-white hover:bg-[#340C97]/60 transition-all duration-200"
								>
									<Icon size={18} className="text-[#F0DE4A]" />
									<span>{item.label}</span>
								</Link>
							);
						})}
					</nav>
				</div>

				{/* Auth Section Bottom on Mobile */}
				<div className="pt-4 border-t border-[#5B32B4]/30">
					{isLogin ? (
						<Link
							href="/dashboard"
							className="btn w-full bg-[#340C97] hover:bg-[#250873] text-white border-none rounded-xl gap-2 text-sm"
							onClick={() => setIsOpen(false)}
						>
							<User size={16} />
							Dashboard
						</Link>
					) : (
						<div className="flex flex-col gap-2.5">
							<Link
								href="/login"
								className="btn w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl text-sm"
								onClick={() => setIsOpen(false)}
							>
								Login
							</Link>
							<Link
								href="/register"
								className="btn w-full bg-[#F0DE4A] hover:bg-[#e6d43f] text-black font-bold border-none rounded-xl text-sm"
								onClick={() => setIsOpen(false)}
							>
								Register
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* Background Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
					onClick={() => setIsOpen(false)}
				/>
			)}
		</>
	);
};

export default Navbar;