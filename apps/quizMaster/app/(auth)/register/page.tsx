"use client";

import React, { useEffect } from "react";

import { useRouter } from "next/navigation";
import { useUser } from "@/app/(auth)/context/GetUserContext";

import RegisterForm from "../../features/auth/components/RegisterForm";
import ClientOnly from "../../features/auth/components/ClientOnly";

import Loading from "@/components/Loading";
import Link from "next/link";
const Register = () => {
  const router = useRouter();
  const { loading, isLogin, isGuest, isMaxTryReached } = useUser();
  console.log("isGuest", isGuest);

  // ✅ Hook ALWAYS runs (no condition above it)
  useEffect(() => {
    if (!loading && isLogin) {
      router.replace("/dashboard");
    }
  }, [loading, isLogin, router]);

  //  ⏳ Still loading auth state
  if (loading) {
    return <Loading />;
  }

  // 🚫 Redirecting → render nothing
  if (isLogin) {
    router.replace("/dashboard");

    return null;
  }

  return (
    <ClientOnly>
      <div
        className="flex flex-col min-h-[80vh] justify-center items-center"
        suppressHydrationWarning
      >
        <h3 className="text-3xl font-bold text-primary pb-6">Register Form </h3>
        <RegisterForm />
        <div className="">
          Already a User ?{" "}
          <Link className="text-primary" href={`/login`}>
            Login
          </Link>
        </div>
        {isMaxTryReached && (
          <div className="w-full max-w-md mx-auto mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-center shadow-sm">
            <p className="text-sm text-warning leading-relaxed">
              ⚠️ Guest limit ho chuki hai bhai 😌 Register kar lo warna quiz
              gate band hi rahega 🚪❌
            </p>
          </div>
        )}
      </div>
    </ClientOnly>
  );
};

export default Register;
