"use client";

import { ChevronDown, ChevronLeft, Crown } from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LeaderboardUser {
	rank: number;
	name: string;
	points: number;
	avatarSeed: string;
	change?: number; // omitted for podium (top 3), present for the list rows
}

// ---------------------------------------------------------------------------
// Dynamic data — swap these arrays for an API call / props whenever ready
// e.g. const { data } = useSWR("/api/leaderboard", fetcher)
// ---------------------------------------------------------------------------
const podiumUsers: LeaderboardUser[] = [
	{ rank: 2, name: "Norris", points: 139, avatarSeed: "Norris-99" },
	{ rank: 1, name: "Ronald", points: 10000, avatarSeed: "Ronald-77" },
	{ rank: 3, name: "Tony", points: 127, avatarSeed: "Tony-55" },
];

const listUsers: LeaderboardUser[] = [
	{
		rank: 4,
		name: "Bhavna Mepani",
		points: 91,
		avatarSeed: "Bhavna-21",
		change: 2,
	},
	{ rank: 5, name: "Robin", points: 83, avatarSeed: "Robin-34", change: 1 },
	{ rank: 6, name: "Taran", points: 79, avatarSeed: "Taran-12", change: -2 },
	{ rank: 7, name: "Mike", points: 69, avatarSeed: "Mike-88", change: 3 },
	{ rank: 8, name: "Andrew", points: 61, avatarSeed: "Andrew-45", change: 1 },
];

const periods = ["Weekly", "Monthly", "All Time"];

