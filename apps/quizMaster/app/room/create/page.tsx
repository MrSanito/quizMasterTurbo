"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import { Loader2, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";
import axios from "axios";

const generateRoomId = () => {
  return "QM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const CreatePage = () => {
  const { user, loading } = useUser();

  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [step, setStep] = useState<"form" | "loading" | "share">("form");

  useEffect(() => {
    setRoomId(generateRoomId());
  }, []);

  const handleCreateRoom = () => {
    setStep("loading");

    setTimeout(() => {

      setStep("share");
      toast.success("Room created successfully 🎉");
    }, 2000);
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/lobby/${roomId}`;

    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied 🚀");
    } catch (err) {
      // Fallback for focus / permission issues
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.style.position = "fixed"; // avoid scroll jump
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        document.execCommand("copy");
        toast.success("Invite link copied 🚀");
      } catch {
        toast.error("Failed to copy link 😬");
      }

      document.body.removeChild(textarea);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-[80dvh] flex flex-col justify-center items-center gap-6">
      {step === "form" && (
        <>
          <h3 className="text-lg font-bold">Create Room</h3>

          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xl">Username</legend>
            <input
              className="input input-primary w-64"
              value={user?.username || ""}
              disabled
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xl">Room ID</legend>
            <input
              className="input input-primary w-64"
              value={roomId}
              disabled
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xl">Room Name</legend>
            <input
              className="input input-primary w-64"
              placeholder="Quiz Night 🔥"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </fieldset>

          <button
            className="btn btn-primary w-64"
            onClick={handleCreateRoom}
            disabled={!roomName}
          >
            Create Room
          </button>
        </>
      )}

      {step === "loading" && (
        <div className="flex flex-col items-center gap-4 min-h-[80dvh]">
          <Loading /> <p className="text-sm opacity-70">Creating your room…</p>
        </div>
      )}

      {step === "share" && (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-bold">Room Ready 🎉</h3>

          <QRCodeCanvas
            value={`${window.location.origin}/room/lobby/${roomId}`}
            size={180}
          />

          <p className="font-mono text-sm">{roomId}</p>

          <button
            className="btn btn-outline flex gap-2"
            onClick={handleCopyLink}
          >
            <Share2 size={16} /> Copy Invite Link
          </button>

          <a href={`/room/lobby/${roomId}`} className="btn btn-primary w-64">
            Go to Lobby →
          </a>
        </div>
      )}
    </div>
  );
};

export default CreatePage;
