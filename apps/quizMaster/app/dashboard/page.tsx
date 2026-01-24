"use client";

import { FaCirclePlay, FaTrophy } from "react-icons/fa6";
import { useUser } from "@/app/(auth)/context/GetUserContext";
 import NotLoginComponent from "../(auth)/components/NotLoginComponent";
 import MaxTryReached from "../(auth)/components/MaxTryReached";
import Loading from "@/components/Loading";
import { data } from "@/app/dashboard/data";
import Card from "@/components/Card";
 import QuizPlayerHistory from "@/app/dashboard/Components/QuizPlayerHistory";
import Link from "next/link";

const Dashboard = () => {
  const { user, guest, loading, isLogin, isGuest, isMaxTryReached, guestLeft } =
    useUser();

 const viewerId =
   !loading && isLogin ? user?.id : !loading && isGuest ? guest?.id : undefined;

 const viewerType = isLogin ? "user" : "guest";

  console.log(viewerId, viewerType);

  // 1️⃣ Loading (highest priority)
  if (loading) {
    return <Loading />;
  }

  // 2️⃣ Blocked guest
  if (isMaxTryReached) {
    return <MaxTryReached />;
  }

  // 3️⃣ Not logged in at all
  if (!isLogin && !isGuest) {
    return <NotLoginComponent />;
  }

  // 4️⃣ Guest user (allowed but limited)
  if (isGuest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
        <h2 className="text-xl font-bold text-warning">Guest Mode 👀</h2>
        <p className="mt-2 text-neutral-500">Tries left: {guestLeft}</p>
        <QuizPlayerHistory viewerId={viewerId} viewerType={viewerType} />
      </div>
    );
  }

  // 5️⃣ Logged-in user dashboard ✅
  if (isLogin && user) {
    return (
      <div className="min-h-screen bg-base-200 px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center max-w-7xl mx-auto">
          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-base sm:text-lg">
              👋 Welcome back,{" "}
              <span className="font-semibold">{user.name}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="btn border border-warning w-full sm:w-auto">
              <FaTrophy />
              Leaderboard
            </button>
              <Link href={`/quiz/mode`}>
            <button className="btn btn-primary w-full sm:w-auto">

              <FaCirclePlay />
              Start Quiz
            </button>
              </Link>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-8 max-w-7xl mx-auto">
          {Array.isArray(data) &&
            data.map((element, key) => (
              <Card
                key={key}
                title={element.title}
                icon={element.icon}
                content={element.Content}
                server={element.server}
                progressBar={element.progressBar}
               />
            ))}
        </div>
        <QuizPlayerHistory viewerId={viewerId} viewerType={viewerType} />
      </div>
    );
  }

  // 6️⃣ Fallback (should never happen)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-error">⚠️ Something went wrong. Please refresh.</p>
    </div>
  );
};

export default Dashboard;
