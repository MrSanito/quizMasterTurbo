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
 import axios from "axios";
import api from "../lib/api";
import FriendRequest from "@/components/FriendRequest";

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

  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const res = await api.get("/auth2/sessions");
      if (res.data?.success) {
        setSessions(res.data.sessions || []);
      } else {
        setSessionError("Failed to load active sessions.");
      }
    } catch (err: any) {
      setSessionError("Error fetching sessions.");
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (isLogin) {
      fetchSessions();
    }
  }, [isLogin]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await api.post(`/auth2/revoke/${sessionId}`);
      if (res.data?.success) {
        fetchSessions();
      } else {
        alert(res.data?.message || "Failed to revoke session");
      }
    } catch (err) {
      console.error("Failed to revoke session", err);
      alert("Error revoking session");
    }
  };

  const handleLogoutAllOther = async () => {
    if (
      !confirm(
        "Are you sure you want to log out of all sessions? This will log you out of this device as well."
      )
    ) {
      return;
    }
    try {
      const res = await api.post("/auth2/logoutall");
      if (res.data?.success) {
        if (refreshAuth) {
          await refreshAuth();
        }
        router.push("/login");
      } else {
        alert(res.data?.message || "Failed to revoke all sessions");
      }
    } catch (err) {
      console.error("Failed to revoke all sessions", err);
      alert("Error revoking sessions");
    }
  };

  // const api = axios.create({
  //   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  //   withCredentials: true, //  REQUIRED
  // });


  const handleLogout = async () => {
    try {
      await api.post("/auth/logout"); //  cookie cleared by Express
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

  // 1 Loading (highest priority)
  if (loading) {
    return <Loading />;
  }

  // 2 Blocked guest
  if (isMaxTryReached) {
    return <MaxTryReached />;
  }

  // 3 Not logged in at all
  if (!isLogin && !isGuest) {
    // return <NotLoginComponent />;
    return null;
  }

  // 4 Guest user (allowed but limited)
  if (isGuest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
        <h2 className="text-xl font-bold text-warning">Guest Mode </h2>
        <p className="mt-2 text-neutral-500">Tries left: {guestLeft}</p>
        <QuizPlayerHistory viewerId={viewerId} viewerType={viewerType} />
      </div>
    );
  }

  // 5 Logged-in user dashboard 
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

        {/*  Logout Modal */}
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
        <FriendRequest/>

        {/* Active Sessions */}
        {isLogin && (
          <div className="max-w-7xl mx-auto mt-12 bg-[#151b23] border border-gray-800 rounded-2xl p-6 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Active Sessions
              </h2>
              {sessions.length > 1 && (
                <button
                  onClick={handleLogoutAllOther}
                  className="btn btn-xs btn-error btn-outline rounded-lg"
                >
                  Log Out of All Sessions
                </button>
              )}
            </div>

            {sessionsLoading ? (
              <div className="flex justify-center p-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : sessionError ? (
              <p className="text-red-500 text-sm">{sessionError}</p>
            ) : sessions.length === 0 ? (
              <p className="text-gray-400 text-sm">No active sessions found.</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      session.isCurrent
                        ? "bg-[#1d242e] border-blue-500/50"
                        : "bg-[#10141a] border-gray-800"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">
                          {session.os || "Unknown OS"} • {session.browser || "Unknown Browser"}
                        </span>
                        {session.isCurrent && (
                          <span className="badge badge-primary badge-xs rounded px-1.5 py-1 text-[10px]">
                            This Device
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        IP: {session.ipAddress || "Unknown IP"}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Last active: {new Date(session.lastUsedAt || session.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="btn btn-sm btn-ghost hover:btn-error text-error rounded-lg"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 6 Fallback (should never happen)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-error"> Something went wrong. Please refresh.</p>
    </div>
  );
};

export default Dashboard;
