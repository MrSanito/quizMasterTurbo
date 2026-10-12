// deviceKey.ts  — runs once per device, persists in IndexedDB via idb-keyval

import { get, set } from "idb-keyval";
import { UAParser } from "ua-parser-js";

export async function getOrCreateDeviceKeyPair(): Promise<{
	publicKeyJwk: JsonWebKey;
} | null> {
	if (typeof window === "undefined") {
		return null;
	}

	const existing = await get("device-keypair");
	if (existing) return existing;

	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true, // extractable — we need to export public key
		["sign", "verify"],
	);

	const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
	// Private key stays in IndexedDB, NEVER sent to server
	await set("device-keypair", { keyPair, publicKeyJwk });

	return { publicKeyJwk };
}

export async function createDpopProof(
	url: string,
	method: string,
): Promise<string> {
	if (typeof window === "undefined") {
		throw new Error(
			"createDpopProof can only be run in client/browser environment",
		);
	}

	const stored = await get("device-keypair");
	if (!stored) throw new Error("No device key pair found");

	const { keyPair } = stored;

	const header = { alg: "ES256", typ: "dpop+jwt" };
	const payload = {
		jti:
			typeof crypto.randomUUID === "function"
				? crypto.randomUUID()
				: Math.random().toString(36).substring(2),
		iat: Math.floor(Date.now() / 1000),
		htm: method,
		htu: url,
	};

	const encode = (obj: object) =>
		btoa(JSON.stringify(obj))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");

	const signingInput = `${encode(header)}.${encode(payload)}`;

	const signature = await crypto.subtle.sign(
		{ name: "ECDSA", hash: "SHA-256" },
		keyPair.privateKey,
		new TextEncoder().encode(signingInput),
	);

	const signatureArray = new Uint8Array(signature);
	let binary = "";
	for (let i = 0; i < signatureArray.byteLength; i++) {
		binary += String.fromCharCode(signatureArray[i]);
	}
	const sigB64 = btoa(binary)
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	return `${signingInput}.${sigB64}`;
}

export async function getDeviceFingerprint(): Promise<string> {
	// Collected passively — no prompts needed
	const signals = [
		typeof navigator !== "undefined" ? navigator.userAgent : "",
		typeof navigator !== "undefined" ? navigator.language : "",
		typeof Intl !== "undefined"
			? Intl.DateTimeFormat().resolvedOptions().timeZone
			: "",
		typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "",
		typeof navigator !== "undefined"
			? String(navigator.hardwareConcurrency)
			: "",
		typeof navigator !== "undefined" ? navigator.platform : "",
	].join("|");

	// SHA-256 via SubtleCrypto (returns a promise — call at login time)
	if (typeof window === "undefined" || !crypto?.subtle) {
		return signals;
	}

	const msgUint8 = new TextEncoder().encode(signals);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hashHex;
}

export function getBrowserAndOS(): {
	browser: string;
	os: string;
	deviceType: "mobile" | "desktop" | "tablet" | "unknown";
	deviceName: string;
} {
	if (typeof window === "undefined" || typeof navigator === "undefined") {
		return {
			browser: "Unknown Browser",
			os: "Unknown OS",
			deviceType: "unknown",
			deviceName: "Unknown Device",
		};
	}

	const ua = navigator.userAgent;

	try {
		const parser = new UAParser(ua);
		const res = parser.getResult();

		let browser = res.browser.name || "";
		let os = res.os.name || "";
		let deviceType: "mobile" | "desktop" | "tablet" | "unknown" = "desktop";

		if (res.device.type === "mobile") {
			deviceType = "mobile";
		} else if (res.device.type === "tablet") {
			deviceType = "tablet";
		} else if (
			/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(
				ua,
			)
		) {
			deviceType = "mobile";
		} else if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) {
			deviceType = "tablet";
		} else {
			deviceType = "desktop";
		}

		// Fallback browser detection
		if (!browser) {
			if (/firefox|fxios/i.test(ua)) browser = "Firefox";
			else if (/samsungbrowser/i.test(ua)) browser = "Samsung Browser";
			else if (/opr|opera/i.test(ua)) browser = "Opera";
			else if (/edg/i.test(ua)) browser = "Edge";
			else if (/chrome|crios/i.test(ua)) browser = "Chrome";
			else if (/safari/i.test(ua)) browser = "Safari";
			else browser = "Unknown Browser";
		}

		// Fallback OS detection
		if (!os) {
			if (/windows nt/i.test(ua)) os = "Windows";
			else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
			else if (/android/i.test(ua)) os = "Android";
			else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
			else if (/linux/i.test(ua)) os = "Linux";
			else os = "Unknown OS";
		}

		// Friendly device name
		let deviceName = res.device.model || "";
		if (!deviceName) {
			if (os === "Windows") deviceName = "Windows PC";
			else if (os === "macOS") deviceName = "Macintosh";
			else if (os === "Linux") deviceName = "Linux Device";
			else if (os === "iOS") deviceName = /ipad/i.test(ua) ? "iPad" : "iPhone";
			else if (os === "Android") deviceName = "Android Device";
			else deviceName = `${browser} on ${os}`;
		}

		return { browser, os, deviceType, deviceName };
	} catch {
		return {
			browser: "Unknown Browser",
			os: "Unknown OS",
			deviceType: "desktop",
			deviceName: "Unknown Device",
		};
	}
}
