"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiCheckCircle, FiKey, FiRefreshCw } from "react-icons/fi";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import api from "@/app/lib/api";
import {
	createDpopProof,
	getBrowserAndOS,
	getOrCreateDeviceKeyPair,
} from "@/app/lib/deviceKey";
import Loading from "@/components/Loading";

export default function OtpPage() {
	return (
		<Suspense fallback={<Loading />}>
			<OtpPageContent />
		</Suspense>
	);
}

function OtpPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState<string>("");
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	useEffect(() => {
		const storedEmail =
			localStorage.getItem("email") || searchParams.get("email") || "";
		setEmail(storedEmail);
		setIsLoaded(true);
	}, [searchParams]);

	const { loading, isLogin, refreshAuth } = useUser();

	const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [resendTimer, setResendTimer] = useState(30);
	const [isResending, setIsResending] = useState(false);

	// References to the 6 input elements
	const inputRefs = [
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
	];

	// Redirect if already logged in
	useEffect(() => {
		if (!loading && isLogin) {
			router.replace("/dashboard");
		}
	}, [loading, isLogin, router]);

	// Countdown timer for Resend OTP
	useEffect(() => {
		if (resendTimer <= 0) return;
		const interval = setInterval(() => {
			setResendTimer((prev) => prev - 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [resendTimer]);

	// Auto-focus the first input on page load
	useEffect(() => {
		if (inputRefs[0].current) {
			inputRefs[0].current.focus();
		}
	}, [inputRefs[0].current]);

	// Handle number input changes
	const handleInputChange = (value: string, index: number) => {
		// Only allow digits
		if (!/^\d*$/.test(value)) return;

		const newOtp = [...otp];
		// Keep only the last character entered
		const digit = value.substring(value.length - 1);
		newOtp[index] = digit;
		setOtp(newOtp);

		// If entered a digit, move focus to the next input
		if (digit !== "" && index < 5) {
			inputRefs[index + 1].current?.focus();
		}
	};

	// Handle backspace or arrow keys
	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number,
	) => {
		if (e.key === "Backspace") {
			if (otp[index] === "" && index > 0) {
				// Empty, move to previous box and clear it
				const newOtp = [...otp];
				newOtp[index - 1] = "";
				setOtp(newOtp);
				inputRefs[index - 1].current?.focus();
			} else {
				// Just clear current box
				const newOtp = [...otp];
				newOtp[index] = "";
				setOtp(newOtp);
			}
		} else if (e.key === "ArrowLeft" && index > 0) {
			inputRefs[index - 1].current?.focus();
		} else if (e.key === "ArrowRight" && index < 5) {
			inputRefs[index + 1].current?.focus();
		}
	};

	// Handle clipboard pasting
	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").trim();
		if (!/^\d{6}$/.test(pastedData)) return; // Ensure it's exactly 6 digits

		const digits = pastedData.split("");
		setOtp(digits);

		// Set focus to the last input box
		inputRefs[5].current?.focus();
	};

	// Handle direct verification form submit
	const handleVerify = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		const otpCode = otp.join("");
		if (otpCode.length !== 6) {
			setError("Please enter a valid 6-digit OTP");
			return;
		}

		setIsPending(true);
		setError(null);
		setSuccess(false);

		try {
			console.log(
				"Generating device keypair, DPoP signatures and fingerprint...",
			);
			// Generate or retrieve the device key pair passively
			const keypairResult = await getOrCreateDeviceKeyPair();
			const publicKeyJwk = keypairResult?.publicKeyJwk || undefined;
			const { browser, os, deviceType, deviceName } = getBrowserAndOS();

			// Formulate verification URL for DPoP verification
			const verifyUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verifyLoginOTP`;
			const dpopProof = await createDpopProof(verifyUrl, "POST");

			// Map deviceType to lowercase to match Zod schema enum ("mobile" | "desktop" | "tablet" | "unknown")
			const mappedDeviceType = deviceType
				? (deviceType.toLowerCase() as
						| "mobile"
						| "desktop"
						| "tablet"
						| "unknown")
				: undefined;

			console.log(
				email,
				otp,
				publicKeyJwk,
				browser,
				os,
				deviceType,
				deviceName,
			);
			console.log("Submitting OTP verification to auth...");

			const res = await api.post(
				"/auth/verifyLoginOTP",
				{
					email,
					otp: otpCode,
					publicKeyJwk,
					browser: browser || undefined,
					os: os || undefined,
					deviceType: mappedDeviceType,
					deviceName: deviceName || undefined,
				},
				{
					headers: {
						DPoP: dpopProof,
					},
				},
			);

			console.log("OTP Verification Response:", res.data);

			if (res.data?.success) {
				setSuccess(true);
				if (refreshAuth) {
					await refreshAuth();
				}
				router.refresh();
				router.replace("/dashboard");
			} else {
				setError(res.data?.message || "Verification failed");
			}
		} catch (err: any) {
			console.error("OTP verification error:", err);
			const msg =
				err.response?.data?.message ||
				"Invalid OTP code or connection refused.";
			setError(msg);
		} finally {
			setIsPending(false);
		}
	};

	// Auto-submit once all 6 digits are entered
	useEffect(() => {
		if (otp.every((digit) => digit !== "")) {
			handleVerify();
		}
	}, [otp, handleVerify]);

	// Handle OTP resend
	const handleResend = async () => {
		setIsResending(true);
		setError(null);
		try {
			setError(
				"To get a new OTP, please go back and enter your password again for security.",
			);
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to resend OTP.");
		} finally {
			setIsResending(false);
		}
	};

	if (isLogin) return null;

	if (loading || !isLoaded) {
		return <Loading />;
	}

	return (
		<div className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] px-4 py-10">
			{/* Ambient glow, echoes the hero's palette */}
			<div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-[#F0DE4A]/10 rounded-full blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-[#B9EEDC]/10 rounded-full blur-3xl" />

			{/* Bottom-left wave cutout, matching the hero section */}
			<svg
				className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-2/3 text-white/[0.04] md:h-56"
				viewBox="0 0 500 200"
				preserveAspectRatio="none"
				fill="currentColor"
			>
				<path d="M0,200 L0,60 C140,140 300,200 500,200 Z" />
			</svg>

			{!email ? (
				<div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-8 shadow-2xl">
					<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
						<FiArrowLeft className="text-2xl text-amber-500" />
					</div>

					<h3 className="mb-1 text-center text-2xl font-extrabold tracking-tight text-gray-900">
						No Email Found
					</h3>
					<p className="mb-8 px-2 text-center text-sm text-gray-500">
						Please return to the login page to verify your credentials.
					</p>
					<Link
						href="/login"
						className="flex w-full items-center justify-center rounded-full bg-[#F0DE4A] px-6 py-3 font-bold tracking-wide text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg"
					>
						Back to Login
					</Link>
				</div>
			) : (
				<div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-8 shadow-2xl">
					{/* Brand mark, matches the hero logo */}
					<div className="mb-4 flex items-center gap-2">
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
						<span className="text-lg font-bold tracking-tight text-[#340C97]">
							LOGO
						</span>
					</div>

					<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7047C7]/20 bg-[#7047C7]/10 shadow-sm">
						<FiKey className="text-2xl text-[#7047C7]" />
					</div>

					<h3 className="mb-1 text-center text-2xl font-extrabold tracking-tight text-gray-900">
						Verify OTP
					</h3>
					<p className="mb-8 px-2 text-center text-sm text-gray-500">
						We've sent a 6-digit verification code to{" "}
						<span className="font-semibold text-[#7047C7]">{email}</span>
					</p>

					<form onSubmit={handleVerify} className="w-full space-y-6">
						{/* 6 Digit Inputs */}
						<div
							className="mx-auto flex max-w-sm justify-between gap-2"
							onPaste={handlePaste}
						>
							{otp.map((digit, index) => (
								<input
									key={index}
									ref={inputRefs[index]}
									type="text"
									maxLength={1}
									value={digit}
									onChange={(e) => handleInputChange(e.target.value, index)}
									onKeyDown={(e) => handleKeyDown(e, index)}
									disabled={isPending}
									className="h-14 w-12 rounded-2xl border-2 border-gray-200 bg-white text-center text-2xl font-bold text-gray-800 outline-none transition-all duration-300 focus:border-[#7047C7] focus:ring-4 focus:ring-[#7047C7]/10"
								/>
							))}
						</div>

						{/* Submit Button, styled after the hero's PLAY TODAY button */}
						<button
							type="submit"
							className="mt-6 flex w-full items-center justify-center rounded-full bg-[#F0DE4A] px-6 py-3 font-bold tracking-wide text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
							disabled={isPending || otp.some((digit) => digit === "")}
						>
							{isPending ? (
								<span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
							) : (
								"VERIFY & PROCEED"
							)}
						</button>
					</form>

					{/* Resend Section */}
					<div className="mt-6 flex w-full items-center justify-between text-sm">
						{resendTimer > 0 ? (
							<span className="flex items-center gap-1.5 text-gray-400">
								<FiRefreshCw className="animate-spin text-xs" /> Resend OTP in{" "}
								{resendTimer}s
							</span>
						) : (
							<button
								onClick={handleResend}
								disabled={isResending}
								className="flex items-center gap-1 font-semibold text-[#7047C7] transition hover:text-[#5B32B4]"
							>
								<FiRefreshCw /> Resend OTP
							</button>
						)}

						<Link
							href="/login"
							className="flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-600"
						>
							<FiArrowLeft /> Back to Login
						</Link>
					</div>

					{/* Status Alerts */}
					{success && (
						<div className="mt-6 flex w-full items-center gap-2 rounded-xl border border-emerald-100 bg-[#B9EEDC]/40 px-4 py-2.5 text-sm text-emerald-700 shadow-sm">
							<FiCheckCircle className="animate-bounce text-lg" />
							<span>Success! Logging you in...</span>
						</div>
					)}
					{error && (
						<div className="mt-6 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600 shadow-sm">
							{error}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
