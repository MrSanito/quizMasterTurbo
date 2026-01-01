"use client";

import { FaCirclePlay, FaTrophy } from "react-icons/fa6";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Card from "@/components/Card";
const Dashboard = () => {
  const data = [
    {
      title: "Quizzes Played",
      icon: "FaBook",
      Content: "1245",
      server: true,
      progressBar: false,
    },
    {
      title: "Current Streak",
      icon: "FaGripfire",
      Content: "42",
      server: false,
      progressBar: false,
    },
    {
      title: "Total Essence",
      icon: "IoDiamond",
      Content: "850,000",
      server: false,
      progressBar: true,
    },
    {
      title: "Global Rank",
      icon: "LuCrown",
      Content: "#14",
      server: false,
      progressBar: false,
    },
  ];
  return (
    <div className="min-h-screen flex flex-col items-center pt-12 bg-base-200">
      {/* Show content when signed in */}
      {/* <SignedIn> */}
        <div className="text-center space-y-4 flex justify-between px-8 w-full">
          <div>
            <h1 className="text-3xl font-bold pb-2 text-left">Dashboard!</h1>
            <p className="text-lg">
              Welcome back, Vishal. You're on a 3-day streak!
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-active border border-warning">
              <FaTrophy />
              View Leaderboard
            </button>
            <button className="btn btn-active btn-primary">
              <FaCirclePlay />
              StartQuiz
            </button>

            {/* <UserButton afterSignOutUrl="/" /> */}
          </div>
        </div>
        {/* card */}
        <div className="flex justify-center gap-3">
          {data.map((element, key) => (
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

        <div className="flex pt-10 gap-9 w-full items-center justify-around ">
          <div>
            <Card
              title={`Battle Log `}
              content={`content to hai bhai`}
              size={[1 / 2]}
              text={`sm`}
            />
          </div>
          <div>
            <Card />
          </div>
        </div>
      {/* </SignedIn> */}

      {/* Show warning + sign-in options when signed out */}
      {/* <SignedOut> */}
        <div className="flex flex-col items-center space-y-6 p-4 bg-base-100 shadow-xl rounded-lg w-1/4 px-10">
          <h2 className="text-2xl font-bold text-red-500 mt-6">
            Sign in to view this page!
          </h2>
          <p className="text-lg text-gray-600">
            Access exclusive quizzes and content.
          </p>

          <div className="flex space-x-4">
            {/* <SignInButton> */}
              <button className="btn btn-primary">Sign In</button>
            {/* </SignInButton> */}
            {/* <SignUpButton> */}
              <button className="btn btn-secondary">Sign Up</button>
            {/* </SignUpButton> */}
          </div>

          <Link href="/" className="btn btn-link text-primary pb-6">
            Back to Home
          </Link>
        </div>
      {/* </SignedOut> */}
    </div>
  );
};

export default Dashboard;
