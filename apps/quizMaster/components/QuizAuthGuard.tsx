"use client";

import { ReactNode } from "react";
 import { useUser } from "../app/(auth)/context/GetUserContext";
import Loading from "./Loading";
import NotLoginComponent from "../app/(auth)/components/NotLoginComponent";
import MaxTryReached from "../app/(auth)/components/MaxTryReached";

export default function QuizAuthGuard({ children }: { children: ReactNode }) {
  const { loading, isLogin, isGuest, isMaxTryReached } = useUser();

  // 1️⃣ Auth loading
  if (loading) return <Loading />;

  // 2️⃣ Guest blocked
  if (isMaxTryReached) return <MaxTryReached />;

  // 3️⃣ Not logged in & not guest
  if (!isLogin && !isGuest) return <NotLoginComponent />;

  // 4️⃣ Allowed
  return <>{children}</>;
}
