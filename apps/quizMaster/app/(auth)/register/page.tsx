"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { loading, isLogin } = useUser();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Live username state
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");

  // Redirect if logged in
  useEffect(() => {
    if (!loading && isLogin) {
      router.replace("/dashboard");
    }
  }, [loading, isLogin, router]);

  // Debounced username check
  useEffect(() => {
    if (!form.username) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await api.post("/auth/check_username", {
          username: form.username,
        });
        if (res.data?.available) {
          setUsernameStatus("available");
          setUsernameMessage(`${form.username} is available!`);
        } else {
          setUsernameStatus("taken");
          setUsernameMessage("Username is already taken");
        }
      } catch (err) {
        setUsernameStatus("idle");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [form.username]);

  const toggleEyeHandler = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase();
    // Allow only lowercase, numbers, and underscores
    value = value.replace(/[^a-z0-9_]/g, "");
    setForm((prev) => ({ ...prev, username: value }));
  };

  const isFormValid =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.username.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 8 &&
    usernameStatus === "available";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!form.firstName) errors.firstName = "First name is required";
    if (!form.lastName) errors.lastName = "Last name is required";
    if (!form.username) {
      errors.username = "Username is required";
    } else if (form.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
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

    if (usernameStatus === "taken") {
      errors.username = "This username is already taken";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsPending(false);
      return;
    }

    try {
      console.log("Submitting register to auth...");
      const res = await api.post("/auth/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        password: form.password,
      });

      console.log("Register Response:", res.data);

      if (res.data?.success) {
        setSuccess(true);
        setForm({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          password: "",
        });
      } else {
        setError(res.data?.message || "Registration failed");
      }
    } catch (err: any) {
      console.error("Register2 error:", err);
      const msg = err.response?.data?.message || "Connection refused. Please verify backend is running.";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  if (isLogin) return null;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Decorative Blur Orbs for Rich Aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-base-200/35 backdrop-blur-xl border border-base-300/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-sm shadow-primary/5">
          <FiUser className="text-2xl text-primary" />
        </div>

        <h3 className="text-2xl font-bold text-base-content tracking-tight mb-1 text-center">
          Create Account
        </h3>
        <p className="text-sm text-base-content/60 mb-6 text-center">
          Sign up to get started with QuizMaster
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Name fields */}
          <div className="flex gap-4">
            <div className="form-control flex-1">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs">First Name</span>
              </label>
              <input
                type="text"
                name="firstName"
                className={`input input-bordered w-full rounded-xl focus:input-primary bg-base-100/50 border-base-300/30 focus:border-primary/50 focus:bg-base-100/80 transition-all duration-300 ${
                  fieldErrors.firstName ? "input-error" : ""
                }`}
                placeholder="John"
                value={form.firstName}
                onChange={handleChange}
                disabled={isPending}
              />
              {fieldErrors.firstName && (
                <span className="label-text-alt text-error mt-1">{fieldErrors.firstName}</span>
              )}
            </div>

            <div className="form-control flex-1">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs">Last Name</span>
              </label>
              <input
                type="text"
                name="lastName"
                className={`input input-bordered w-full rounded-xl focus:input-primary bg-base-100/50 border-base-300/30 focus:border-primary/50 focus:bg-base-100/80 transition-all duration-300 ${
                  fieldErrors.lastName ? "input-error" : ""
                }`}
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
                disabled={isPending}
              />
              {fieldErrors.lastName && (
                <span className="label-text-alt text-error mt-1">{fieldErrors.lastName}</span>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs flex items-center gap-1">
                <FiUser /> Username
              </span>
            </label>
            <input
              type="text"
              name="username"
              className={`input input-bordered w-full rounded-xl focus:input-primary bg-base-100/50 border-base-300/30 focus:border-primary/50 focus:bg-base-100/80 transition-all duration-300 ${
                fieldErrors.username ? "input-error" : ""
              }`}
              placeholder="username"
              value={form.username}
              onChange={handleUsernameChange}
              disabled={isPending}
            />
            {fieldErrors.username && (
              <span className="label-text-alt text-error mt-1">{fieldErrors.username}</span>
            )}
            {usernameStatus === "checking" && (
              <span className="label-text-alt text-warning mt-1">Checking availability...</span>
            )}
            {usernameStatus === "available" && (
              <span className="label-text-alt text-success mt-1">{usernameMessage}</span>
            )}
            {usernameStatus === "taken" && (
              <span className="label-text-alt text-error mt-1">{usernameMessage}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs flex items-center gap-1">
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

          {/* Password */}
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs flex items-center gap-1">
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
              "Sign Up"
            )}
          </button>
        </form>

        {/* Status Alerts */}
        {success && (
          <div className="alert alert-success rounded-xl mt-4 py-2 shadow-sm text-sm">
            <span>Registration email sent! Please check your inbox to verify.</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error rounded-xl mt-4 py-2 shadow-sm text-sm">
            <span>{error}</span>
          </div>
        )}

        <div className="divider opacity-20 my-6 w-full"></div>

        <p className="text-sm opacity-70">
          Already have an account?{" "}
          <Link className="link link-primary font-semibold" href="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
