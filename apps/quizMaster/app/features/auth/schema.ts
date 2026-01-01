import { z } from "zod";

/* ---------------- REGISTER ---------------- */

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters"),

  email: z.string().email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/* ---------------- LOGIN ---------------- */

export const loginSchema = z.object({
  email: z.string().email("Invalid email or password"), // 👈 security best practice

  password: z.string().min(8, "Invalid email or password"),
});


