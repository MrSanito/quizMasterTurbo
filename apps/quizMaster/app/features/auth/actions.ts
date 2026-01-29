"use client";

import axios from "axios";
import { editSchema, loginSchema, registerSchema } from "./schema";
import { unstable_noStore as noStore } from "next/cache";
// import { cookies } from "next/headers";
import { redirect } from "next/navigation";
  
export type RegisterActionState = {
  success: boolean;
  message?: string;
  errors?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
    general?: string;
  };
  data?: {
    firstName?: FormDataEntryValue | null;
    lastName?: FormDataEntryValue | null;
    username?: FormDataEntryValue | null;
    email?: FormDataEntryValue | null;
  };
};

// 🔹 LOGIN
export type LoginActionState = {
  success: boolean;
  message?: string;
  errors?: {
    email?: string;
    password?: string;
    general?: string;
  };
};

export type EditUserFormState = {
  success: boolean;
  errors?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
    general?: string;
  };
  message?: string;
  data?: string;
};

export async function registerAction(
  _prev: RegisterActionState | null,
  formData: FormData,
): Promise<RegisterActionState> {
  noStore(); // 🔥 THIS IS THE MAGIC LINE

  // 1️⃣ Extract form data
  const rawData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  };
  console.log("rawdata", rawData);

  // 2️⃣ Zod validation
  const parsed = registerSchema.safeParse(rawData);
  console.log("parsed", parsed);

  if (!parsed.success) {
    const errors: Record<string, string> = {};

    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0] as string;
      errors[key] = issue.message;
    });
    console.log("errors", errors);

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
  _prev: LoginActionState | null,
  formData: FormData,
): Promise<LoginActionState> {
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
      },
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
        token.substring(0, 20) + "...",
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
    },
  );

  console.log("response data", res.data);
  return res.data;
}




export async function editUser(
  prevState: EditUserFormState,
  formData: FormData,
): Promise<EditUserFormState> {
  const rawData = {
    id: formData.get("id") as string,
    username: formData.get("username") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    avatar: formData.get("avatar") as string,
  };

  const parsed = editSchema.safeParse(rawData);

  if (!parsed.success) {
    const errors: EditUserFormState["errors"] = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0] as keyof EditUserFormState["errors"];
      errors[key] = issue.message;
    });
    return { success: false, errors };
  }

  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/edit`,
      parsed.data,
    );

    const data = res.data;

    if (!data.success) {
      return {
        success: false,
        message: data?.message ?? "Edit failed",
      };
    }

    // ✅ SUCCESS MESSAGE SENT TO UI
    return {
      success: true,
      message: "Profile updated successfully 🎉",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message ?? "editing failed",
      errors: { general: "Something went wrong." },
    };
  }
}
