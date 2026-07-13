"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import { FiKey, FiArrowLeft, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";
import Link from "next/link";
import { getOrCreateDeviceKeyPair, createDpopProof, getBrowserAndOS } from "@/app/lib/deviceKey";

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

  useEffect(() => {
    const storedEmail = localStorage.getItem("email") || searchParams.get("email") || "";
    setEmail(storedEmail);
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
  }, []);

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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
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
      console.log("Generating device keypair, DPoP signatures and fingerprint...");
      // Generate or retrieve the device key pair passively
      const keypairResult = await getOrCreateDeviceKeyPair();
      const publicKeyJwk = keypairResult?.publicKeyJwk || undefined;
      const { browser, os, deviceType, deviceName } = getBrowserAndOS();

      // Formulate verification URL for DPoP verification
      const verifyUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verifyLoginOTP`;
      const dpopProof = await createDpopProof(verifyUrl, "POST");

      // Map deviceType to lowercase to match Zod schema enum ("mobile" | "desktop" | "tablet" | "unknown")
      const mappedDeviceType = deviceType ? (deviceType.toLowerCase() as "mobile" | "desktop" | "tablet" | "unknown") : undefined;

      console.log(email, otp , publicKeyJwk, browser , os , deviceType, deviceName)
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
            "DPoP": dpopProof,
          },
        }
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
      const msg = err.response?.data?.message || "Invalid OTP code or connection refused.";
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
  }, [otp]);

  // Handle OTP resend
  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    try {
      setError("To get a new OTP, please go back and enter your password again for security.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  if (isLogin) return null;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col min-h-[85vh] justify-center items-center px-4 relative overflow-hidden">
      {/* Decorative Blur Orbs for Rich Aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-base-200/80 backdrop-blur-md border border-base-300 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
          <FiKey className="text-3xl text-white animate-bounce" />
        </div>

        <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary pb-2">
          Verify OTP
        </h3>
        <p className="text-sm opacity-60 mb-8 text-center px-2">
          We've sent a 6-digit verification code to <span className="font-semibold text-primary">{email || "your email"}</span>
        </p>

        <form onSubmit={handleVerify} className="w-full space-y-6">
          {/* 6 Digit Inputs */}
          <div className="flex justify-between gap-2 max-w-sm mx-auto" onPaste={handlePaste}>
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
                className="w-12 h-14 text-center text-2xl font-bold bg-base-300 border-2 border-base-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full rounded-xl mt-6 shadow-md hover:shadow-lg transition-all duration-300"
            disabled={isPending || otp.some((digit) => digit === "")}
          >
            {isPending ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              "Verify & Proceed"
            )}
          </button>
        </form>

        {/* Resend Section */}
        <div className="flex items-center justify-between w-full mt-6 text-sm">
          {resendTimer > 0 ? (
            <span className="opacity-60 flex items-center gap-1.5">
              <FiRefreshCw className="animate-spin text-xs" /> Resend OTP in {resendTimer}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="link link-primary font-semibold flex items-center gap-1 hover:opacity-80 transition"
            >
              <FiRefreshCw /> Resend OTP
            </button>
          )}

          <Link href="/login" className="link opacity-60 hover:opacity-100 flex items-center gap-1 text-xs transition">
            <FiArrowLeft /> Back to Login
          </Link>
        </div>

        {/* Status Alerts */}
        {success && (
          <div className="alert alert-success rounded-xl mt-6 py-2 shadow-sm text-sm flex items-center gap-2">
            <FiCheckCircle className="text-lg animate-bounce" />
            <span>Success! Logging you in...</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error rounded-xl mt-6 py-2 shadow-sm text-sm">
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
