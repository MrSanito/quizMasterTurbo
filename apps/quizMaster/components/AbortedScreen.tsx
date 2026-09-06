"use client";

import { DoorClosed, Gamepad2, Home, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface AbortedScreenProps {
	roomId?: string;
	message?: string;
	title?: string;
}

export default function AbortedScreen({
	roomId,
	message = "This room has been aborted and closed.",
	title = "Room Aborted & Closed",
}: AbortedScreenProps) {
	const router = useRouter();

	return (
		<div className="relative min-h-[90vh] overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4 py-16 flex flex-col items-center justify-center text-center select-none">
			{/* Ambient background glows */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl animate-pulse" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-amber-500/15 blur-3xl" />
			<div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[32rem] w-[32rem] rounded-full bg-purple-600/10 blur-[100px]" />

			{/* Background subtle geometric SVG wave */}
			<svg
				className="pointer-events-none absolute bottom-0 left-0 z-0 h-48 w-full text-white/[0.03]"
				viewBox="0 0 1200 120"
				preserveAspectRatio="none"
				fill="currentColor"
			>
				<path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z" />
			</svg>

			{/* Glassmorphic Modal Card */}
			<div className="relative z-10 w-full max-w-lg rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 shadow-2xl flex flex-col items-center gap-6 text-white animate-in zoom-in-95 duration-300">
				
				{/* Top Warning Badge */}
				<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-black uppercase tracking-widest shadow-inner">
					<ShieldAlert size={14} className="text-rose-300" />
					<span>Session Terminated</span>
				</div>

				{/* Animated Glowing Icon */}
				<div className="relative my-1">
					<div className="absolute -inset-2 rounded-3xl bg-rose-500/30 blur-xl animate-pulse" />
					<div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-rose-800 text-white shadow-2xl border border-white/20 transform hover:scale-105 transition-transform duration-300">
						<DoorClosed className="w-10 h-10 drop-shadow-md" />
					</div>
				</div>

				{/* Room Identifier */}
				{roomId && (
					<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/15 text-xs font-mono font-bold text-slate-300 tracking-wider shadow-sm">
						<span>Arena: {roomId}</span>
						<span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
						<span className="text-rose-300 uppercase text-[10px] font-black">Closed</span>
					</div>
				)}

				{/* Header & Explanation */}
				<div className="space-y-2.5">
					<h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
						{title}
					</h2>
					<p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-sm mx-auto font-medium">
						{message}
					</p>
				</div>

				{/* Action CTA Buttons */}
				<div className="w-full flex flex-col gap-3 mt-2">
					<button
						onClick={() => router.push("/quiz/mode")}
						className="w-full py-4 px-6 rounded-2xl bg-[#F0DE4A] text-black font-extrabold text-sm hover:bg-[#e6d43f] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 group"
					>
						<Sparkles size={17} className="group-hover:rotate-12 transition-transform" />
						<span>Explore Other Modes</span>
					</button>

					<button
						onClick={() => router.push("/room/create")}
						className="w-full py-3.5 px-6 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-sm transition-all border border-white/20 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
					>
						<Gamepad2 size={17} />
						<span>Create New Arena</span>
					</button>

					<button
						onClick={() => router.push("/dashboard")}
						className="w-full py-3 px-6 rounded-2xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 mt-1"
					>
						<Home size={14} />
						<span>Back to Dashboard</span>
					</button>
				</div>
			</div>
		</div>
	);
}
