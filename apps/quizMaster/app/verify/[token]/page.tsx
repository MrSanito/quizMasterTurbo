"use client";

import React, { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import api from "@/app/lib/api";

type VerifyPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function VerifyPage({ params }: VerifyPageProps) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!token || verificationStarted.current) return;
    verificationStarted.current = true;

    const verifyEmail = async () => {
      try {
        const res = await api.post(`/auth/verify/${token}`);
        if (res.data?.success) {
          setStatus("success");
          setMessage(res.data?.message || "Your email has been successfully verified!");
        } else {
          setStatus("error");
          setMessage(res.data?.message || "Verification failed. The token might be invalid or expired.");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        const msg = err.response?.data?.message || "Failed to connect to the verification server. Please try again later.";
        setMessage(msg);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center relative overflow-hidden px-4">
      {/* Decorative Blur Orbs for Rich Aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-base-200/35 backdrop-blur-xl border border-base-300/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        
        {status === "loading" && (
          <div className="flex flex-col items-center text-center space-y-6 py-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 shadow-sm animate-spin text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-base-content tracking-tight">
                Verifying Email
              </h3>
              <p className="text-sm text-base-content/60 max-w-xs">
                Please wait while we confirm your email address and activate your account...
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-success/15 border border-success/35 flex items-center justify-center mb-2 shadow-sm shadow-success/10 text-success">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-base-content tracking-tight">
                Account Verified!
              </h3>
              <p className="text-sm text-base-content/70 max-w-xs">
                {message}
              </p>
            </div>
            <Link 
              href="/login"
              className="btn btn-primary w-full rounded-xl flex items-center justify-center gap-2 group transition-all duration-300 font-semibold"
            >
              Sign In to QuizMaster
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-error/15 border border-error/35 flex items-center justify-center mb-2 shadow-sm shadow-error/10 text-error">
              <XCircle className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-base-content tracking-tight">
                Verification Failed
              </h3>
              <p className="text-sm text-base-content/70 max-w-xs text-error/90 font-medium">
                {message}
              </p>
            </div>
            <div className="w-full space-y-3">
              <Link 
                href="/register"
                className="btn btn-outline btn-primary w-full rounded-xl flex items-center justify-center gap-2 font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Register Again
              </Link>
              <Link 
                href="/login"
                className="btn btn-ghost w-full rounded-xl font-medium text-sm text-base-content/60 hover:text-base-content"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
