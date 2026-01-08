"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { deleteCookie, getCookie } from "cookies-next";

/* ------------------ axios ------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
console.log(API_URL);
const api = axios.create({
  baseURL: `${API_URL}`,
  withCredentials: true,
  // timeout: 3000,
});

/* ------------------ context ------------------ */
const UserContext = createContext({
  user: null,
  isLogin: false,
  isGuest: false,
  isMaxTryReached: false,
  loading: true,
  guest: null,
  guestCount: 0,
  guestLeft: 3,
  incrementGuestCount: () => {},
});

/* ------------------ helpers ------------------ */
const MAX_GUEST_TRIES = 3;

function generateGuestId() {
  return "guest_" + crypto.randomUUID();
}

/* ------------------ provider ------------------ */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);

  const [isLogin, setIsLogin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isMaxTryReached, setIsMaxTryReached] = useState(false);
  const [loading, setLoading] = useState(true);

  const [guest, setGuest] = useState(null);
  const [guestCount, setGuestCount] = useState(0);

  /* -------- ROUTE INFO -------- */
  const pathname = usePathname();
  const PUBLIC_ROUTES = ["/abFout"];
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  /* -------- SESSION HINT COOKIE -------- */
  const hasSession = getCookie("hasSession");

  /* -------- AUTH CHECK (OPTIMIZED) -------- */
  useEffect(() => {
    let cancelled = false;

    const runAuthFlow = async () => {
      setLoading(true);

      // ✅ Public route → skip all auth
      if (isPublicRoute) {
        setLoading(false);
        return;
      }

      // 🚀 NO SESSION → DIRECT GUEST MODE (NO API CALL)
      if (!hasSession) {
        setUser(null);
        setIsLogin(false);
        setLoading(false);
        return;
      }

      // 🔐 POSSIBLE LOGIN → VERIFY WITH SERVER
      try {
        console.log("fetching data");
        const res = await api.post("/auth/verify_token");

        if (cancelled) return;

        if (res.data?.success) {
          setUser(res.data.user);
          setIsLogin(true);

          // reset guest flags
          setIsGuest(false);
          setIsMaxTryReached(false);
          setGuest(null);
localStorage.removeItem("guestId");
           localStorage.removeItem("guestQuizCount");
        } else {
          // invalid session
          setUser(null);
          setIsLogin(false);
        }
      } catch (error) {
        console.log("erros", error);
        // token expired / invalid
          deleteCookie("hasSession");
        setUser(null);
        setIsLogin(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    runAuthFlow();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  /* -------- GUEST LOGIC (CLIENT ONLY) -------- */
  useEffect(() => {
    if (isLogin) return;

    let guestId = localStorage.getItem("guestId");

    if (!guestId) {
      guestId = generateGuestId();
      localStorage.setItem("guestId", guestId);
      localStorage.setItem("guestQuizCount", "0");
    }

    const storedCount = Number(localStorage.getItem("guestQuizCount") || 0);

    setGuest({ id: guestId });
    setGuestCount(storedCount);

    if (storedCount <= MAX_GUEST_TRIES) {
      setIsGuest(true);
      setIsMaxTryReached(false);
    } else {
      setIsGuest(false);
      setIsMaxTryReached(true);
    }
  }, [isLogin]);

  /* -------- GUEST COUNT -------- */
  const incrementGuestCount = () => {
    if (isLogin) return;

    const newCount = guestCount + 1;

    setGuestCount(newCount);
    localStorage.setItem("guestQuizCount", String(newCount));

    if (newCount >= MAX_GUEST_TRIES) {
      setIsGuest(false);
      setIsMaxTryReached(true);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLogin,
        isGuest,
        isMaxTryReached,
        loading,
        guest,
        guestCount,
        guestLeft: Math.max(0, MAX_GUEST_TRIES - guestCount),
        incrementGuestCount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/* ------------------ hook ------------------ */
export const useUser = () => useContext(UserContext);
