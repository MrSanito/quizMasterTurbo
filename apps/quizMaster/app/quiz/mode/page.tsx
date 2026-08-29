"use client";

import { ArrowRight, Brain, Sparkles, Users, Trophy, Flame } from "lucide-react";
import Link from "next/link";

const QuizModePage = () => {
	return (
		<div className="relative min-h-[85vh] overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-6 py-16 flex flex-col items-center justify-center">
			{/* Ambient background glows */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

			{/* Subtle wave pattern */}
			<svg
				className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-2/3 text-white/[0.04] md:h-56"
				viewBox="0 0 500 200"
				preserveAspectRatio="none"
				fill="currentColor"
			>
				<path d="M0,200 L0,60 C140,140 300,200 500,200 Z" />
			</svg>

			<div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
				{/* Header Section */}
				<div className="text-center max-w-2xl mx-auto mb-12">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F0DE4A] text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm">
						<Sparkles size={14} />
						GAME MODES
					</div>
					<h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
						Choose How You Want To Play
					</h1>
					<p className="text-slate-200 text-sm md:text-base leading-relaxed">
						Go head-to-head live with friends or test your skills in solo practice mode.
					</p>
				</div>

				{/* Mode Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
					{/* Multiplayer Mode */}
					<Link
						href="/room/create"
						className="group relative overflow-hidden rounded-3xl bg-white/95 p-8 shadow-xl border border-white/40 hover:bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between"
					>
						<div>
							{/* Top badge & Icon */}
							<div className="flex items-center justify-between mb-6">
								<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#340C97] to-[#7047C7] text-white shadow-md group-hover:scale-110 transition-transform">
									<Users size={32} />
								</div>
								<span className="inline-flex items-center gap-1 rounded-full bg-[#F0DE4A]/20 px-3 py-1 text-xs font-extrabold text-[#7047C7] border border-[#F0DE4A]/40">
									<Flame size={13} className="text-orange-500" />
									POPULAR
								</span>
							</div>

							<h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-[#340C97] transition-colors">
								Multiplayer Arena
							</h3>
							<p className="text-sm text-gray-600 font-medium leading-relaxed">
								Host or join real-time multiplayer rooms. Battle live with friends and climb the live scoreboard!
							</p>
						</div>

						{/* Action Button */}
						<div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
							<span className="text-xs font-bold text-[#7047C7] group-hover:text-[#340C97] tracking-wider uppercase transition-colors">
								CREATE / JOIN ROOM
							</span>
							<div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0DE4A] text-black shadow-md group-hover:bg-[#e6d43f] group-hover:scale-110 transition-all">
								<ArrowRight
									size={16}
									className="group-hover:translate-x-0.5 transition-transform"
								/>
							</div>
						</div>
					</Link>

					{/* Solo Quiz Mode */}
					<Link
						href="/categories"
						className="group relative overflow-hidden rounded-3xl bg-white/95 p-8 shadow-xl border border-white/40 hover:bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between"
					>
						<div>
							{/* Top badge & Icon */}
							<div className="flex items-center justify-between mb-6">
								<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7047C7] to-[#9A74E8] text-white shadow-md group-hover:scale-110 transition-transform">
									<Brain size={32} />
								</div>
								<span className="inline-flex items-center gap-1 rounded-full bg-[#340C97]/10 px-3 py-1 text-xs font-bold text-[#340C97]">
									<Trophy size={13} />
									PRACTICE
								</span>
							</div>

							<h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-[#340C97] transition-colors">
								Solo Challenge
							</h3>
							<p className="text-sm text-gray-600 font-medium leading-relaxed">
								Select from curated categories, test your knowledge at your own pace, and track your stats.
							</p>
						</div>

						{/* Action Button */}
						<div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
							<span className="text-xs font-bold text-[#7047C7] group-hover:text-[#340C97] tracking-wider uppercase transition-colors">
								EXPLORE TOPICS
							</span>
							<div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0DE4A] text-black shadow-md group-hover:bg-[#e6d43f] group-hover:scale-110 transition-all">
								<ArrowRight
									size={16}
									className="group-hover:translate-x-0.5 transition-transform"
								/>
							</div>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default QuizModePage;
