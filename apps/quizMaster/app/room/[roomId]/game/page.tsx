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


const Page = () => {
   const router = useRouter();
    const { user, loading, isLogin, isGuest, isMaxTryReached } = useUser();
      const { roomId } = useParams<{ roomId: string }>();
        const [socketId, setSocketId] = useState<false | string>(false);
        const [players, setPlayers] = useState<any[]>([]);
      
          const [roomDetail, setRoomDetail] = useState<any>([]);
            const socketRef = useRef<any>(null);
          

        
  const isBlocked = !loading && (!isLogin || isGuest);
  const canConnect = !loading && isLogin && !isGuest && roomId;

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
          if (!canConnect || !player) return;
      
          const socket = socketRef.current;
          if (!socket) return;
      
          socket.connect();
      
          const onConnect = () => {
            setSocketId(socket.id);
            socket.emit("room:join", { roomId, player });
          };
      
          const onPlayers = (data: any) => {
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
          };;
      
          socket.on("connect", onConnect);
          socket.on("room:players", onPlayers);
          socket.on("room:startingRoom", onLetStart);
      
          return () => {
            socket.off("connect", onConnect);
            socket.off("room:players", onPlayers);
          };
        }, [canConnect, roomId]);
      

        
          if (loading) return <Loading />;
          if (isBlocked) return <LoginRequired />;


    
  return (
    <div>
      <div className="bg-base-200 p-5 rounded-xl w-80 shadow-sm">
        <p className="text-sm font-semibold mb-3">Players ({players.length})</p>

        <ul className="flex flex-col gap-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-base-100 border-l-4 border-l-indigo-400"
            >
              <div className="w-10 h-10 rounded-full ring-2 ring-offset-2 ring-offset-[#151b23] ring-blue-400">
                <img
                  src={
                    p?.avatar ? `/avatars/${p.avatar}` : "/avatars/avatar4.svg"
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
    </div>
  );
}

export default Page