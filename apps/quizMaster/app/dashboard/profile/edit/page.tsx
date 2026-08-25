"use client";
import {
	Avatar,
	Box,
	Card,
	CardContent,
	IconButton,
	Stack,
	Typography,
} from "@mui/material";
// Removed actions.ts import
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import MaxTryReached from "@/app/(auth)/components/MaxTryReached";
import NotLoginComponent from "@/app/(auth)/components/NotLoginComponent";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import { useDebounce } from "@/app/features/hook/useDebouncer";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";

const avatars = Array.from({ length: 10 }, (_, i) => `avatar${i + 1}.svg`);

const ProfileEditPage = () => {
	const router = useRouter();

	const {
		user,
		guest,
		loading,
		isLogin,
		isGuest,
		isMaxTryReached,
		guestLeft,
		refreshAuth,
	} = useUser();

	const viewerId =
		!loading && isLogin
			? user?.id
			: !loading && isGuest
				? guest?.id
				: undefined;

	const viewerType = isLogin ? "user" : "guest";

	console.log(viewerId, viewerType);
	console.log("user data", user);

	const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
	const [form, setForm] = useState({
		id: "",
		username: "",
		firstName: "",
		lastName: "",
		email: "",
	});
	const [usernameStatus, setUsernameStatus] = useState(null);
	const debouncedUsername = useDebounce(form.username, 2000);
	const skipFirstUsernameCheck = React.useRef(true);

	const [success, setSuccess] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		setSuccess(false);
		setErrorMsg("");
		setFieldErrors({});

		const errors: Record<string, string> = {};
		if (!form.username) errors.username = "Username is required";
		if (!form.firstName) errors.firstName = "First name is required";
		if (!form.lastName) errors.lastName = "Last name is required";
		if (!form.email) {
			errors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(form.email)) {
			errors.email = "Invalid email address";
		}

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			setIsSaving(false);
			return;
		}

		try {
			const res = await api.post("/auth/edit", {
				id: form.id,
				username: form.username,
				firstName: form.firstName,
				lastName: form.lastName,
				email: form.email,
				avatar: selectedAvatar,
			});

			if (res.data?.success) {
				setSuccess(true);
				if (refreshAuth) {
					await refreshAuth();
				}
				setTimeout(() => {
					router.push("/dashboard");
				}, 1500);
			} else {
				setErrorMsg(res.data?.message || "Failed to update profile");
			}
		} catch (err: any) {
			setErrorMsg(err.response?.data?.message || "Something went wrong.");
		} finally {
			setIsSaving(false);
		}
	};

	//  Fill form when user loads
	useEffect(() => {
		if (user) {
			skipFirstUsernameCheck.current = true; // mark this update as system update

			setForm({
				id: user.id || "",
				username: user.username || "",
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				email: user.email || "",
			});
			setSelectedAvatar(user.avatar || avatars[0]);
			console.log("selected avatar ---------------------", selectedAvatar);
		}
	}, [user, selectedAvatar]);
	const handleUsername = (e) => {
		let { name, value } = e.target;
		// 1 convert to lowercase
		value = value.toLowerCase();

		// 2 remove unwanted characters
		value = value.replace(/[^a-z0-9_]/g, "");

		setForm((prev) => ({ ...prev, [name]: value }));
		console.log(form);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	// Handled in handleSubmit

	useEffect(() => {
		if (!debouncedUsername) {
			setUsernameStatus(null);
			return;
		}
		if (skipFirstUsernameCheck.current) {
			skipFirstUsernameCheck.current = false;
			return;
		}

		const runCheck = async () => {
			setUsernameStatus("checking");
			try {
				const res = await api.post("/auth/check_username", {
					username: debouncedUsername,
				});
				setUsernameStatus(res.data?.available ? "available" : "taken");
			} catch {
				setUsernameStatus("idle");
			}
		};

		runCheck();
	}, [debouncedUsername]);

	// 1 Loading (highest priority)
	if (loading) {
		return <Loading />;
	}

	// 2 Blocked guest
	if (isMaxTryReached) {
		return <MaxTryReached />;
	}

	// 3 Not logged in at all
	if (!isLogin && !isGuest) {
		return <NotLoginComponent />;
	}

	// console.log(user.name)

	const inputBase =
		"w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all duration-300 focus:ring-4";

	return (
		<Box
			sx={{
				position: "relative",
				minHeight: "100vh",
				overflow: "hidden",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				background: "linear-gradient(to right, #340C97, #5B32B4, #7047C7)",
				p: 2,
			}}
		>
			{/* Ambient glow, echoes the hero's palette */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

			<Stack
				spacing={3}
				sx={{ width: "100%", maxWidth: 620, position: "relative", zIndex: 10 }}
			>
				<Card
					sx={{
						width: "100%",
						borderRadius: 6,
						bgcolor: "#fff",
						color: "#111827",
						boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
					}}
				>
					<CardContent sx={{ p: 4 }}>
						{/* Brand mark, matches the hero logo */}
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							sx={{ mb: 1.5 }}
						>
							<svg width="22" height="24" viewBox="0 0 24 24" fill="none">
								<path
									d="M12 2 L21 7 L12 12 L3 7 Z"
									fill="#7047C7"
									opacity="0.95"
								/>
								<path
									d="M3 7 L12 12 L12 22 L3 17 Z"
									fill="#7047C7"
									opacity="0.6"
								/>
								<path
									d="M21 7 L12 12 L12 22 L21 17 Z"
									fill="#7047C7"
									opacity="0.8"
								/>
							</svg>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 700, color: "#340C97", letterSpacing: 0.5 }}
							>
								LOGO
							</Typography>
						</Stack>

						<Typography
							variant="h5"
							fontWeight="bold"
							gutterBottom
							sx={{ color: "#111827" }}
						>
							Edit Profile
						</Typography>

						<form onSubmit={handleSubmit} suppressHydrationWarning>
							{/* Avatar Preview */}
							<Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
								<Avatar
									src={`/avatars/${selectedAvatar}`}
									sx={{
										width: 95,
										height: 95,
										border: "4px solid #ffffff",
										boxShadow:
											"0 0 0 3px rgba(112,71,199,0.35), 0 4px 14px rgba(0,0,0,0.12)",
									}}
								/>
								<Typography variant="body2" sx={{ color: "#6b7280" }}>
									Choose your avatar
								</Typography>
							</Stack>
							<Grid
								container
								spacing={1.5}
								justifyContent="center"
								sx={{ mb: 3 }}
							>
								{avatars.map((avatar) => (
									<Grid key={avatar} size={3}>
										<IconButton
											onClick={() => setSelectedAvatar(avatar)}
											sx={{
												border:
													selectedAvatar === avatar
														? "2px solid #7047C7"
														: "2px solid transparent",
												borderRadius: "50%",
												p: 0.5,
											}}
										>
											<Avatar
												src={`/avatars/${avatar}`}
												sx={{ width: 50, height: 50 }}
											/>
										</IconButton>
									</Grid>
								))}
							</Grid>

							{/* Form Fields */}
							<div className="flex flex-col gap-4">
								{/* Username */}
								<div>
									<label className="mb-1.5 block text-xs font-semibold text-gray-600">
										Username
									</label>
									<input
										type="text"
										name="username"
										className={`${inputBase} ${
											fieldErrors.username
												? "border-red-300 focus:border-red-400 focus:ring-red-100"
												: "border-gray-200 focus:border-[#7047C7] focus:ring-[#7047C7]/10"
										}`}
										placeholder="username"
										value={form.username}
										onChange={handleUsername}
									/>
									{fieldErrors.username && (
										<p className="text-red-500 text-sm mt-1">
											{fieldErrors.username}
										</p>
									)}
									{usernameStatus === "checking" && (
										<p className="text-amber-500 text-sm mt-1">
											Checking username...
										</p>
									)}
									{usernameStatus === "available" && (
										<p className="text-emerald-600 text-sm mt-1">{`${form.username} Username available `}</p>
									)}
									{usernameStatus === "taken" && (
										<p className="text-red-500 text-sm mt-1">{`${form.username} Username already taken `}</p>
									)}
								</div>

								{/* First Name & Last Name */}
								<div className="flex flex-col md:flex-row gap-4 w-full">
									<div className="flex-1">
										<label className="mb-1.5 block text-xs font-semibold text-gray-600">
											First Name
										</label>
										<input
											type="text"
											name="firstName"
											className={`${inputBase} ${
												fieldErrors.firstName
													? "border-red-300 focus:border-red-400 focus:ring-red-100"
													: "border-gray-200 focus:border-[#7047C7] focus:ring-[#7047C7]/10"
											}`}
											placeholder="Joe"
											value={form.firstName}
											onChange={handleChange}
										/>
										{fieldErrors.firstName && (
											<p className="text-red-500 text-sm mt-1">
												{fieldErrors.firstName}
											</p>
										)}
									</div>

									<div className="flex-1">
										<label className="mb-1.5 block text-xs font-semibold text-gray-600">
											Last Name
										</label>
										<input
											type="text"
											name="lastName"
											className={`${inputBase} ${
												fieldErrors.lastName
													? "border-red-300 focus:border-red-400 focus:ring-red-100"
													: "border-gray-200 focus:border-[#7047C7] focus:ring-[#7047C7]/10"
											}`}
											placeholder="Doe"
											value={form.lastName}
											onChange={handleChange}
										/>
										{fieldErrors.lastName && (
											<p className="text-red-500 text-sm mt-1">
												{fieldErrors.lastName}
											</p>
										)}
									</div>
								</div>

								{/* Email */}
								<div>
									<label className="mb-1.5 block text-xs font-semibold text-gray-600">
										Email
									</label>
									<input
										type="text"
										name="email"
										className={`${inputBase} ${
											fieldErrors.email
												? "border-red-300 focus:border-red-400 focus:ring-red-100"
												: "border-gray-200 focus:border-[#7047C7] focus:ring-[#7047C7]/10"
										}`}
										placeholder="email"
										value={form.email}
										onChange={handleChange}
									/>
									{fieldErrors.email && (
										<p className="text-red-500 text-sm mt-1">
											{fieldErrors.email}
										</p>
									)}
								</div>
							</div>

							<input type="hidden" name="avatar" value={selectedAvatar} />
							<input type="hidden" name="id" value={form.id} />

							{/* Save Button, styled after the hero's PLAY TODAY button */}
							<div className="pt-6">
								<button
									type="submit"
									className="flex w-full items-center justify-center rounded-full bg-[#F0DE4A] px-6 py-3 font-bold tracking-wide text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
									disabled={
										isSaving ||
										usernameStatus === "checking" ||
										usernameStatus === "taken"
									}
								>
									{isSaving ? (
										<span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
									) : (
										"SAVE CHANGES"
									)}
								</button>
							</div>

							{/* SUCCESS / ERROR Messages */}
							{success && (
								<div className="mt-4 w-full rounded-xl border border-emerald-100 bg-[#B9EEDC]/40 px-4 py-2.5 text-center text-sm text-emerald-700 shadow-sm">
									Changes saved successfully!
								</div>
							)}
							{errorMsg && (
								<div className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600 shadow-sm">
									{errorMsg}
								</div>
							)}
						</form>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
};

export default ProfileEditPage;
