"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import api from "../../lib/api.js";

/* ============================================================
 * Types
 * ============================================================ */

interface User {
  id: string;
  [key: string]: any;
}

interface Guest {
  id: string;
}

interface UserContextValue {
  user: User | null;
  isLogin: boolean;
  isGuest: boolean;
  isMaxTryReached: boolean;
  loading: boolean;
  authChecked: boolean;
  guest: Guest | null;
  guestCount: number;
  guestLeft: number;
  incrementGuestCount: () => void;
  refreshAuth: () => Promise<void>;
}

/* ============================================================
 * Constants
 * ============================================================ */

const MAX_GUEST_TRIES = 3;
const PUBLIC_ROUTES = ["/about"];

const STORAGE_KEYS = {
  guestId: "guestId",
  guestQuizCount: "guestQuizCount",
} as const;

/* ============================================================
 * Context
 * ============================================================ */

const UserContext = createContext<UserContextValue>({
  user: null,
  isLogin: false,
  isGuest: false,
  isMaxTryReached: false,
  loading: true,
  authChecked: false,
  guest: null,
  guestCount: 0,
  guestLeft: MAX_GUEST_TRIES,
  incrementGuestCount: () => {},
  refreshAuth: async () => {},
});

/* ============================================================
 * Helpers
 * ============================================================ */

function generateGuestId(): string {
  return `guest_${crypto.randomUUID()}`;
}

/** localStorage can throw in private-browsing / storage-disabled contexts. */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — guest mode just won't persist across reloads.
  }
}

/* ============================================================
 * Provider
 * ============================================================ */

export function UserProvider({ children }: { children: React.ReactNode }) {
  // -- auth state --
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // -- guest state --
  const [isGuest, setIsGuest] = useState(false);
  const [isMaxTryReached, setIsMaxTryReached] = useState(false);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [guestCount, setGuestCount] = useState(0);

  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Guards against stale responses when pathname changes fast, or the
  // effect re-fires before the previous request resolves. Only the most
  // recent call is allowed to commit state.
  const requestIdRef = useRef(0);

  /* ---------------- Auth check ---------------- */

  const checkAuth = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      // api.js interceptor already handles 401 -> DPoP refresh -> retry.
      // Reaching this line means either the token was valid, or the
      // interceptor silently refreshed and retried for us — no manual
      // second attempt needed here.
      const res = await api.post("/auth2/me");
      console.log(res)
      if (requestId !== requestIdRef.current) return; // superseded by a newer call

      if (res.data?.success) {
        setUser(res.data.user);
        setIsLogin(true);
        setIsGuest(false);
        setIsMaxTryReached(false);
      } else {
        setUser(null);
        setIsLogin(false);
      }
    } catch {
      if (requestId !== requestIdRef.current) return;
      // Interceptor already tried refreshing and it still failed.
      setUser(null);
      setIsLogin(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setAuthChecked(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isPublicRoute) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }
    checkAuth();
  }, [pathname, isPublicRoute, checkAuth]);

  /* ---------------- Guest mode (fallback) ---------------- */

  useEffect(() => {
    // Wait for the auth check to finish, skip once logged in, and skip on
    // public routes too — no need to hand out a guest pass there.
    if (!authChecked || isLogin || isPublicRoute) return;

    let guestId = safeGetItem(STORAGE_KEYS.guestId);
    if (!guestId) {
      guestId = generateGuestId();
      safeSetItem(STORAGE_KEYS.guestId, guestId);
      safeSetItem(STORAGE_KEYS.guestQuizCount, "0");
    }

    const storedCount = Number(safeGetItem(STORAGE_KEYS.guestQuizCount) ?? 0);
    setGuest({ id: guestId });
    setGuestCount(storedCount);

    const withinLimit = storedCount < MAX_GUEST_TRIES;
    setIsGuest(withinLimit);
    setIsMaxTryReached(!withinLimit);
  }, [authChecked, isLogin, isPublicRoute]);

  const incrementGuestCount = useCallback(() => {
    if (isLogin) return;

    setGuestCount((prev) => {
      const next = prev + 1;
      safeSetItem(STORAGE_KEYS.guestQuizCount, String(next));

      if (next >= MAX_GUEST_TRIES) {
        setIsGuest(false);
        setIsMaxTryReached(true);
      }
      return next;
    });
  }, [isLogin]);

  /* ---------------- Context value ---------------- */

  const value: UserContextValue = {
    user,
    isLogin,
    isGuest,
    isMaxTryReached,
    loading,
    authChecked,
    guest,
    guestCount,
    guestLeft: Math.max(0, MAX_GUEST_TRIES - guestCount),
    incrementGuestCount,
    refreshAuth: checkAuth,
  };

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
