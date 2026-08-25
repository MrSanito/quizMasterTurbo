"use client";

import { ArrowRight, BrainCircuit, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import MaxTryReached from "../(auth)/components/MaxTryReached";
import NotLoginComponent from "../(auth)/components/NotLoginComponent";
import { useUser } from "../(auth)/context/GetUserContext";
import api from "../lib/api";

type Category = {
	_id: string;
	name: string;
	icon?: string;
	quizzes: number;
};

export default function CategoriesPage() {
	/* ---------------- HOOKS ---------------- */

	const { loading, isLogin, isGuest, isMaxTryReached } = useUser();

	const [categories, setCategories] = useState<Category[]>([]);
	const [pageLoading, setPageLoading] = useState(true);

	useEffect(() => {
		if (loading || isMaxTryReached || (!isLogin && !isGuest)) return;

		const fetchCategories = async () => {
			try {
				const res = await api.get(`/categories`);
				setCategories(res.data.categories ?? res.data);
			} catch (err) {
				console.error("Failed to fetch categories", err);
			} finally {
				setPageLoading(false);
			}
		};

		fetchCategories();
	}, [loading, isLogin, isGuest, isMaxTryReached]);

	/* ---------------- GUARDS ---------------- */

	if (loading) {
		return <Loading />;
	}

	if (isMaxTryReached) {
		return <MaxTryReached />;
	}

	if (!isLogin && !isGuest) {
		return <NotLoginComponent />;
	}

	if (pageLoading) {
		return <Loading />;
	}

	/* ---------------- UI ---------------- */

	return (
		<div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-6 py-16 flex flex-col items-center">
			{/* Ambient glow, echoes the hero palette */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

			{/* Bottom-left wave cutout, matching hero section */}
			<svg
				className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-2/3 text-white/[0.04] md:h-56"
				viewBox="0 0 500 200"
				preserveAspectRatio="none"
				fill="currentColor"
			>
				<path d="M0,200 L0,60 C140,140 300,200 500,200 Z" />
			</svg>

			<div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
				{/* Header Badge & Title */}
				<div className="text-center max-w-2xl mx-auto mb-12">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F0DE4A] text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm">
						<Sparkles size={14} />
						Explore Topics
					</div>
					<h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
						Choose Your Quiz Category
					</h1>
					<p className="text-slate-200 text-sm md:text-base leading-relaxed">
						Select from a wide variety of topics, challenge yourself, and earn
						your place on the leaderboard!
					</p>
				</div>

				{/* Empty state */}
				{categories.length === 0 ? (
					<div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 text-center shadow-xl">
						<BrainCircuit className="w-12 h-12 text-[#F0DE4A] mx-auto mb-3 opacity-80" />
						<h3 className="text-lg font-bold text-white mb-1">
							No Categories Found
						</h3>
						<p className="text-sm text-slate-300">
							Check back later for newly added quiz topics.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
						{categories.map((category) => (
							<Link
								key={category._id}
								href={`/quizzes/${category._id}`}
								className="group relative overflow-hidden rounded-3xl bg-white/95 p-6 shadow-xl border border-white/40 hover:bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between"
							>
								<div>
									{/* Top row: Icon & Quiz Badge */}
									<div className="flex items-center justify-between mb-5">
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#340C97] to-[#7047C7] text-2xl text-white shadow-md group-hover:scale-110 transition-transform">
											{category.icon || "🎯"}
										</div>
										<span className="rounded-full bg-[#340C97]/10 px-3 py-1 text-xs font-bold text-[#340C97]">
											{category.quizzes || 0}{" "}
											{category.quizzes === 1 ? "Quiz" : "Quizzes"}
										</span>
									</div>

									{/* Name & description */}
									<h3 className="text-xl font-extrabold text-gray-900 mb-1 group-hover:text-[#340C97] transition-colors">
										{category.name}
									</h3>
									<p className="text-xs text-gray-500 font-medium">
										Test your knowledge & climb ranks
									</p>
								</div>

								{/* Bottom CTA Action Button */}
								<div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
									<span className="text-xs font-bold text-[#7047C7] group-hover:text-[#340C97] transition-colors flex items-center gap-1">
										START QUIZ
									</span>
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0DE4A] text-black shadow-md group-hover:bg-[#e6d43f] group-hover:scale-110 transition-all">
										<ArrowRight
											size={14}
											className="group-hover:translate-x-0.5 transition-transform"
										/>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
