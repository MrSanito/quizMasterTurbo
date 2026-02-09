"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import api from "@/app/lib/api";

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
/* ---------------- Types ---------------- */

type ConnectionStatusProps = {
  roomId?: string;
  color: "green" | "red" | "yellow";
  socketId: false | string;
};

/* ---------------- Connection Status ---------------- */

const ConnectionStatus = ({
  roomId,
  color,
  socketId,
}: ConnectionStatusProps) => {
  const [progress, setProgress] = useState(100);
  const [status, setStatus] = useState("Connecting to server…");
  const [connected, setConnected] = useState(false);

  const colorMap = {
    green: "bg-green-400",
    red: "bg-red-400",
    yellow: "bg-yellow-400",
  };

  useEffect(() => {
    if (!socketId) {
      setStatus("Failed To Join Room. Refresh.");
      return;
    }

    const t1 = setTimeout(() => {
      setProgress(90);
      setStatus("Joining room…");
    }, 800);

    const t2 = setTimeout(() => {
      setProgress(100);
      setStatus("Connected");
      setConnected(true);
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [socketId]);

  useEffect(() => {
    if (!connected) return;

    const values = [100, 93, 96, 99, 95, 97, 99];
    let index = 0;

    const interval = setInterval(() => {
      setProgress(values[index]);
      index = (index + 1) % values.length;
    }, 1200);

    return () => clearInterval(interval);
  }, [connected]);

  return (
    <div className="bg-base-200 p-4 rounded-xl w-80 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-medium">Server Status</p>
        <span className="text-[10px] opacity-60 font-mono">{roomId}</span>
      </div>

      <div className="w-full h-2 bg-base-300 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color]} transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-[11px] mt-2 opacity-70">{status}</p>
    </div>
  );
};

/* ---------------- Login Block ---------------- */

const LoginRequired = () => (
  <div className="min-h-[80dvh] flex flex-col justify-center items-center gap-4 text-center">
    <h2 className="text-xl font-bold">Login Required 🚫</h2>
    <p className="opacity-70">You need an account to join a room.</p>
    <a href="/login" className="btn btn-primary">
      Login to Play →
    </a>
  </div>
);

/* ---------------- Lobby Page ---------------- */

const RoomLobbyPage = () => {
  const router = useRouter();
  const { user, loading, isLogin, isGuest, isMaxTryReached } = useUser();
  const { roomId } = useParams<{ roomId: string }>();
  const [startingStatus, setStartingStatus] = useState<boolean>(false);

  const socketRef = useRef<any>(null);
  const [socketId, setSocketId] = useState<false | string>(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [screen, setScreen] = useState<"Loading" | "Success" | "Failed">(
    "Loading",
  );
  const [roomDetail, setRoomDetail] = useState<any>([]);

  const isBlocked = !loading && (!isLogin || isGuest);
  const canConnect = !loading && isLogin && !isGuest && roomId;

  const startGameHandler = async () => {
    const socket = socketRef.current;
    if (!socket) {
        console.error("❌ Socket not initialized");
        return;
    }
    console.log("🚀 User clicked Start Game for room:", roomId);
    setStartingStatus(true);

    try {
      // 1. Call API to initialize game in Redis/DB
      console.log("➡️ Calling API: /room/" + roomId + "/start");
      const res = await api.post(`/room/${roomId}/start`);
      console.log("✅ API Response:", res.data);
      
      if (res.data.success) {
        // 2. Notify Server to start game for everyone
        console.log("➡️ Emitting 'lobby:letsstart' to WS for room:", roomId);
        if (socket.connected) {
             socket.emit("lobby:letsstart", { roomId, hostId: user.id });
             console.log("✅ Emit sent!");
        } else {
             console.error("❌ Socket disconnected! Cannot emit start command.");
             socket.connect(); // Try to reconnect
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to start game:", error);
      alert("Failed to start game: " + (error.response?.data?.message || error.message));
      setStartingStatus(false);
    }
  };

  const player = user
    ? {
        id: user.id,
        name: user.firstName + " " + user.lastName,
        avatar: user.avatar,
      }
    : null;

  /* 🔌 Create socket once */
  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_WS_BASE_URL!, {
      transports: ["websocket"],
      autoConnect: false,
    });

    return () => socketRef.current?.disconnect();
  }, []);

  /* 🚀 Connect & listen */
  useEffect(() => {
    if (!roomId || !player) return;

    const socket = socketRef.current;

    socket.connect();

    const onConnect = () => {
      console.log("connecting to ws");

      setSocketId(socket.id);
      socket.emit("lobby:join", { roomId, player });
      socket.emit("set_location", "lobby");
    };

    const onPlayers = (data: any) => {
      console.log("player aa gaya server se");
      console.log(data);
      let list: any[] = [];

      if (!data) return;

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.players)) {
        list = data.players;
      } else {
        // 🚨 THIS IS YOUR CASE
        list = Object.entries(data).map(([id, value]: any) => {
          const parsed = JSON.parse(value); // 💥 unwrap string
          return {
            id,
            name: parsed.username,
            avatar: parsed.avatar, // 👈 ADD THIS

            socketId: parsed.socketId,
            score: parsed.score,
          };
        });
      }

      setPlayers(list);
    };
    const onLeftPlayers = (data: any) => {
      console.log(data);
      let list: any[] = [];

      if (!data) return;

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.players)) {
        list = data.players;
      } else {
        // 🚨 THIS IS YOUR CASE
        list = Object.entries(data).map(([id, value]: any) => {
          const parsed = JSON.parse(value); // 💥 unwrap string
          return {
            id,
            name: parsed.username,
            avatar: parsed.avatar, // 👈 ADD THIS

            socketId: parsed.socketId,
            score: parsed.score,
          };
        });
      }

      setPlayers(list);
    };
    const onLetStart = (data: any) => {
      console.log(data);
      console.log("response from web socket server ");
      router.push(`/room/${roomId}/game`);
    };

    socket.on("connect", onConnect);
    socket.on("lobby:players", onPlayers);
    socket.on("lobby:startingRoom", onLetStart);

    return () => {
      socket.off("lobby:players", onPlayers);
      socket.off("lobby:startingRoom", onLetStart);

      // 🔌 Actually close connection
      socket.disconnect();
    };
  }, [roomId, player?.id]);

  useEffect(() => {
    if (loading || isMaxTryReached || !isLogin || !roomId) return;

    const updateStatusToLobby = async () => {
      try {
        const res = await api.post(`/room/${roomId}/lobby`, {
          hostId: user.id,
        });
        console.log("response from the server", res.data);

        const roomDataFromAPI = await api.get(`/room/${roomId}/`);
        const roomData = roomDataFromAPI.data.room;
        console.log("roomDetail from api", roomData);

        // 🔥 CHECK STATUS: If game already started/finished, redirect to Game Page
        if (roomData.state === "PLAYING" || roomData.state === "FINISHED" || roomData.state === "COUNTDOWN") {
             console.log("⚠️ Game already running/finished. Redirecting to Game Page...");
             router.replace(`/room/${roomId}/game`);
             return;
        }

        setRoomDetail(roomData);

        console.log("rooomDetail from state", roomDetail);
        setScreen("Success");
        return;
      } catch (err: any) {
        if (err.response?.status === 403) {
          console.log("Not host — skipping lobby state update");
          const roomDataFromAPI = await api.get(`/room/${roomId}/`);
          const roomData = roomDataFromAPI.data.room;
          console.log("roomDetail from api", roomData);

          setRoomDetail(roomData);

          console.log("rooomDetail from state", roomDetail);
          setScreen("Success");

          return; // silently ignore
        }
        console.error("❌ Failed to fetch categories", err);
        setScreen("Failed");
      } finally {
      }
    };

    updateStatusToLobby();
  }, [loading, isLogin, isGuest, isMaxTryReached, roomId, user?.id]);

  /* ---------------- UI ---------------- */

  if (loading) return <Loading />;
  if (isBlocked) return <LoginRequired />;

  if (screen === "Loading") return <Loading />;
  if (screen === "Failed") return <div>Failed Screen Refresh</div>;
  if (screen === "Success")
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 bg-base-100">
        <h2 className="text-2xl font-bold">Quiz Lobby</h2>
        <p className="text-xs opacity-60 font-mono">Room ID: {roomId}</p>

        <ConnectionStatus
          roomId={socketId || ""}
          color={socketId ? "green" : "red"}
          socketId={socketId}
        />

        <div className="bg-base-200 p-5 rounded-xl w-80 shadow-sm">
          <p className="text-sm font-semibold mb-3">
            Players ({players.length})
          </p>

          <ul className="flex flex-col gap-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-base-100 border-l-4 border-l-indigo-400"
              >
                <div className="w-10 h-10 rounded-full ring-2 ring-offset-2 ring-offset-[#151b23] ring-blue-400">
                  <img
                    src={
                      p?.avatar
                        ? `/avatars/${p.avatar}`
                        : "/avatars/avatar4.svg"
                    }
                    alt="profile"
                  />
                </div>
                <span className="text-sm font-medium flex-1">{p.name}</span>
                {roomDetail.hostId === p.id && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-base-300 opacity-80">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {roomDetail.hostId === user.id ? (
          <button
            className="
    btn btn-primary
    "
            onClick={startGameHandler}
          >
            {startingStatus ? "Starting ..." : "🚀 Start Game"}
          </button>
        ) : (
          <div>Wait Let Admin Start The Game</div>
        )}
      </div>
    );
};

export default RoomLobbyPage;
