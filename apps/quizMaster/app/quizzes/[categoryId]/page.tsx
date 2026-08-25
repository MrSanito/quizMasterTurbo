"use client";

import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, Play, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";
import MaxTryReached from "../../(auth)/components/MaxTryReached";
import NotLoginComponent from "../../(auth)/components/NotLoginComponent";
import { useUser } from "../../(auth)/context/GetUserContext";

type Quiz = {
	_id: string;
	quizNumber: number;
	title: string;
	totalQuestions: number;
};

export default function QuizzesByCategoryPage() {
	/* ---------------- HOOKS ---------------- */

	const { categoryId } = useParams<{ categoryId: string }>();
	const router = useRouter();

	const { loading, isLogin, isGuest, isMaxTryReached } = useUser();

	const [quizzes, setQuizzes] = useState<Quiz[]>([]);
	const [pageLoading, setPageLoading] = useState(true);

	/* ---------------- DATA FETCH ---------------- */

	useEffect(() => {
		if (loading || isMaxTryReached || (!isLogin && !isGuest) || !categoryId) {
			return;
		}

		const fetchQuizzes = async () => {
			try {
				const res = await api.get(`/categories/${categoryId}/quizzes`);
				setQuizzes(res.data.quizzes || []);
			} catch (err) {
				console.error("Failed to fetch quizzes", err);
			} finally {
				setPageLoading(false);
			}
		};

		fetchQuizzes();
	}, [categoryId, loading, isLogin, isGuest, isMaxTryReached]);

	/* ---------------- GUARDS ---------------- */

	if (loading) return <Loading />;
	if (isMaxTryReached) return <MaxTryReached />;
	if (!isLogin && !isGuest) return <NotLoginComponent />;

	if (pageLoading) {
		return (
			<div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] flex items-center justify-center text-white">
				<Loading />
			</div>
		);
	}

	/* ---------------- UI ---------------- */

	return (
		<div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-6 py-16 flex flex-col items-center">
			{/* Ambient glow orbs */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

			{/* Bottom wave cutout */}
			<svg
				className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-2/3 text-white/[0.04] md:h-56"
				viewBox="0 0 500 200"
				preserveAspectRatio="none"
				fill="currentColor"
			>
				<path d="M0,200 L0,60 C140,140 300,200 500,200 Z" />
			</svg>

			<div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
				{/* Back Link */}
				<div className="w-full flex justify-start mb-6">
					<button
						onClick={() => router.push("/categories")}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold transition-all"
					>
						<ArrowLeft size={16} />
						Back to Categories
					</button>
				</div>

				{/* Header Title */}
				<div className="text-center max-w-2xl mx-auto mb-12">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F0DE4A] text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm">
						<Sparkles size={14} />
						Available Quizzes
					</div>
					<h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
						Select Your Challenge
					</h1>
					<p className="text-slate-200 text-sm md:text-base leading-relaxed">
						Pick a quiz below to start answering questions, earn points, and
						climb the leaderboard!
					</p>
				</div>

				{/* Empty State */}
				{quizzes.length === 0 ? (
					<div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 text-center shadow-xl">
						<Trophy className="w-12 h-12 text-[#F0DE4A] mx-auto mb-3 opacity-80" />
						<h3 className="text-lg font-bold text-white mb-1">
							No Quizzes Available
						</h3>
						<p className="text-sm text-slate-300 mb-6">
							There are no active quizzes for this category yet.
						</p>
						<button
							onClick={() => router.push("/categories")}
							className="inline-flex items-center gap-2 rounded-full bg-[#F0DE4A] px-6 py-2.5 text-xs font-bold text-black hover:bg-[#e6d43f] transition-all"
						>
							Browse Other Categories
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
						{quizzes.map((quiz, index) => (
							<motion.div
								key={quiz._id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<Link
									href={`/quiz/${quiz._id}`}
									className="group relative overflow-hidden rounded-3xl bg-white/95 p-6 shadow-xl border border-white/40 hover:bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between h-full"
								>
									<div>
										{/* Top Row: Quiz # Badge & Question Count */}
										<div className="flex items-center justify-between mb-4">
											<span className="rounded-full bg-[#340C97] px-3 py-1 text-xs font-extrabold text-[#F0DE4A]">
												Quiz #{quiz.quizNumber}
											</span>
											<span className="flex items-center gap-1 text-xs font-bold text-gray-500">
												<HelpCircle size={14} className="text-[#7047C7]" />
												{quiz.totalQuestions || 0} Questions
											</span>
										</div>

										{/* Title */}
										<h3 className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-[#340C97] transition-colors leading-snug">
											{quiz.title}
										</h3>
										<p className="text-xs text-gray-500 font-medium">
											Compete for high scores & bonuses
										</p>
									</div>

									{/* Bottom Action Button */}
									<div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
										<span className="text-xs font-bold text-[#7047C7] group-hover:text-[#340C97] transition-colors flex items-center gap-1">
											PLAY NOW
										</span>
										<div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0DE4A] text-black shadow-md group-hover:bg-[#e6d43f] group-hover:scale-110 transition-all">
											<Play size={12} fill="currentColor" className="ml-0.5" />
										</div>
									</div>
								</Link>
							</motion.div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