const avatarUrl = (seed: string) =>
	`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
		seed,
	)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

// deterministic star field (no re-render jitter)
const STARS = Array.from({ length: 28 }).map((_, i) => ({
	top: (i * 37) % 100,
	left: (i * 53) % 100,
	size: (i % 3) + 1,
	opacity: 0.3 + ((i * 13) % 60) / 100,
}));

export default function Leaderboard() {
	const [periodIndex, setPeriodIndex] = useState(1);

	return (
		<div className="mx-auto w-full max-w-sm md:max-w-5xl select-none font-sans transition-all duration-300">
			<div className="relative overflow-hidden rounded-[2.25rem] md:rounded-3xl border-[8px] md:border-4 border-violet-300 md:border-violet-500/20 shadow-2xl md:grid md:grid-cols-5 md:min-h-[550px]">
				{/* ================= Night-sky podium panel ================= */}
				<div className="relative bg-gradient-to-b from-[#4c3e7d] via-[#2b2153] to-[#160f2e] pb-10 pt-5 md:col-span-2 md:flex md:flex-col md:justify-between md:pb-14">
					{/* stars */}
					<div className="pointer-events-none absolute inset-0 overflow-hidden">
						{STARS.map((s, i) => (
							<span
								key={i}
								className="absolute rounded-full bg-white"
								style={{
									top: `${s.top}%`,
									left: `${s.left}%`,
									width: s.size,
									height: s.size,
									opacity: s.opacity,
								}}
							/>
						))}
					</div>

					{/* mountains + treeline */}
					<svg
						className="pointer-events-none absolute bottom-0 left-0 w-full"
						height="70"
						viewBox="0 0 400 70"
						preserveAspectRatio="none"
					>
						<polygon points="0,70 40,20 80,70" fill="#120b26" opacity="0.6" />
						<polygon
							points="60,70 110,10 160,70"
							fill="#120b26"
							opacity="0.5"
						/>
						<polygon
							points="150,70 190,25 230,70"
							fill="#120b26"
							opacity="0.6"
						/>
						<polygon
							points="220,70 270,15 320,70"
							fill="#120b26"
							opacity="0.5"
						/>
						<polygon
							points="300,70 350,22 400,70"
							fill="#120b26"
							opacity="0.6"
						/>
						{Array.from({ length: 14 }).map((_, i) => (
							<polygon
								key={i}
								points={`${i * 30},70 ${i * 30 + 10},45 ${i * 30 + 20},70`}
								fill="#0d0820"
							/>
						))}
					</svg>

					{/* header */}
					<div className="relative z-10 flex items-center justify-between px-4">
						<button
							aria-label="Back"
							className="text-white/90 transition hover:text-white"
						>
							<ChevronLeft size={22} />
						</button>
						<h1 className="text-xs font-semibold tracking-[0.2em] text-white/90">
							LEADERBOARD
						</h1>
						<button
							onClick={() => setPeriodIndex((i) => (i + 1) % periods.length)}
							className="badge gap-1 rounded-full border border-teal-300/40 bg-white/10 px-3 py-3 text-[11px] font-medium text-teal-300 backdrop-blur-sm"
						>
							{periods[periodIndex]}
							<ChevronDown size={12} />
						</button>
					</div>

					{/* podium */}
					<div className="relative z-10 mt-8 md:my-auto flex items-end justify-center gap-3 px-4">
						{podiumUsers.map((u) => {
							const isFirst = u.rank === 1;
							return (
								<div key={u.rank} className="flex flex-col items-center">
									<div
										className={`relative flex flex-col items-center justify-end rounded-t-[999px] pb-2 pt-3 ${
											isFirst
												? "h-[132px] w-[104px] bg-[#241a49]"
												: "h-[104px] w-[84px] bg-[#201a40]"
										}`}
									>
										{isFirst && (
											<Crown
												size={26}
												className="absolute -top-6 left-1/2 -translate-x-1/2 fill-amber-400 text-amber-400 drop-shadow"
											/>
										)}
										<div className="avatar">
											<div
												className={`overflow-hidden rounded-full bg-slate-200 ring-4 ring-[#150c2e] ${
													isFirst ? "h-20 w-20" : "h-16 w-16"
												}`}
											>
												<img
													src={avatarUrl(u.avatarSeed)}
													alt={u.name}
													className="h-full w-full object-cover"
												/>
											</div>
										</div>
									</div>
									<div className="badge relative z-10 -mt-3 border-2 border-[#150c2e] bg-teal-400 px-2 font-bold text-[#0e1330]">
										{u.rank}
									</div>
									<p className="mt-1 text-sm font-medium text-white">
										{u.name}
									</p>
									<p
										className={`font-bold text-white ${isFirst ? "text-xl" : "text-base"}`}
									>
										{u.points.toLocaleString()}
									</p>
								</div>
							);
						})}
					</div>
				</div>

				{/* ================= List card ================= */}
				<div className="relative rounded-t-[1.75rem] md:rounded-t-none bg-white pb-2 pt-4 md:py-6 shadow-[0_-6px_20px_rgba(0,0,0,0.15)] md:shadow-none md:col-span-3 md:flex md:flex-col md:justify-center">
					<div className="absolute right-1.5 top-4 h-16 w-1 rounded-full bg-teal-400/70 md:hidden" />
					<ul className="divide-y divide-gray-100 px-4 md:px-8">
						{listUsers.map((u) => (
							<li key={u.rank} className="flex items-center gap-3 py-3 md:py-4">
								<span className="w-4 text-sm md:text-base font-medium text-gray-400">
									{u.rank}
								</span>
								<div className="avatar">
									<div className="h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full bg-slate-100">
										<img
											src={avatarUrl(u.avatarSeed)}
											alt={u.name}
											className="h-full w-full object-cover"
										/>
									</div>
								</div>
								<div className="flex-1">
									<p className="text-sm md:text-base font-semibold text-slate-900">
										{u.name}
									</p>
									<p className="flex items-center gap-1 text-xs md:text-sm text-gray-400">
										<span className="text-[13px] md:text-sm">🪙</span>
										{u.points} pts
									</p>
								</div>
								<div
									className={`flex items-center gap-0.5 text-sm md:text-base font-semibold ${
										(u.change ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"
									}`}
								>
									<span className="text-[10px]">
										{(u.change ?? 0) >= 0 ? "▲" : "▼"}
									</span>
									{(u.change ?? 0) > 0 ? `+${u.change}` : u.change}
								</div>
							</li>
						))}
					</ul>
				</div>

				{/* ================= Coming Soon tint ================= */}
				{/* <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
          <div className="-rotate-6 rounded-full border-2 border-teal-300/80 bg-gradient-to-r from-teal-400 to-cyan-500 px-6 py-2 shadow-lg">
            <span className="text-sm font-bold uppercase tracking-wider text-[#0e1330]">
              🚀 Coming Soon
            </span>
          </div>
        </div> */}
			</div>
		</div>
	);
}
