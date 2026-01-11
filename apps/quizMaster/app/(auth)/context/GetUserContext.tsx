"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { deleteCookie, getCookie } from "cookies-next";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: `${API_URL}`,
  withCredentials: true,
});

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

const MAX_GUEST_TRIES = 3;

function generateGuestId() {
  return "guest_" + crypto.randomUUID();
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isMaxTryReached, setIsMaxTryReached] = useState(false);
  const [loading, setLoading] = useState(true);

  const [guest, setGuest] = useState(null);
  const [guestCount, setGuestCount] = useState(0);

  const pathname = usePathname();
  const PUBLIC_ROUTES = ["/abFout"];
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const [hasSession, setHasSession] = useState(undefined);


  useEffect(() => {
    console.log("document.cookie:", document.cookie);
    console.log("getCookie:", getCookie("hasSession"));

    const session = getCookie("hasSession");
    console.log(session, "hasSession (client)");
    setHasSession(session);
    let cancelled = false;

    const runAuthFlow = async () => {
      setLoading(true);

      if (isPublicRoute) {
        setLoading(false);
        return;
      }

      if (!hasSession) {
        setUser(null);
        setIsLogin(false);
        setLoading(false);
        return;
      }

      try {
        const res = await api.post("/auth/verify_token");

        if (cancelled) return;

        if (res.data?.success) {
          setUser(res.data.user);
          setIsLogin(true);
          setIsGuest(false);
          setIsMaxTryReached(false);
          setGuest(null);
          localStorage.removeItem("guestId");
          localStorage.removeItem("guestQuizCount");
        } else {
          setUser(null);
          setIsLogin(false);
        }
      } catch {
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
  }, [pathname, hasSession, isPublicRoute]);

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

export const useUser = () => useContext(UserContext);
