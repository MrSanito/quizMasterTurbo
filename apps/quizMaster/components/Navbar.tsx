"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import { Avatar } from "@mui/material";

const Navbar = () => {
  const { user, loading, isLogin } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Navbar */}
      <div
        className="flex items-center justify-between navbar bg-base-200/80 backdrop-blur-md
        shadow-md px-4 md:px-12 border-b border-base-300 transition-all duration-300"
        suppressHydrationWarning
      >
        {/* Logo LEFT */}
        <Link
          href="/"
          className="text-3xl font-extrabold text-primary relative group"
        >
          QuizMaster
          <span className="absolute left-0 -bottom-1 h-[3px] w-0 bg-primary rounded-full transition-all duration-300 group-hover:w-full" />
        </Link>

        {/* Desktop Menu RIGHT */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { href: "/", label: "Home" },
            { href: "/categories", label: "Categories" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="btn btn-ghost relative overflow-hidden hover:text-primary transition"
            >
              {item.label}
              <span className="absolute bottom-1 left-1/2 h-[2px] w-0 bg-primary rounded-full transition-all duration-300 group-hover:w-1/2" />
            </Link>
          ))}

          {isLogin ? (
            <>
              <Link
                href="/leaderboard"
                className="btn btn-ghost hover:text-primary hover:scale-[1.05] transition"
              >
                🏆 Leaderboard
              </Link>

              <Link
                href="/dashboard"
                className="btn btn-ghost hover:text-primary hover:scale-[1.05] transition"
              >
                <Avatar
                  src={`/avatars/${user.avatar}`}
                  sx={{
                    width: 45,
                    height: 45,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                    border: "1px solid white",
                  }}
                />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="btn btn-ghost hover:text-primary hover:scale-[1.05] transition"
              >
                👤 Guest
              </Link>
              <Link
                href="/register"
                className="btn btn-ghost hover:text-primary hover:scale-[1.05] transition"
              >
                ✨ Register
              </Link>
              <Link
                href="/login"
                className="btn btn-ghost hover:text-primary hover:scale-[1.05] transition"
              >
                🔐 Login
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="btn btn-square btn-ghost md:hidden hover:rotate-90 transition-transform duration-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-72 bg-base-200/80 backdrop-blur-xl
        border-r border-base-300 shadow-2xl p-6 flex flex-col gap-6
        transform transition-all duration-300 ease-out z-50
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="btn btn-ghost btn-circle self-end hover:bg-error/10 hover:text-error transition"
        >
          <X size={26} />
        </button>

        {/* 🔥 USER AVATAR IN MOBILE */}
        {isLogin && (
          <div className="flex items-center gap-3 mb-2 px-2">
            <Avatar
              src={`/avatars/${user.avatar}`}
              sx={{
                width: 52,
                height: 52,
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                border: "1px solid white",
              }}
            />
            <div>
              <p className="font-semibold text-lg">{user?.firstName +" "+ user?.lastName}</p>
              <p className="text-sm opacity-60">Welcome back 👋</p>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex flex-col gap-3">
          {[
            { href: "/", label: "🏠 Home" },
            { href: "/categories", label: "🧩 Categories" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <span className="group-hover:translate-x-1 transition-transform">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="divider" />

        {/* Auth Section */}
        {isLogin ? (
          <div className="flex flex-col gap-3">
            <Link
              href="/leaderboard"
              className="btn btn-ghost justify-start hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              🏆 Leaderboard
            </Link>

            <Link
              href="/dashboard"
              className="btn btn-primary justify-start gap-2"
              onClick={() => setIsOpen(false)}
            >
              👋 {user?.name ?? "Dashboard"}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="btn btn-outline btn-primary"
              onClick={() => setIsOpen(false)}
            >
              👤 Guest Dashboard
            </Link>

            <Link
              href="/register"
              className="btn btn-secondary"
              onClick={() => setIsOpen(false)}
            >
              ✨ Register
            </Link>

            <Link
              href="/login"
              className="btn btn-primary"
              onClick={() => setIsOpen(false)}
            >
              🔐 Login
            </Link>
          </div>
        )}
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
