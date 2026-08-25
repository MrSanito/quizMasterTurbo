"use client";

import { use, useEffect, useState } from "react";
import Loading from "@/components/Loading";
import MaxTryReached from "../../(auth)/components/MaxTryReached";
import NotLoginComponent from "../../(auth)/components/NotLoginComponent";
import { useUser } from "../../(auth)/context/GetUserContext";
import ClientQuizPlayer from "./ClientQuizPlayer";
import QuizNotFound from "./components/QuizNotFound";

export default function QuizPage({
	params,
}: {
	params: Promise<{ quizId: string }>;
}) {
	const { quizId } = use(params);
	const { loading, isLogin, isGuest, isMaxTryReached } = useUser();
	const [quiz, setQuiz] = useState(null);
	const [pageLoading, setPageLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Don't fetch if auth blocks the page
		if (loading || isMaxTryReached || (!isLogin && !isGuest) || !quizId) return;

		const fetchQuiz = async () => {
			try {
				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/${quizId}`,
					{ cache: "no-store" },
				);

				if (!res.ok) {
					setError("Server Error");
					return;
				}

				const data = await res.json();

				if (!data.success || !data.formattedQuiz) {
					setError("Quiz Not Found");
					return;
				}

				setQuiz(data.formattedQuiz);
			} catch (err) {
				console.error("Error loading quiz:", err);
				setError("Something went wrong");
			} finally {
				setPageLoading(false);
			}
		};

		fetchQuiz();
	}, [quizId, loading, isLogin, isGuest, isMaxTryReached]);

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

	/* ---------------- ERROR STATES ---------------- */
	if (error) {
		if (error === "Server Error") {
			return (
				<QuizNotFound
					title="Server Connection Issue"
					message="Our servers are taking a moment. Please refresh the page to try again."
				/>
			);
		}
		if (error === "Quiz Not Found") {
			return (
				<QuizNotFound
					title="Quiz Not Found"
					message="We couldn't locate this quiz. It may have been updated or moved."
				/>
			);
		}
		return (
			<div className="relative min-h-screen flex justify-center items-center bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4">
				<p className="text-red-300 font-semibold bg-white/10 px-6 py-3 rounded-full border border-white/20">
					{error}
				</p>
			</div>
		);
	}

	/* ---------------- SHOW QUIZ ---------------- */
	if (quiz) {
		return (
			<div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4 py-8 flex items-center justify-center">
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

				<div className="relative z-10 w-full">
					<ClientQuizPlayer quiz={quiz} />
				</div>
			</div>
		);
	}

	return null;
}
