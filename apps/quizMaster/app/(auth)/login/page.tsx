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

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center relative overflow-hidden px-4">
      {/* Decorative Blur Orbs for Rich Aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-base-200/35 backdrop-blur-xl border border-base-300/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-sm shadow-primary/5">
          <FiLock className="text-2xl text-primary" />
        </div>

        <h3 className="text-2xl font-bold text-base-content tracking-tight mb-1 text-center">
          Welcome back
        </h3>
        <p className="text-sm text-base-content/60 mb-8 text-center">
          Log in with your credentials to access QuizMaster
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Email Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <FiMail /> Email Address
              </span>
            </label>
            <input
              type="text"
              name="email"
              className={`input input-bordered w-full rounded-xl focus:input-primary bg-base-100/50 border-base-300/30 focus:border-primary/50 focus:bg-base-100/80 transition-all duration-300 ${
                fieldErrors.email ? "input-error" : ""
              }`}
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={isPending}
            />
            {fieldErrors.email && (
              <span className="label-text-alt text-error mt-1">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <FiLock /> Password
              </span>
            </label>
            <div className="relative w-full">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className={`input input-bordered w-full rounded-xl pr-12 focus:input-primary bg-base-100/50 border-base-300/30 focus:border-primary/50 focus:bg-base-100/80 transition-all duration-300 ${
                  fieldErrors.password ? "input-error" : ""
                }`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                disabled={isPending}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-4 hover:opacity-80 transition"
                onClick={toggleEyeHandler}
                disabled={isPending}
              >
                {showPassword ? (
                  <FiEyeOff className="text-primary text-lg" />
                ) : (
                  <FiEye className="text-primary text-lg" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="label-text-alt text-error mt-1">{fieldErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full rounded-xl mt-6 shadow-md hover:shadow-lg transition-all duration-300"
            disabled={isPending || !isFormValid}
          >
            {isPending ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="divider opacity-20 my-4 text-xs">OR</div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-outline w-full rounded-xl flex items-center justify-center gap-2 border-base-300/30 bg-base-100/30 hover:bg-base-100/60 hover:border-primary/50 transition-all duration-300"
            disabled={isPending}
          >
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>
        </form>

        {/* Status Alerts */}
        {success && (
          <div className="alert alert-success rounded-xl mt-4 py-2 shadow-sm text-sm">
            <span>Successfully Authenticated! Redirecting...</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error rounded-xl mt-4 py-2 shadow-sm text-sm">
            <span>{error}</span>
          </div>
        )}

        <div className="divider opacity-20 my-6 w-full"></div>

        <p className="text-sm opacity-70">
          Don't have an account?{" "}
          <Link className="link link-primary font-semibold" href="/register">
            Register
          </Link>
        </p>

        {isMaxTryReached && (
          <div className="w-full mt-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-center">
            <p className="text-xs text-warning leading-relaxed font-semibold">
              Guest limit reached. Please login to access quizzes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
