"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete("token"); // auth token
  cookieStore.delete("hasSession"); // hasSession
  console.log("logout done");
  return { success: true };
}
