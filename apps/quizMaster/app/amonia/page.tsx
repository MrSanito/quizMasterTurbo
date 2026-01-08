"use client";

import React from "react";
import { useUser } from "../(auth)/context/GetUserContext";
import MaxTryReached from "@/app/(auth)/Components/MaxTryReached";

import { logOut } from "../features/auth/actions";

const Page = () => {
  const { user, isLogin, isGuest, isMaxTryReached, guestLeft } = useUser();

  // 🔴 BLOCKED STATE (highest priority)
  if (isMaxTryReached) {
    return <MaxTryReached />;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Auth System Playground 🧪</h1>

      {/* 🟢 LOGGED-IN USER */}
      {isLogin && user && (
        <section>
          <h2>✅ Logged in user</h2>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          <p>{user.name}</p>
          <p>{user.email}</p>

          <button
            onClick={() => {
              logOut();
            }}
          >
            Logout
          </button>
        </section>
      )}

      {/* 🟡 GUEST USER */}
      {isGuest && (
        <section>
          <h2>🟡 Guest user</h2>
          <p>Tries left: {guestLeft}</p>
        </section>
      )}

      {/* ⚠️ FALLBACK (should never happen, but safe) */}
      {!isLogin && !isGuest && (
        <section>
          <h2>⚠️ Unknown state</h2>
          <p>Please refresh or login.</p>
        </section>
      )}
    </div>
  );
};

export default Page;
