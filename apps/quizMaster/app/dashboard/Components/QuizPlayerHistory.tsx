"use client";

import {
	ArrowPathIcon,
	ArrowRightIcon,
	ClockIcon,
} from "@heroicons/react/24/solid";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import api from "@/app/lib/api";

/* ================= TYPES ================= */

type QuizHistoryItem = {
	id: string;
	score: number;
	total: number;
	timeTaken: number;
	createdAt: string;
	quiz: {
		id: string;
		title: string;
		categoryId: string;
	};
};

type QuizPlayerHistoryProps = {
	viewerId?: string;
	viewerType?: "user" | "guest";
};

/* ================= CONSTANTS ================= */

const INITIAL_VISIBLE = 6;

// PLACEHOLDER: point this to your real quiz category list route
const BROWSE_QUIZZES_HREF = "/quiz";

/* ================= HELPERS ================= */

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const toPercent = (score: number, total: number) =>
	total > 0 ? Math.round((score / total) * 100) : 0;

// 95 -> "1m 35s", 42 -> "42s"
function formatDuration(seconds: number) {
	const safe = Math.max(0, Math.round(seconds));
	const m = Math.floor(safe / 60);
	const s = safe % 60;
	return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

// "2 hours ago", "yesterday", then falls back to a plain date after a week
function formatPlayed(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";

	const diffSec = (date.getTime() - Date.now()) / 1000;
	const abs = Math.abs(diffSec);

	if (abs < 60) return "just now";
	if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
	if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
	if (abs < 7 * 86400) return rtf.format(Math.round(diffSec / 86400), "day");

	return date.toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function getTone(percent: number) {
	if (percent >= 60) {
		return { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" };
	}
	if (percent >= 40) {
		return { bar: "bg-amber-400", chip: "bg-amber-50 text-amber-700" };
	}
	return { bar: "bg-red-400", chip: "bg-red-50 text-red-600" };
}

// Prisma can send `Quiz` or `quiz` depending on the include — handle both,
// and skip broken rows instead of crashing the whole list.
function normalizeAttempt(a: any): QuizHistoryItem | null {
	const q = a?.Quiz ?? a?.quiz;
	if (!a?.id || !q?.id) return null;

	return {
		id: String(a.id),
		score: Number(a.score) || 0,
		total: Number(a.total) || 0,
		timeTaken: Number(a.timeTaken) || 0,
		createdAt: a.createdAt,
		quiz: {
			id: String(q.id),
			title: q.title || "Untitled quiz",
			categoryId: String(q.categoryId),
		},
	};
}

/* ================= SMALL PIECES ================= */

function Stat({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-xl bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
			<p className="text-lg font-bold leading-tight">{value}</p>
			<p className="text-xs text-white/70">{label}</p>
		</div>
	);
}

function SkeletonCard() {
	return (
		<div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-lg">
			<div className="h-5 w-2/3 rounded bg-gray-100" />
			<div className="mt-3 h-4 w-1/3 rounded bg-gray-100" />
			<div className="mt-3 h-3 w-1/2 rounded bg-gray-100" />
			<div className="mt-5 h-2 w-full rounded-full bg-gray-100" />
		</div>
	);
}

/* ================= COMPONENT ================= */

export default function QuizPlayerHistory({
	viewerId,
	viewerType,
}: QuizPlayerHistoryProps) {
	const reduceMotion = useReducedMotion();

	const [history, setHistory] = useState<QuizHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAll, setShowAll] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		// HARD GUARD: nothing to fetch without a viewer
		if (!viewerId || !viewerType) {
			setLoading(false);
			return;
		}

		// Cancels the request if the component unmounts or the viewer changes,
		// so a slow old response can never overwrite a newer one.
		const controller = new AbortController();

		const fetchHistory = async () => {
			setLoading(true);
			setError(null);

			try {
				// PLACEHOLDER (server pagination): when history gets long, send
				// `page` + `limit` here and replace "Show all" with "Load more".
				const res = await api.get("/quizzes/history", {
					params: { viewerId, viewerType },
					withCredentials: true,
					signal: controller.signal,
				});

				const attempts = res.data?.attempts;
				if (!Array.isArray(attempts)) {
					throw new Error("Invalid history response");
				}

				if (controller.signal.aborted) return;

				setHistory(
					attempts
						.map(normalizeAttempt)
						.filter((item): item is QuizHistoryItem => item !== null),
				);
			} catch (err) {
				if (controller.signal.aborted) return;
				console.error("Failed to load quiz history", err);
				setError("Couldn't load your quiz history. Please try again.");
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		};

		fetchHistory();

		return () => controller.abort();
	}, [viewerId, viewerType, reloadKey]);

	// Newest attempts first, regardless of what order the API returns
	const sorted = useMemo(
		() =>
			[...history].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			),
		[history],
	);

	const stats = useMemo(() => {
		if (sorted.length === 0) return null;
		const percents = sorted.map((h) => toPercent(h.score, h.total));
		return {
			attempts: sorted.length,
			average: Math.round(percents.reduce((x, y) => x + y, 0) / percents.length),
			best: Math.max(...percents),
		};
	}, [sorted]);

	const visible = showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE);

	/* ================= UI ================= */

	return (
		<section
			aria-labelledby="quiz-history-heading"
			className="max-w-7xl mx-auto mt-12"
		>
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<h2
					id="quiz-history-heading"
					className="text-xl sm:text-2xl font-bold text-white"
				>
					Your Quiz History
				</h2>

				{stats && (
					<div className="flex gap-3">
						<Stat label="Attempts" value={stats.attempts} />
						<Stat label="Average" value={`${stats.average}%`} />
						<Stat label="Best" value={`${stats.best}%`} />
					</div>
				)}
			</div>

			{/* PLACEHOLDER (toolbar): sort (newest / highest score / fastest) and
			    filter by category. Keep the state in this component and apply it
			    to `sorted` above. */}

			{/* PLACEHOLDER (guest nudge): if viewerType === "guest", show
			    "Sign up to keep your history" with a link to your register page —
			    guest attempts are lost once the guest session ends. */}

			{loading ? (
				<div
					className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
					aria-busy="true"
					aria-label="Loading your quiz history"
				>
					{Array.from({ length: 3 }).map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : error ? (
				<div
					role="alert"
					className="flex flex-col items-center gap-4 rounded-2xl bg-white/10 px-6 py-8 text-center backdrop-blur-sm"
				>
					<p className="font-medium text-red-100">{error}</p>
					<button
						type="button"
						onClick={() => setReloadKey((k) => k + 1)}
						className="inline-flex items-center gap-2 rounded-full bg-[#F0DE4A] px-5 py-2 font-bold text-black shadow-md transition hover:bg-[#e6d43f]"
					>
						<ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
						Try again
					</button>
				</div>
			) : sorted.length === 0 ? (
				<div className="flex flex-col items-center gap-4 rounded-2xl bg-white/10 px-6 py-8 text-center backdrop-blur-sm">
					<p className="text-white/80">
						You haven&apos;t played any quizzes yet.
					</p>
					<Link
						href={BROWSE_QUIZZES_HREF}
						className="inline-flex items-center gap-2 rounded-full bg-[#F0DE4A] px-5 py-2 font-bold text-black shadow-md transition hover:bg-[#e6d43f]"
					>
						Play your first quiz
					</Link>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{visible.map((item, index) => {
							const percent = toPercent(item.score, item.total);
							const tone = getTone(percent);

							return (
								<motion.div
									key={item.id}
									initial={reduceMotion ? false : { opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									// capped so item #40 doesn't wait 2 seconds to appear
									transition={{ delay: Math.min(index, 8) * 0.04 }}
								>
									<Link
										href={`/quiz/${item.quiz.categoryId}/result/${item.id}`}
										className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0DE4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B32B4]"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<h3 className="line-clamp-2 text-lg font-semibold text-gray-900">
													{item.quiz.title}
												</h3>
												<p className="mt-1 text-sm text-gray-500">
													Score: {item.score} / {item.total}
												</p>
											</div>

											<span
												className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-bold ${tone.chip}`}
											>
												{percent}%
											</span>
										</div>

										<div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
											<span className="inline-flex items-center gap-1">
												<ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
												{formatDuration(item.timeTaken)}
											</span>
											<span>{formatPlayed(item.createdAt)}</span>
										</div>

										<div className="mt-4 flex items-center gap-3">
											<div
												role="progressbar"
												aria-valuemin={0}
												aria-valuemax={100}
												aria-valuenow={percent}
												aria-label={`${item.quiz.title} score`}
												className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"
											>
												<div
													className={`h-full rounded-full ${tone.bar}`}
													style={{ width: `${percent}%` }}
												/>
											</div>
											<ArrowRightIcon
												className="h-5 w-5 text-[#7047C7] transition-transform motion-safe:group-hover:translate-x-0.5"
												aria-hidden="true"
											/>
										</div>
									</Link>

									{/* PLACEHOLDER (retake): a small "Retake" button here, outside
									    the <Link> (no nested links), pointing to
									    /quiz/${item.quiz.categoryId}/${item.quiz.id} or
									    wherever your play route lives. */}
								</motion.div>
							);
						})}
					</div>

					{sorted.length > INITIAL_VISIBLE && (
						<div className="mt-6 text-center">
							<button
								type="button"
								onClick={() => setShowAll((v) => !v)}
								className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
							>
								{showAll ? "Show less" : `Show all ${sorted.length} attempts`}
							</button>
						</div>
					)}

					{/* PLACEHOLDER (progress chart): small sparkline of percent over
					    time (last 10 attempts) above the grid — recharts or a plain
					    SVG polyline is enough. */}
				</>
			)}
		</section>
	);
}