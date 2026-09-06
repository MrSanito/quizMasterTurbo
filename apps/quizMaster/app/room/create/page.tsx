"use client";

import { Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";

const LoginRequired = () => (
	<div className="relative min-h-[85vh] overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-6 py-16 flex flex-col items-center justify-center text-center">
		<div className="relative z-10 w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl flex flex-col items-center gap-4 text-white">
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl mb-2">
				🔒
			</div>
			<h2 className="text-2xl font-extrabold">Login Required</h2>
			<p className="text-sm text-slate-200">
				You need an authenticated account to create and host multiplayer rooms.
			</p>
			<a
				href="/login"
				className="mt-2 w-full py-3.5 px-6 rounded-2xl bg-[#F0DE4A] text-black font-extrabold hover:bg-[#e6d43f] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg text-center"
			>
				Login to Create Room
			</a>
		</div>
	</div>
);

const generateRoomName = () => {
	return `QM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

const CreatePage = () => {
	const { user, isGuest, isLogin, loading, isMaxTryReached } = useUser();

	const [roomName, setRoomName] = useState("");
	const [step, setStep] = useState<"form" | "loading" | "share" | "failed">(
		"form",
	);
	const [_userId, _setuserId] = useState("");
	const [categories, setCategories] = useState([]);
	const [quiz, setQuiz] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState("");
	const [selectedQuiz, setSelectedQuiz] = useState("");
	const handleChangeCategory = (event: { target: { value: string } }) => {
		const value = event.target.value;
		setSelectedCategory(value);
		setSelectedQuiz(""); // reset quiz
	};
	const handleChangeQuiz = (event: { target: { value: string } }) => {
		const value = event.target.value;
		setSelectedQuiz(value);
	};

	useEffect(() => {
		setRoomName(generateRoomName());
	}, []);

	const handleCreateRoom = async () => {
		if (!user?.id) {
			toast.error("You must be logged in to create a room. Please log in.");
			return;
		}
		try {
			setStep("loading");

			const res = await api.post("/room/create", {
				hostId: user.id,
				roomName,
				quizId: selectedQuiz,
			});

			if (!res.data.success) {
				setStep("failed");
				return;
			}

			// setRoomId(res.data.id); // use DB room id, not random one
			setStep("share");
			toast.success("Room created successfully ");
		} catch (err) {
			console.error(err);
			setStep("failed");
			toast.error("Failed to create room");
		}

		// setTimeout(() => {

		//   setStep("share");
		//   toast.success("Room created successfully ");
		// }, 2000);
	};

	useEffect(() => {
		if (loading || isMaxTryReached || (!isLogin && !isGuest)) return;

		const fetchCategories = async () => {
			try {
				const res = await api.get(`/categories`);
				setCategories(res.data.categories ?? res.data);
			} catch (err) {
				console.error("Failed to fetch categories", err);
			}
		};

		fetchCategories();
	}, [loading, isLogin, isGuest, isMaxTryReached]);

	useEffect(() => {
		if (!selectedCategory) {
			setQuiz([]); // clear quizzes
			setSelectedQuiz(""); // reset quiz selection
			return;
		}

		const fetchQuizzes = async () => {
			try {
				const res = await api.get(`/categories/${selectedCategory}/quizzes`);
				setQuiz(res.data.quizzes || []);
			} catch (err) {
				console.error("Failed to fetch quizzes", err);
			}
		};

		fetchQuizzes();
	}, [selectedCategory]);

	const handleCopyLink = async () => {
		const link = `${window.location.origin}/room/${roomName}/lobby/`;

		try {
			await navigator.clipboard.writeText(link);
			toast.success("Invite link copied ");
		} catch (_err) {
			// Fallback for focus / permission issues
			const textarea = document.createElement("textarea");
			textarea.value = link;
			textarea.style.position = "fixed"; // avoid scroll jump
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();

			try {
				document.execCommand("copy");
				toast.success("Invite link copied ");
			} catch {
				toast.error("Failed to copy link ");
			}

			document.body.removeChild(textarea);
		}
	};

	if (loading) return <Loading />;
	const isBlocked = !loading && (!isLogin || isGuest || !user?.id);
	if (isBlocked) return <LoginRequired />;

	return (
		<div className="min-h-[80dvh] flex flex-col justify-center items-center gap-6">
			{step === "form" && (
				<>
					<h3 className="text-lg font-bold">Create Room</h3>

					<fieldset className="fieldset " hidden>
						<legend className="fieldset-legend text-xl">Username</legend>
						<input
							className="input input-primary w-64"
							value={user?.username || ""}
							disabled
						/>
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend text-xl">Room Name</legend>
						<input
							className="input input-primary w-64"
							placeholder="Quiz Night "
							value={roomName}
							disabled
						/>
					</fieldset>

					<div className="flex flex-col gap-1 w-64">
						<label className="fieldset-legend text-xl">Category</label>
						<select
							className="select select-primary w-64"
							value={selectedCategory}
							onChange={handleChangeCategory}
						>
							<option value="">Select Category</option>
							{categories.map((element) => (
								<option key={element._id} value={String(element._id)}>
									{element.name}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1 w-64">
						<label className="fieldset-legend text-xl">Quiz</label>
						<select
							className="select select-primary w-64"
							value={selectedQuiz}
							onChange={handleChangeQuiz}
							disabled={!selectedCategory}
						>
							<option value="">Select Quiz</option>
							{quiz.map((element) => (
								<option key={element._id} value={String(element._id)}>
									{element.title}
								</option>
							))}
						</select>
					</div>

					<button
						className="btn btn-primary w-64"
						onClick={handleCreateRoom}
						disabled={!roomName || !selectedCategory || !selectedQuiz}
					>
						Create Room
					</button>
				</>
			)}

			{step === "loading" && (
				<div className="flex flex-col items-center gap-4 min-h-[80dvh]">
					<Loading />{" "}
					<p className="text-sm opacity-70">Creating your room...</p>
				</div>
			)}

			{step === "failed" && <div>fail ho gaya re bitua</div>}

			{step === "share" && (
				<div className="flex flex-col items-center gap-4">
					<h3 className="text-lg font-bold">Room Ready </h3>

					<QRCodeCanvas
						value={`${window.location.origin}/room/${roomName}/lobby`}
						size={180}
					/>

					<p className="font-mono text-sm">{roomName}</p>

					<button
						className="btn btn-outline flex gap-2"
						onClick={handleCopyLink}
					>
						<Share2 size={16} /> Copy Invite Link
					</button>

					<a href={`/room/${roomName}/lobby`} className="btn btn-primary w-64">
						Go to Lobby
					</a>
				</div>
			)}
		</div>
	);
};

export default CreatePage;
