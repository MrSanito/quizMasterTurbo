"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiXCircle, FiMail, FiLoader } from "react-icons/fi";
import api from "@/app/lib/api";
import Link from "next/link";

type VerifyPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function VerifyPage({ params }: VerifyPageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Verifying your activation key...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Activation token is missing or malformed.");
      return;
    }

    const verifyToken = async () => {
      try {
        console.log(`Verifying token: ${token} via auth2 backend...`);
        const res = await api.post(`/auth2/verify/${token}`);
        console.log("Verification Response:", res.data);

        if (res.data?.success) {
          setStatus("success");
          setMessage(res.data?.message || "Your QuizMaster account is confirmed successfully!");
        } else {
          setStatus("error");
          setMessage(res.data?.message || "The verification link is invalid or has expired.");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        const serverMsg = err.response?.data?.message || "Verification failed. Connection to server refused.";
        setStatus("error");
        setMessage(serverMsg);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex flex-col min-h-[85vh] justify-center items-center px-4 relative overflow-hidden">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-base-200/80 backdrop-blur-md border border-base-300 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        {/* Loading State */}
        {status === "loading" && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-base-300 flex items-center justify-center shadow-lg mb-2">
              <FiLoader className="text-3xl text-primary animate-spin" />
            </div>
            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Verifying Account
            </h3>
            <p className="text-sm opacity-70 max-w-xs">{message}</p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="flex flex-col items-center text-center space-y-6 w-full">
            <div className="w-16 h-16 rounded-2xl bg-success/20 border border-success/30 flex items-center justify-center shadow-lg shadow-success/10 mb-2">
              <FiCheckCircle className="text-3xl text-success" />
            </div>
            <h3 className="text-2xl font-extrabold text-success">
              Account Confirmed!
            </h3>
            <p className="text-sm opacity-70 max-w-xs">{message}</p>
            <div className="divider opacity-20 w-full my-2"></div>
            <Link
              href="/login2"
              className="btn btn-primary w-full rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              Go to Login2
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="flex flex-col items-center text-center space-y-6 w-full">
            <div className="w-16 h-16 rounded-2xl bg-error/20 border border-error/30 flex items-center justify-center shadow-lg shadow-error/10 mb-2">
              <FiXCircle className="text-3xl text-error animate-pulse" />
            </div>
            <h3 className="text-2xl font-extrabold text-error">
              Verification Failed
            </h3>
            <p className="text-sm opacity-70 max-w-xs">{message}</p>
            <div className="divider opacity-20 w-full my-2"></div>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/register2"
                className="btn btn-primary w-full rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Try Registering Again
              </Link>
              <Link
                href="/login2"
                className="btn btn-ghost w-full rounded-xl border border-base-300 hover:bg-base-300 transition-all text-sm"
              >
                Go to Login2
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
