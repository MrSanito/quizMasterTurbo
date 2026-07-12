// auth.services.ts
import jwt from "jsonwebtoken";
import type { Response } from "express";
import crypto from "crypto";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// ─── Token generation ────────────────────────────────────────────────────────

export function generateAccessToken(
  userId: string,
  sessionId: string,
  familyId: string,
  res: Response,
) {
  const token = jwt.sign(
    { userId, sessionId, familyId },
    ACCESS_SECRET,
    { expiresIn: "15m" },
  );
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });
  return token;
}


export function verifyAccessToken(
  token: string,
): { userId: string; sessionId: string; familyId: string } | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as any;
  } catch {
    return null;
  }
}


export function generateRefreshToken(
  userId: string,
  sessionId: string,
  familyId: string,
): string {
  return jwt.sign(
    { userId, sessionId, familyId },
    REFRESH_SECRET,
    { expiresIn: "7d" },
  );
}

 

export function verifyRefreshToken(
  token: string,
): { userId: string; sessionId: string; familyId: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as any;
  } catch {
    return null;
  }
}

// ─── Redis key helpers (one place, never mistype) ────────────────────────────

export const rtKey = (userId: string, familyId: string, sessionId: string) =>
  `rt:${userId}:${familyId}:${sessionId}`;


// REDIS Family Id to check 
export const familyKey = (familyId: string) => `family:${familyId}`;


// OTP Key while verifying the Regitration 
export const otpKey = (email: string) => `otp:${email}`;


//User Cache to Verify it 
export const userCacheKey = (userId: string) => `user:${userId}`;

// ─── PoP helpers ─────────────────────────────────────────────────────────────

/**
 * Compute JWK thumbprint: SHA-256 of the canonical JSON of the key.
 * RFC 7638 — only required members, lexicographically sorted.
 */
export async function computeJwkThumbprint(jwk: {
  kty: string;
  crv: string;
  x: string;
  y: string;
}): Promise<string> {
  const canonical = JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  }); // keys must be sorted — crv < kty < x < y ✓
  console.log("canonical", canonical)

  /* This return line converts this {
  "kty":"EC",
  "crv":"P-256",
  "x":"...",
  "y":"..."
  
  to a 64 character hexadecimanl string for the convinence so we can reduce the action and 
  get better flexibility with handling

} */

  return crypto.createHash("sha256").update(canonical).digest("hex");
}

/**
 * Verify a DPoP proof JWT sent by the client in the DPoP-Proof header.
 * The client signed it with their private key; we verify with the stored public key.
 *
 * Returns true if valid, false otherwise.
 */
export async function verifyDpopProof(opts: {
  proofJwt: string;           // raw JWT from DPoP-Proof header
  publicKeyJwk: object;       // stored full JWK (with x, y, crv, kty)
  expectedMethod: string;     // "POST"
  expectedUrl: string;        // full URL of this endpoint
  jtiCache: {                 // pass redis client here for replay prevention
    has: (jti: string) => Promise<boolean>;
    set: (jti: string) => Promise<void>;
  };
}): Promise<boolean> {
  try {
    const { proofJwt, publicKeyJwk, expectedMethod, expectedUrl, jtiCache } =
      opts;

    // Import the public key (Node 18+)
    const key = await crypto.subtle.importKey(
      "jwk",
      publicKeyJwk as JsonWebKey,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );

    // Split and decode JWT without verification first to get header+payload
    const [headerB64, payloadB64, sigB64] = proofJwt.split(".");
    if (!headerB64 || !payloadB64 || !sigB64) return false;

    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString(),
    );

    // 1. Check clock skew (±30 seconds)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - payload.iat) > 30) return false;

    // 2. Check method and URL match
    if (payload.htm !== expectedMethod) return false;
    if (payload.htu !== expectedUrl) return false;

    // 3. Replay prevention — jti must be unique
    if (await jtiCache.has(payload.jti)) return false;

    // 4. Verify signature
    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(sigB64, "base64url");

    const valid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      signature,
      Buffer.from(signingInput),
    );

    if (!valid) return false;

    // Mark jti as used (prevent replay) — 60s is enough
    await jtiCache.set(payload.jti);

    return true;
  } catch {
    return false;
  }
}
