"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
 import api from "../../lib/api.js"
import { createDpopProof } from "../../lib/deviceKey";



const UserContext = createContext({
  user: null as any,
  isLogin: false,
  isGuest: false,
  isMaxTryReached: false,
  loading: true,
  guest: null as any,
  guestCount: 0,
  guestLeft: 3,
  incrementGuestCount: () => {},
  refreshAuth: null as any
  
});

const MAX_GUEST_TRIES = 3;

function generateGuestId() {
  return "guest_" + crypto.randomUUID();
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false); // 

  const [isGuest, setIsGuest] = useState(false);
  const [isMaxTryReached, setIsMaxTryReached] = useState(false);
  const [guest, setGuest] = useState<any>(null);
  const [guestCount, setGuestCount] = useState(0);

  const pathname = usePathname();
  const PUBLIC_ROUTES = ["/about"];
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  /* ================= AUTH CHECK (OLD VERSION COMMENTED OUT) ================= 
     let cancelled = false;

     const checkAuth = async () => {
       setLoading(true);


       try {
         const res = await api.post("/auth/verify_token");

         if (cancelled) return;

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
         setUser(null);
         setIsLogin(false);
       } finally {
         if (!cancelled) {
           setAuthChecked(true); //  auth decision made
           setLoading(false);
         }
       }
     };
  ======================================================================== */

  /* ================= NEW AUTH2 CHECK WITH REFRESH & DPoP ================= */
  let cancelled = false;

  const attemptRefresh = async () => {
    try {
      let headers = {};
      try {
        const refreshUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth2/refresh`;
        const dpopProof = await createDpopProof(refreshUrl, "POST");
        headers = { "dpop-proof": dpopProof };
      } catch (dpopErr) {
        console.warn("Could not create DPoP proof for session refresh:", dpopErr);
      }

      const refreshRes = await api.post("/auth2/refresh", {}, { headers });
      if (refreshRes.data?.success) {
        const retryRes = await api.post("/auth2/me");
        if (retryRes.data?.success) {
          setUser(retryRes.data.user);
          setIsLogin(true);
          setIsGuest(false);
          setIsMaxTryReached(false);
          return true;
        }
      }
      setUser(null);
      setIsLogin(false);
      return false;
    } catch (err) {
      setUser(null);
      setIsLogin(false);
      return false;
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth2/me");

      if (cancelled) return;

      if (res.data?.success) {
        setUser(res.data.user);
        setIsLogin(true);
        setIsGuest(false);
        setIsMaxTryReached(false);
      } else {
        await attemptRefresh();
      }
    } catch (err) {
      await attemptRefresh();
    } finally {
      if (!cancelled) {
        setAuthChecked(true);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isPublicRoute) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }

    checkAuth();
  }, [pathname, isPublicRoute]);

 
  /* ================= GUEST MODE (FALLBACK) ================= */
  useEffect(() => {
    //  WAIT until auth is checked
    if (!authChecked || isLogin) return;

    let guestId = localStorage.getItem("guestId");

    if (!guestId) {
      guestId = generateGuestId();
      localStorage.setItem("guestId", guestId);
      localStorage.setItem("guestQuizCount", "0");
    }

    const storedCount = Number(localStorage.getItem("guestQuizCount") || 0);

    setGuest({ id: guestId });
    setGuestCount(storedCount);

    if (storedCount < MAX_GUEST_TRIES) {
      setIsGuest(true);
      setIsMaxTryReached(false);
    } else {
      setIsGuest(false);
      setIsMaxTryReached(true);
    }
  }, [authChecked, isLogin]);

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
        refreshAuth: checkAuth, //  NEW
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
  