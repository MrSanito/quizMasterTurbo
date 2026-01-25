"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useUser } from "@/app/(auth)/context/GetUserContext";

const dummyPlayers = [
  { id: 1, name: "Vishal", isHost: true, accent: "border-l-indigo-400" },
  { id: 2, name: "Aman", accent: "border-l-sky-400" },
  { id: 3, name: "Sneha", accent: "border-l-emerald-400" },
  { id: 4, name: "Rahul", accent: "border-l-amber-400" },
];

/* ---------------- Connection Status ---------------- */

type ConnectionStatusProps = {
  roomId?: string;
  color: string;
  socketId: false | string;
};
const ConnectionStatus = ({
  roomId,
  color,
  socketId,
}: ConnectionStatusProps) => {
  const [progress, setProgress] = React.useState(100);
  const [status, setStatus] = React.useState("Connecting to server…");
  const [connected, setConnected] = React.useState(false);
  const colorMap: Record<string, string> = {
    green: "bg-green-400",
    red: "bg-red-400",
    yellow: "bg-yellow-400",
  };

  // Initial connection animation
  useEffect(() => {
    if (socketId == false) {
      setStatus("Failed To Join Room Refresh ...");
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

  // Fake realtime heartbeat AFTER connected
  useEffect(() => {
    if (!connected) return;
    if (socketId == false) {
      return;
    }

    const values = [100, 93, 96, 99, 95, 97, 99, 97, 93];
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

/* ---------------- Lobby Page ---------------- */

const RoomLobbyPage = () => {
  const { user, guest, loading, isLogin, isGuest } = useUser();

  const player = useMemo(() => {
    if (loading) return null;

    if (isLogin && user) {
      return {
        id: user.id,
        name: user.name,
        isGuest: false,
      };
    }

    if (isGuest && guest) {
      return {
        id: guest.id,
        name: guest.name,
        isGuest: true,
      };
    }

    return null;
  }, [loading, isLogin, isGuest, user, guest]);
const socketRef = useRef<any>(null);

if (!socketRef.current) {
  socketRef.current = io("http://localhost:3003", {
    transports: ["websocket"],
    autoConnect: false,
  });
}

const socket = socketRef.current;

  const [socketId, setSocketId] = useState<false | string>(false);
  const { roomId } = useParams<{ roomId: string }>();
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    console.log(player, roomId);
    if (socket.connected) return; // 👈 IMPORTANT

    if (!player || !roomId) return;

    socket.connect();
    console.log(socket.id);

    const onConnect = () => {
      console.log("✅ socket connected", socket.id);
      setSocketId(socket.id);

      socket.emit("join-room", {
        roomId,
        player,
      });
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
      socket.disconnect();
    };
  }, [player, roomId, socket]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 bg-base-100 ">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <h2 className="text-2xl font-bold">Quiz Lobby</h2>
        <p className="text-xs opacity-60 font-mono">Room ID: {roomId}</p>

        {socketId ? (
          <ConnectionStatus
            roomId={socketId}
            color="green"
            socketId={socketId}
          />
        ) : (
          <ConnectionStatus color="red" socketId={socketId} />
        )}
      </div>
      <button onClick={() => socket.emit("message", "Hello from client")}>
        Send Message
      </button>

      {/* Room Info */}
      <div className="bg-base-200 p-5 rounded-xl w-80 shadow-sm">
        <p className="text-sm font-semibold">Room Name</p>
        <p className="text-sm opacity-70">Quiz Night</p>
      </div>

      {/* Players */}
      <div className="bg-base-200 p-5 rounded-xl w-80 shadow-sm">
        <p className="text-sm font-semibold mb-3">
          Players ({dummyPlayers.length})
        </p>

        <ul className="flex flex-col gap-2">
          {dummyPlayers.map((player) => (
            <li
              key={player.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-base-100 border-l-4 ${player.accent}`}
            >
              <img
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${player.name}`}
                alt={player.name}
                className="w-9 h-9 rounded-full bg-base-200"
              />

              <span className="text-sm font-medium flex-1">{player.name}</span>

              {player.isHost && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-base-300 opacity-80">
                  Host
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Status */}
      <p className="text-xs opacity-60">Waiting for players to join…</p>

      {/* Start Button */}
      <button className="btn btn-primary btn-sm w-64" disabled>
        Start Game
      </button>
    </div>
  );
};

export default RoomLobbyPage;
