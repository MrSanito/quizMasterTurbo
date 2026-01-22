"use client";

import React from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

const dummyPlayers = [
  { id: 1, name: "Vishal", isHost: true, accent: "border-l-indigo-400" },
  { id: 2, name: "Aman", accent: "border-l-sky-400" },
  { id: 3, name: "Sneha", accent: "border-l-emerald-400" },
  { id: 4, name: "Rahul", accent: "border-l-amber-400" },
];

const RoomLobbyPage = () => {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 bg-base-100">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Quiz Lobby</h2>
        <p className="text-xs opacity-60 font-mono">Room ID: {roomId}</p>
      </div>

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
              {/* Avatar */}
              <img
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${player.name}`}
                alt={player.name}
                className="w-9 h-9 rounded-full bg-base-200"
              />

              {/* Name */}
              <span className="text-sm font-medium flex-1">{player.name}</span>

              {/* Host */}
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
