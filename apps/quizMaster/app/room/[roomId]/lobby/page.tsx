"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import Loading from "@/components/Loading";

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
  const { user, loading, isLogin, isGuest } = useUser();
  const { roomId } = useParams<{ roomId: string }>();

  const socketRef = useRef<any>(null);
  const [socketId, setSocketId] = useState<false | string>(false);
  const [players, setPlayers] = useState<any[]>([]);

  const isBlocked = !loading && (!isLogin || isGuest);
  const canConnect = !loading && isLogin && !isGuest && roomId;

  const player = user ? { id: user.id, name: user.name, isGuest: false } : null;

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
    if (!canConnect || !player) return;

    const socket = socketRef.current;
    if (!socket) return;

    socket.connect();

    const onConnect = () => {
      setSocketId(socket.id);
      socket.emit("room:join", { roomId, player });
    };

    const onPlayers = (data: any) => {
      if (Array.isArray(data)) setPlayers(data);
      else if (Array.isArray(data.players)) setPlayers(data.players);
      else setPlayers(Object.values(data || {}));
    };

    socket.on("connect", onConnect);
    socket.on("room:players", onPlayers);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room:players", onPlayers);
    };
  }, [canConnect, roomId]);

  /* ---------------- UI ---------------- */

  if (loading) return <Loading />;
  if (isBlocked) return <LoginRequired />;

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
        <p className="text-sm font-semibold mb-3">Players ({players.length})</p>

        <ul className="flex flex-col gap-2">
          {players.map((p) => (
             <li
              key={p.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-base-100 border-l-4 border-l-indigo-400"
            >
              <img
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${p.name}`}
                className="w-9 h-9 rounded-full bg-base-200"
              />
              <span className="text-sm font-medium flex-1">{p.name}</span>
              {p.isHost && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-base-300 opacity-80">
                  Host
                </span>
              )}
              {p.socketId}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RoomLobbyPage;
