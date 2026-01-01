"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Navbar */}
      <div
        className="flex navbar bg-base-200 shadow-md px-4 md:px-12"
        suppressHydrationWarning
      >
        <div className="flex-1 justify-center">
          <Link href="/" className="text-3xl font-extrabold text-primary">
            QuizMaster
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6">
          <Link href="/" className="btn btn-ghost hover:text-primary">
            Home
          </Link>
          <Link href="/categories" className="btn btn-ghost hover:text-primary">
            Categories
          </Link>
          <Link
            href="/leaderboard"
            className="btn btn-ghost hover:text-primary"
          >
            Leaderboard
          </Link>
          <Link href="/register" className="btn btn-ghost hover:text-primary">
            Register
          </Link>
          <Link href="/login" className="btn btn-ghost hover:text-primary">
            Login
          </Link>

          {/* Show Profile Button when Signed In */}
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          {/* Show Custom Sign In / Sign Up when Signed Out */}
          <SignedOut>
            <Link href="/sign-in">
              <button className="btn btn-primary">Sign In</button>
            </Link>
            <Link href="/sign-up">
              <button className="btn btn-secondary">Sign Up</button>
            </Link>
          </SignedOut>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="btn btn-square btn-ghost md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Mobile Menu) */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-base-200 shadow-lg p-5 flex flex-col gap-6 transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="btn btn-ghost self-end"
        >
          <X size={28} />
        </button>
        <Link
          href="/"
          className="btn btn-ghost text-lg hover:text-primary hover:bg-base-300"
        >
          Home
        </Link>
        <Link
          href="/categories"
          className="btn btn-ghost text-lg hover:text-primary hover:bg-base-300"
        >
          Categories
        </Link>
        <Link
          href="/leaderboard"
          className="btn btn-ghost text-lg hover:text-primary hover:bg-base-300"
        >
          Leaderboard
        </Link>

        {/* Show Profile Button when Signed In */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        {/* Show Custom Sign In / Sign Up when Signed Out */}
        <SignedOut>
          <Link href="/sign-in">
            <button className="btn btn-primary w-full">Sign In</button>
          </Link>
          <Link href="/sign-up">
            <button className="btn btn-secondary w-full">Sign Up</button>
          </Link>
        </SignedOut>
      </div>

      {/* Overlay for mobile */}
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
