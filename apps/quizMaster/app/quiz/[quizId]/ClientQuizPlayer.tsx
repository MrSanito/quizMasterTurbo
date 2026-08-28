"use client";

import {
	CheckCircle,
	ChevronRight,
	Clock,
	ListChecks,
	Play,
	Trophy,
	XCircle,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";

export default function ClientQuizPlayer({ quiz }: { quiz: any }) {
	const router = useRouter();

	/* ---------------- AUTH ---------------- */
	const { isLogin, user, guest, incrementGuestCount } = useUser();

	/* ---------------- STATE ---------------- */
	const [started, setStarted] = useState(false);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [score, setScore] = useState(0);
	const [timeLeft, setTimeLeft] = useState(20);

	const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
		null,
	);
	const [isAnswered, setIsAnswered] = useState(false);
	const [autoNext, setAutoNext] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [answers, setAnswers] = useState<
		Record<
			string,
			{
				selectedOptionText: string | null;
				correctOptionText: string;
				timeTaken: number;
			}
		>
	>({});

	const [startTime] = useState(() => Date.now());
	const [questionStartTime, setQuestionStartTime] = useState<number | null>(
		null,
	);

	const currentQuestion = quiz.questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

	/* ---------------- NEXT QUESTION ---------------- */
	const handleNextQuestion = useCallback(() => {
		if (currentQuestionIndex < quiz.questions.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			setTimeLeft(20);
			setSelectedOptionIndex(null);
			setIsAnswered(false);
			setQuestionStartTime(Date.now());
		}
	}, [currentQuestionIndex, quiz.questions.length]);

	/* ---------------- TIME UP ---------------- */
	const handleTimeUp = useCallback(() => {
		const q = quiz.questions[currentQuestionIndex];
		const correctOption = q.options.find((o: any) => o.isCorrect)!;

		const timeSpent = questionStartTime
			? Math.floor((Date.now() - questionStartTime) / 1000)
			: 20;

		setAnswers((prev) => ({
			...prev,
			[q._id]: {
				selectedOptionText: null,
				correctOptionText: correctOption.text,
				timeTaken: timeSpent,
			},
		}));

		setIsAnswered(true);
	}, [
		quiz,
		currentQuestionIndex,
		questionStartTime,
		handleNextQuestion,
	]);

	/* ---------------- AUTO NEXT TRIGGER ---------------- */
	useEffect(() => {
		if (autoNext && isAnswered && !isLastQuestion) {
			const timer = setTimeout(() => {
				handleNextQuestion();
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [autoNext, isAnswered, isLastQuestion, handleNextQuestion]);

	/* ---------------- TIMER ---------------- */
	useEffect(() => {
		if (!started || isAnswered || isSubmitting) return;

		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					handleTimeUp();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [started, isAnswered, isSubmitting, handleTimeUp]);

	/* ---------------- OPTION SELECT ---------------- */
	const handleOptionSelect = (optionIndex: number) => {
		if (isAnswered || isSubmitting) return;

		const q = quiz.questions[currentQuestionIndex];
		const selectedOption = q.options[optionIndex];
		const correctOption = q.options.find((o: any) => o.isCorrect)!;

		const timeSpent = Math.floor(
			(Date.now() - (questionStartTime ?? Date.now())) / 1000,
		);

		setSelectedOptionIndex(optionIndex);
		setIsAnswered(true);

		setAnswers((prev) => ({
			...prev,
			[q._id]: {
				selectedOptionText: selectedOption.text,
				correctOptionText: correctOption.text,
				timeTaken: timeSpent,
			},
		}));

		setScore((prev) =>
			selectedOption.text === correctOption.text ? prev + 4 : prev - 1,
		);
	};

	/* ---------------- SUBMIT QUIZ ---------------- */
	const handleSubmitQuiz = async () => {
		try {
			setIsSubmitting(true);

			const timeTaken = Math.floor((Date.now() - startTime) / 1000);

			const questionsPayload = quiz.questions.map((q: any) => {
				const a = answers[q._id];
				const correctOption = q.options.find((o: any) => o.isCorrect)!;

				return {
					questionId: q._id,
					selectedOptionText: a?.selectedOptionText ?? null,
					correctOptionText: correctOption.text,
					isCorrect: a?.selectedOptionText === correctOption.text,
					timeTaken: a?.timeTaken ?? 20,
				};
			});

			const authPayload = isLogin ? { userId: user.id } : { guestId: guest.id };

			const res = await api.post(
				`/quizzes/${quiz._id}/submit`,
				{
					score,
					total: quiz.totalPoints,
					timeTaken,
					questions: questionsPayload,
					...authPayload,
				},
				{ withCredentials: true },
			);

			if (res.data?.success && res.data?.attemptId) {
				incrementGuestCount();
				router.replace(`/quiz/${quiz.categoryId}/result/${res.data.attemptId}`);
			} else {
				throw new Error("attemptId missing");
			}
		} catch (err) {
			console.error("Submit failed:", err);
			alert("Failed to submit quiz");
			setIsSubmitting(false);
		}
	};

	/* ---------------- START SCREEN ---------------- */
	if (!started) {
		return (
			<div className="flex items-center justify-center p-4">
				<div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl border border-gray-100 flex flex-col items-center">
					{/* Top Title & Info */}
					<div className="text-center mb-6">
						<span className="inline-block rounded-full bg-[#340C97]/10 px-3.5 py-1 text-xs font-extrabold text-[#340C97] uppercase tracking-wider mb-2">
							Ready to play?
						</span>
						<h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
							{quiz.title}
						</h1>
						<p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
							Think fast. Answer accurately. Win daily points!
						</p>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-3 gap-3 w-full mb-8">
						<div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
							<ListChecks className="w-5 h-5 text-[#7047C7] mb-1" />
							<span className="text-base font-extrabold text-gray-900">
								{quiz.questions.length}
							</span>
							<span className="text-[10px] font-semibold text-gray-500 uppercase">
								Questions
							</span>
						</div>

						<div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
							<Clock className="w-5 h-5 text-amber-500 mb-1" />
							<span className="text-base font-extrabold text-gray-900">
								20s
							</span>
							<span className="text-[10px] font-semibold text-gray-500 uppercase">
								Per Question
							</span>
						</div>

						<div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
							<Trophy className="w-5 h-5 text-emerald-600 mb-1" />
							<span className="text-base font-extrabold text-gray-900">
								+4 / -1
							</span>
							<span className="text-[10px] font-semibold text-gray-500 uppercase">
								Scoring
							</span>
						</div>
					</div>

					{/* Start CTA Button */}
					<button
						onClick={() => {
							setStarted(true);
							setQuestionStartTime(Date.now());
						}}
						className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F0DE4A] px-8 py-3.5 font-bold tracking-wide text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg"
					>
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[#F0DE4A]">
							<Play size={11} fill="currentColor" />
						</span>
						START QUIZ
					</button>
				</div>
			</div>
		);
	}

	/* ---------------- PLAYING QUIZ UI ---------------- */
	return (
		<div className="flex items-center justify-center p-2 sm:p-4">
			<div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100">
				<div className="flex flex-col gap-6">
					{/* ================= TOP HEADER ================= */}
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-gray-400">
							Question {currentQuestionIndex + 1} of {quiz.questions.length}
						</span>

						<div className="flex items-center gap-3">
							<label className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition cursor-pointer text-xs font-semibold text-gray-600">
								<Zap
									className={`w-3.5 h-3.5 ${
										autoNext ? "text-amber-500 fill-amber-500" : "text-gray-400"
									}`}
								/>
								<span>Auto Next</span>
								<input
									type="checkbox"
									checked={autoNext}
									onChange={(e) => setAutoNext(e.target.checked)}
									className="w-3.5 h-3.5 accent-[#7047C7] rounded cursor-pointer"
								/>
							</label>

							<div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#340C97]/10 text-[#340C97] text-xs font-bold">
								<Trophy className="w-3.5 h-3.5" />
								<span>{score} pts</span>
							</div>
						</div>
					</div>

					{/* ================= TIMER ================= */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs font-semibold text-gray-500">
							<span className="flex items-center gap-1">
								<Clock className="w-3.5 h-3.5 text-amber-500" />
								Time Remaining
							</span>
							<span
								className={`text-lg font-extrabold tabular-nums ${
									timeLeft <= 5
										? "text-red-500 animate-pulse"
										: "text-[#7047C7]"
								}`}
							>
								{timeLeft}s
							</span>
						</div>

						<div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
							<div
								className={`h-full transition-all duration-1000 ease-linear rounded-full ${
									timeLeft <= 5 ? "bg-red-500" : "bg-[#7047C7]"
								}`}
								style={{ width: `${(timeLeft / 20) * 100}%` }}
							/>
						</div>
					</div>

					{/* ================= QUESTION TEXT ================= */}
					<h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
						{currentQuestion.questionText}
					</h2>

					{/* ================= OPTIONS ================= */}
					<div className="space-y-3 mt-1">
						{currentQuestion.options.map((option: any, index: number) => {
							const isSelected = selectedOptionIndex === index;

							let stateClass =
								"bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300";

							if (isAnswered) {
								if (option.isCorrect) {
									stateClass =
										"bg-emerald-50 text-emerald-800 border-emerald-500 font-bold";
								} else if (isSelected) {
									stateClass =
										"bg-red-50 text-red-700 border-red-400 font-bold";
								} else {
									stateClass =
										"bg-gray-50 border-gray-100 text-gray-400 opacity-60";
								}
							}

							return (
								<button
									key={index}
									disabled={isAnswered || isSubmitting}
									onClick={() => handleOptionSelect(index)}
									className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all duration-200 ${stateClass} ${
										isSelected && !isAnswered
											? "border-[#7047C7] bg-[#7047C7]/5 text-[#340C97]"
											: ""
									}`}
								>
									<span className="flex-1 pr-3">{option.text}</span>

									{isAnswered && option.isCorrect && (
										<CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
									)}
									{isAnswered && isSelected && !option.isCorrect && (
										<XCircle className="w-5 h-5 text-red-500 shrink-0" />
									)}
								</button>
							);
						})}
					</div>

					{/* ================= ACTIONS ================= */}
					{isAnswered && (
						<div className="flex justify-end pt-2">
							{!autoNext && !isLastQuestion && (
								<button
									onClick={handleNextQuestion}
									className="flex items-center gap-2 rounded-full bg-[#7047C7] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#5B32B4]"
								>
									Next Question
									<ChevronRight className="w-4 h-4" />
								</button>
							)}

							{isLastQuestion && (
								<button
									onClick={handleSubmitQuiz}
									className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
									) : (
										<>
											Finish Quiz
											<Trophy className="w-4 h-4" />
										</>
									)}
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
