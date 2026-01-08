"use server";

import axios from "axios";
import { loginSchema, registerSchema } from "./schema";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";

type ActionResponse = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  data?: any;
};

export async function registerAction(
  _prev: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  noStore(); // 🔥 THIS IS THE MAGIC LINE

  // 1️⃣ Extract form data
  const rawData = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // 2️⃣ Zod validation
  const parsed = registerSchema.safeParse(rawData);

  if (!parsed.success) {
    const errors: Record<string, string> = {};

    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0] as string;
      errors[key] = issue.message;
    });

    return {
      success: false,
      errors,
      data: rawData, // so user input doesn’t vanish
    };
  }

  // 3️⃣ Proxy to Express
  try {
    console.log("🔥 PROXYING TO EXPRESS");
    console.log("process env", process.env.NEXT_PUBLIC_API_BASE_URL);
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    const res = await axios.post(`${API_URL}/auth/register`, parsed.data, {
      timeout: 3000,
    });

    console.log(res.data);
    return {
      success: true,
      message:
        res.data?.message ??
        "Account created successfully ho gaya bhai ho gaya",
    };
  } catch (err: any) {
    console.log("❌ EXPRESS FAILED");

    if (axios.isAxiosError(err)) {
      return {
        success: false,
        message:
          err.response?.data?.message ?? "Backend error. Please try again.",
      };
    }

    return {
      success: false,
      message: "Server not reachable",
    };
  }
}

export async function loginAction(
  _prev: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  noStore(); // Prevent caching issues with cookies

  // 1️⃣ Extract form data
  const rawData = {
     email: formData.get("email"),
    password: formData.get("password"),
  };

  // 2️⃣ Zod validation
  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    const errors: Record<string, string> = {};

    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0] as string;
      errors[key] = issue.message;
    });

    return {
      success: false,
      errors,
    };
  }

  // 3️⃣ Proxy to Express
  try {
    console.log("🔥 PROXYING TO EXPRESS");

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!API_URL) {
      return {
        success: false,
        message: "API URL not configured",
      };
    }

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      // Note: credentials: "include" doesn't help in server-to-server requests
      // but we'll manually set the cookie from the response token
    });

    const data = await res.json();

    // ❌ Backend rejected login
    if (!res.ok) {
      return {
        success: false,
        message: data?.message ?? "Login failed",
      };
    }

    // ✅ Set cookie from token in response body
    // This is necessary because server-to-server fetch doesn't forward Set-Cookie to browser
    const token = data?.data?.token || data?.token;
    const hasSession = data?.data?.hasSession || data?.hasSession;

    if (token) {
      console.log(
        "🍪 Setting cookie with token:",
        token.substring(0, 20) + "..."
      );

      const cookieStore =  await cookies();

      // Match Express server cookie settings exactly
      cookieStore.set("token", token, {
        httpOnly: true,
        secure: false, // Match Express: false for localhost, true in production
        sameSite: "lax", // Match Express
        path: "/", // Match Express
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds (Express uses milliseconds, but Next.js expects seconds)
      });

      cookieStore.set("hasSession", "true", {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      console.log("✅ Cookie set successfully");
    } else {
      console.warn("⚠️ No token in response:", data);
    }

    return {
      success: true,
      message: data?.message ?? "Login successfully",
    };
  } catch (err: any) {
    console.log("❌ EXPRESS FAILED");

    if (axios.isAxiosError(err)) {
      return {
        success: false,
        message:
          err.response?.data?.message ?? "Backend error. Please try again.",
      };
    }

    return {
      success: false,
      message: "Server not reachable",
    };
  }
}

export async function checkUsername(username: string) {
  if (!username) return null;
  console.log("api link url", process.env.NEXT_PUBLIC_API_BASE_URL);
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/check_username`,
    {
      username: username,
    }
  );

  console.log("response data", res.data);
  return res.data;
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete("token"); // auth token
  cookieStore.delete("hasSession"); // hasSession
  console.log("logout done")
  return { success: true };

}
