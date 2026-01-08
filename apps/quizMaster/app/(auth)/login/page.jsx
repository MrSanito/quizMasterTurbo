"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import LoginForm from "@/app/features/auth/components/LoginForm";
import Loading from "@/app/Loading";

const Login = () => {
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

  // ✅ Real unauth user
  return (
    <div className="flex flex-col min-h-[80vh] justify-center items-center">
      <h3 className="text-3xl font-bold text-primary pb-6">Login Form</h3>
      <LoginForm />
      {isMaxTryReached && (
        <div className="w-full max-w-md mx-auto mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-center shadow-sm">
          <p className="text-sm text-warning leading-relaxed">
            ⚠️ Guest limit ho chuki hai bhai 😌 Login kar lo warna quiz gate
            band hi rahega 🚪❌
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;
