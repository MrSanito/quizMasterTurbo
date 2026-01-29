"use client";

import { FaCirclePlay, FaTrophy } from "react-icons/fa6";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import NotLoginComponent from "../(auth)/components/NotLoginComponent";
import MaxTryReached from "../(auth)/components/MaxTryReached";
import Loading from "@/components/Loading";
import { data } from "@/app/dashboard/data";
import Card from "@/components/Card";
import QuizPlayerHistory from "@/app/dashboard/Components/QuizPlayerHistory";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Avatar1 from "@/public/avatars/avatar1.svg";
import Avatar2 from "@/public/avatars/avatar2.svg";
import Avatar3 from "@/public/avatars/avatar3.svg";
import Avatar4 from "@/public/avatars/avatar4.svg";
import Avatar5 from "@/public/avatars/avatar5.svg";
import Avatar6 from "@/public/avatars/avatar6.svg";
import Avatar7 from "@/public/avatars/avatar7.svg";
import Avatar8 from "@/public/avatars/avatar8.svg";
import Avatar9 from "@/public/avatars/avatar9.svg";
import Avatar10 from "@/public/avatars/avatar10.svg";
import { BiSolidEdit } from "react-icons/bi";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { logOut } from "../features/auth/logOutAction";
import axios from "axios";

const Dashboard = () => {
  const {
    user,
    guest,
    loading,
    isLogin,
    isGuest,
    isMaxTryReached,
    guestLeft,
    refreshAuth,
  } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isLogin && !isGuest) {
      router.replace("/login");
    }
  }, [loading, isLogin, isGuest, router]);

  const [logOutModal, setLogOutModal] = useState(false);

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true, // 🔥 REQUIRED
  });

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout"); // 🍪 cookie cleared by Express
      await refreshAuth();
      router.refresh(); // refetch auth state
      router.replace("/login"); // go to login
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const viewerId =
    !loading && isLogin
      ? user?.id
      : !loading && isGuest
        ? guest?.id
        : undefined;

  const viewerType = isLogin ? "user" : "guest";

  console.log(viewerId, viewerType);

  console.log(
    user?.avatar ? `/avatars/${user.avatar}` : "/avatars/avatar1.svg",
  );

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
    // return <NotLoginComponent />;
    return null;
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
    const dummyUser = {
      name: "Jane Doe",
      avatarUrl:
        "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp",
      greeting: "Welcome back,",
    };
    return (
      <div className="min-h-screen bg-base-200 px-4 py-6">
        <div>
          <div className="w-full p-4">
            {/* Card Container */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-[#151b23] rounded-2xl p-6 shadow-md border border-gray-800">
              {/* Left Side: Avatar & Info */}
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="avatar">
                  <div className="w-14 h-14 rounded-full ring-2 ring-offset-2 ring-offset-[#151b23] ring-blue-400">
                    <img
                      src={
                        user?.avatar
                          ? `/avatars/${user.avatar}`
                          : "/avatars/avatar1.svg"
                      }
                      alt="profile"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm font-medium">
                    {dummyUser.greeting}
                  </span>
                  <h2 className="text-white text-xl md:text-2xl font-bold tracking-tight">
                    {user.firstName + " " + user.lastName}
                  </h2>
                </div>
              </div>

              {/* Right Side: Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/dashboard/profile/edit")}
                  className="btn bg-white hover:bg-gray-200 text-black border-none min-h-[2.5rem] h-[2.5rem] px-6 rounded-lg capitalize font-bold"
                >
                  Edit Profile
                </button>

                <button
                  onClick={() => setLogOutModal(true)}
                  className="btn btn-outline btn-error min-h-[2.5rem] h-[2.5rem] px-6 rounded-lg capitalize"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 Logout Modal */}
        {logOutModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#151b23] border border-gray-800 rounded-2xl p-6 w-[90%] max-w-md shadow-lg">
              <h3 className="text-white text-lg font-bold mb-2">
                Confirm Logout
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to log out? Your current session will end.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setLogOutModal(false)}
                  className="btn bg-gray-700 hover:bg-gray-600 text-white border-none px-5 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleLogout}
                  type="submit"
                  className="btn btn-outline btn-error px-5 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

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
