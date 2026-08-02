"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";
import Link from "next/link";
import { GetDeviceDetails } from "../components/deviceKey";

const LoginPage = () => {
  const router = useRouter();
  const { loading, isLogin, isMaxTryReached, refreshAuth } = useUser();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fingerprintData = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenRes: `${screen.width}x${screen.height}`,
      hardwareConcurrency: navigator.hardwareConcurrency,
    };
    console.log(GetDeviceDetails())
    console.log(fingerprintData)
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (!loading && isLogin) {
      router.replace("/dashboard");
    }
  }, [loading, isLogin, router]);

  const toggleEyeHandler = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!form.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsPending(false);
      return;
    }

    try {
      console.log("Submitting login to auth...");
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      console.log("Login Response:", res.data);

      if (res.data?.success) {
        localStorage.setItem("email",form.email)
        setSuccess(true);
        // Redirect to OTP verification page
        router.push(`/login/otp`);
      } else {
        setError(res.data?.message || "Login failed");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err.response?.data?.message || "Connection refused. Please verify backend is running.";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google login button clicked");
  };

  if (isLogin) return null;

  if (loading) {
    return <Loading />;
  }

  const inputBase =
    "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all duration-300 focus:ring-4";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] flex items-center justify-center px-4 py-10">
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

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl flex flex-col items-center">
        {/* Brand mark, matches the hero logo */}
        <div className="flex items-center gap-2 mb-5">
          <svg width="22" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 L21 7 L12 12 L3 7 Z" fill="#7047C7" opacity="0.95" />
            <path d="M3 7 L12 12 L12 22 L3 17 Z" fill="#7047C7" opacity="0.6" />
            <path d="M21 7 L12 12 L12 22 L21 17 Z" fill="#7047C7" opacity="0.8" />
          </svg>
          <span className="text-lg font-bold text-[#340C97] tracking-tight">LOGO</span>
        </div>

        <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1 text-center">
          Welcome back
        </h3>
        <p className="text-sm text-gray-500 mb-8 text-center">
          Log in with your credentials to access QuizMaster
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Email Input */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-600">
              <FiMail /> Email Address
            </label>
            <input
              type="text"
              name="email"
              className={`${inputBase} ${
                fieldErrors.email
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-[#7047C7] focus:ring-[#7047C7]/10"
              }`}
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={isPending}
            />
            {fieldErrors.email && (
              <span className="mt-1 block text-xs text-red-500">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-600">
              <FiLock /> Password
            </label>
            <div className="relative w-full">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className={`${inputBase} pr-12 ${
                  fieldErrors.password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-[#7047C7] focus:ring-[#7047C7]/10"
                }`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                disabled={isPending}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-4 text-[#7047C7] hover:opacity-70 transition"
                onClick={toggleEyeHandler}
                disabled={isPending}
              >
                {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="mt-1 block text-xs text-red-500">{fieldErrors.password}</span>
            )}
          </div>

          {/* Submit Button, styled after the hero's PLAY TODAY button */}
          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#F0DE4A] px-6 py-3 font-bold tracking-wide text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending || !isFormValid}
          >
            {isPending ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              "SIGN IN"
            )}
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-100" />
            OR
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:border-[#7047C7]/40 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
          >
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>
        </form>

        {/* Status Alerts */}
        {success && (
          <div className="mt-4 w-full rounded-xl border border-emerald-100 bg-[#B9EEDC]/40 px-4 py-2.5 text-sm text-emerald-700 shadow-sm">
            Successfully Authenticated! Redirecting...
          </div>
        )}
        {error && (
          <div className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        )}

        <div className="my-6 h-px w-full bg-gray-100" />

        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-[#7047C7] hover:text-[#5B32B4]" href="/register">
            Register
          </Link>
        </p>

        {isMaxTryReached && (
          <div className="mt-6 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold leading-relaxed text-amber-700">
              Guest limit reached. Please login to access quizzes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;