import { z } from "zod"

export const RegisterSchema = z.object({
    firstName: z.string().min(3, "First must be at least 3 characters long"),
    lastName: z.string().min(3, "Last must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    username: z.string().min(3, "username must be at least 3 characters long"),
});

export type RegisterSchema = z.infer<typeof RegisterSchema>;


export const ValidateRegisterSchema = z.object({
     token: z.string().min(6, "Token must be at least 6 characters long"),
});

export type ValidateRegisterSchema = z.infer<typeof ValidateRegisterSchema>;



// Device context — sent by client at login
export const DeviceContextSchema = z.object({
  browser: z.string().optional(),
  os: z.string().optional(),
  deviceType: z.enum(["mobile", "desktop", "tablet", "unknown"]).optional(),
  deviceName: z.string().optional(),
  // Public JWK the client generated (P-256). Server stores thumbprint.
  publicKeyJwk: z
    .object({
      kty: z.literal("EC"),
      crv: z.literal("P-256"),
      x: z.string(),
      y: z.string(),
    })
    .optional(),
});

export type DeviceContextSchema = z.infer<typeof DeviceContextSchema>


export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
export type LoginSchema = z.infer<typeof LoginSchema>;

export const ValidateLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Otp must be 6 digits long"),
  ...DeviceContextSchema.shape, // flatten device fields in
});
export type ValidateLoginSchema = z.infer<typeof ValidateLoginSchema>;


// Sent as DPoP-Proof header on /refresh
export const DpopProofSchema = z.object({
  jti: z.string().min(16),        // unique nonce per request
  iat: z.number(),                 // issued at (unix seconds)
  htm: z.literal("POST"),          // HTTP method
  htu: z.string().url(),           // full URL of this request
});

export type DpopProofSchema = z.infer<typeof DpopProofSchema>