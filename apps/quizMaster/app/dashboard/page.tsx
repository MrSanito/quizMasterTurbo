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
import Image from "next/image";
import Avatar1 from "@/public/avatars/avatar1.svg"
import { BiSolidEdit } from "react-icons/bi";


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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="relative w-full overflow-hidden rounded-2xl  shadow-sm">
            {/* subtle gradient background glow */}
            <div className="absolute inset-0  pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 p-8">
              {/* LEFT — Title Zone */}
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Dashboard
                </h1>
                <p className="text-sm ">Here’s what’s happening today.</p>
              </div>
              <div className="">
                {/* CENTER — Identity Pill */}
                <div className="flex items-center gap-4 rounded-2xl bg-base-100/70 backdrop-blur-sm px-4 py-2 border border-base-300 shadow-sm transition-all hover:shadow-md">
                  {/* Avatar Container */}
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-white/60 p-[2px] shadow-inner">
                      <Image
                        src={Avatar1}
                        alt="avatar"
                        width={44}
                        height={44}
                        className="rounded-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-medium opacity-60 uppercase tracking-wide">
                      Welcome back
                    </span>
                    <span className="text-base font-semibold">{user.firstName + " " + user.lastName}</span>
                  </div>
                </div>
                <div className="flex flex-row w-32 h-10 justify-center items-center rounded-2xl bg-white text-black m-2">
                  <Link href={`dashboard/profile/edit`}>
                  <div className="flex flex-row justify-center items-center gap-2 ">

                  <BiSolidEdit />
                  <p>

                  Edit Profile
                  </p>
                  </div>
                  </Link>
                </div>
              </div>
            </div>
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
