"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import { Loader2, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";
import axios from "axios";
import api from "@/app/lib/api";
// import { FormControl, InputLabel, NativeSelect } from "@mui/material";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";


const generateRoomName = () => {
  return "QM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const CreatePage = () => {
  const { user, guest, isGuest, isLogin, loading, isMaxTryReached } = useUser();

   const [roomName, setRoomName] = useState("");
  const [step, setStep] = useState<"form" | "loading" | "share" | "failed">(
    "form",
  );
  const [userId, setuserId] = useState("");
  const [categories, setCategories] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const handleChangeCategory = (event: { target: { value: string } }) => {
    const value = event.target.value;
    setSelectedCategory(value);
    setSelectedQuiz(""); // reset quiz
  };
  const handleChangeQuiz = (event: { target: { value: string } }) => {
    const value = event.target.value;
    setSelectedQuiz(value);
  };

  useEffect(() => {
    setRoomName(generateRoomName());
  }, []);

  const handleCreateRoom = async () => {
    if (!user?.id) {
      toast.error("User not ready. Try again.");
      return;
    }
    try {
      setStep("loading");

      const res = await api.post("/room/createRoom", {
        hostId: user.id,
        roomName,
        categoryId: selectedCategory,
        quizId: selectedQuiz,
        
      });

      if (!res.data.success) {
        setStep("failed");
        return;
      }

      // setRoomId(res.data.id); // use DB room id, not random one
      setStep("share");
      toast.success("Room created successfully 🎉");
    } catch (err) {
      console.error(err);
      setStep("failed");
      toast.error("Failed to create room");
    }

    // setTimeout(() => {

    //   setStep("share");
    //   toast.success("Room created successfully 🎉");
    // }, 2000);
  };

  useEffect(() => {
    if (loading || isMaxTryReached || (!isLogin && !isGuest)) return;

    const fetchCategories = async () => {
      try {
        const res = await api.get(`/categories`);

        setCategories(res.data.categories ?? res.data);
        console.log(categories);
      } catch (err) {
        console.error("❌ Failed to fetch categories", err);
      } finally {
      }
    };

    fetchCategories();
  }, [loading, isLogin, isGuest, isMaxTryReached]);

  useEffect(() => {
    if (!selectedCategory) {
      setQuiz([]); // clear quizzes
      setSelectedQuiz(""); // reset quiz selection
      return;
    }

    const fetchQuizzes = async () => {
      try {
        const res = await api.get(`/categories/${selectedCategory}/quizzes`);
        console.log(res.data.quizzes);
        setQuiz(res.data.quizzes);
        console.log(quiz);
      } catch (err) {
        console.error("❌ Failed to fetch quizzes", err);
      } finally {
      }
    };

    fetchQuizzes();

    console.log("ooo ballle ball de shawa shawa");
  }, [selectedCategory]);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/${roomName}/lobby/`;

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

          <fieldset className="fieldset " hidden>
            <legend className="fieldset-legend text-xl">Username</legend>
            <input
              className="input input-primary w-64"
              value={user?.username || ""}
              disabled
            />
          </fieldset>

          

          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xl">Room Name</legend>
            <input
              className="input input-primary w-64"
              placeholder="Quiz Night 🔥"
              value={roomName}
disabled            />
          </fieldset>

          <div className="flex flex-col gap-1 w-64">
            <label className="fieldset-legend text-xl">Category</label>
            <select
              className="select select-primary w-64"
              value={selectedCategory}
              onChange={handleChangeCategory}
            >
              <option value="">Select Category</option>
              {categories.map((element) => (
                <option key={element._id} value={String(element._id)}>
                  {element.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-64">
            <label className="fieldset-legend text-xl">Quiz</label>
            <select
              className="select select-primary w-64"
              value={selectedQuiz}
              onChange={handleChangeQuiz}
              disabled={!selectedCategory}
            >
              <option value="">Select Quiz</option>
              {quiz.map((element) => (
                <option key={element._id} value={String(element._id)}>
                  {element.title}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary w-64"
            onClick={handleCreateRoom}
            disabled={!roomName || !selectedCategory || !selectedQuiz}
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

      {step === "failed" && <div>fail ho gaya re bitua</div>}

      {step === "share" && (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-bold">Room Ready 🎉</h3>

          <QRCodeCanvas
            value={`${window.location.origin}/room/${roomName}/lobby`}
            size={180}
          />

          <p className="font-mono text-sm">{roomName}</p>

          <button
            className="btn btn-outline flex gap-2"
            onClick={handleCopyLink}
          >
            <Share2 size={16} /> Copy Invite Link
          </button>

          <a href={`/room/${roomName}/lobby`} className="btn btn-primary w-64">
            Go to Lobby →
          </a>
        </div>
      )}
    </div>
  );
};

export default CreatePage;
