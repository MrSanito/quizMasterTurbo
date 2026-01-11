"use client";

import axios from "axios";
import { loginSchema, registerSchema } from "./schema";
import { unstable_noStore as noStore } from "next/cache";
// import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

      withCredentials: true, // 🔥 VERY IMPORTANT
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
  console.log("I am running in the browser");
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // 2️⃣ Zod validation
  const parsed = loginSchema.safeParse(rawData);
  let shouldRedirect = false;

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
    const { email, password } = rawData;

    const res = await axios.post(
      `${API_URL}/auth/login`,
      {
        email,
        password,
      },
      {
        withCredentials: true, // 🔥 VERY IMPORTANT
      }
    );
    console.log("response from login", res);
    const data = res.data;

    // ❌ Backend rejected login
    if (!data.success) {
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

      // const cookieStore = await cookies();
      // const isProd = process.env.NODE_ENV === "production";

      // Match Express server cookie settings exactly
      // cookieStore.set("token", token, {
      //   httpOnly: true,
      //   secure: isProd,
      //   sameSite: isProd ? "none" : "lax",
      //   path: "/",
      //   maxAge: 7 * 24 * 60 * 60,
      // });

      // cookieStore.set("hasSession", "true", {
      //   httpOnly: false,
      //   secure: isProd,
      //   sameSite: isProd ? "none" : "lax",
      //   path: "/",
      //   maxAge: 7 * 24 * 60 * 60,
      // });

      console.log("✅ Cookie set successfully");
      shouldRedirect = true; // Flag success instead of redirecting here
    } else {
      console.warn("⚠️ No token in response:", data);
    }

    return {
      success: true,
      message: data?.message ?? "Login successfully",
    };
  } catch (err: any) {
    console.log("❌ EXPRESS FAILED", err);

    if (axios.isAxiosError(err)) {
      return {
        success: false,
        message:
          err.response?.data?.message ?? "Backend error. Please try again.",
      };
    }

    // return {
    //   success: false,
    //   message: "Server not reachable Login failed",
    // };
  }
  // 🔥 Run redirect AFTER the try/catch block
  if (shouldRedirect) {
    redirect("/dashboard");
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

// export async function logOut() {
//   const cookieStore = await cookies();
//   cookieStore.delete("token"); // auth token
//   cookieStore.delete("hasSession"); // hasSession
//   console.log("logout done");
//   return { success: true };
// }
