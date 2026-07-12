import { get, set } from "idb-keyval";
import {UAParser} from "ua-parser-js";


export async function getOrCreateDeviceKeyPair(): Promise<{
  publicKeyJwk: JsonWebKey;
}> {
  const existing = await get("device-keypair");
  if (existing) return existing;

  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,                        // extractable — we need to export public key
    ["sign", "verify"],
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  // Private key stays in IndexedDB, NEVER sent to server
  await set("device-keypair", { keyPair, publicKeyJwk });

  return { publicKeyJwk };
}


export async function createDpopProof(url: string, method: string): Promise<string> {
  const stored = await get("device-keypair");
  if (!stored) throw new Error("No device key pair found");

  const { keyPair } = stored;

  const header = { alg: "ES256", typ: "dpop+jwt" };
  const payload = {
    jti: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    htm: method,
    htu: url,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keyPair.privateKey,
    new TextEncoder().encode(signingInput),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${signingInput}.${sigB64}`;
}

export function getDeviceFingerprint(): string {
  // Collected passively — no prompts needed
  const signals = [
    navigator.userAgent,
    navigator.language,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}`,
    String(navigator.hardwareConcurrency),
    navigator.platform,
  ].join("|");

  // SHA-256 via SubtleCrypto (returns a promise — call at login time)
  return signals; // hash this async before sending
}

export function GetDeviceDetails () : any {
const parser = new UAParser();
const result = parser.getResult();
return result;

}