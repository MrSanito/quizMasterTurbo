import { UAParser } from "ua-parser-js";

export interface ParsedUserAgent {
	browser: string;
	os: string;
	deviceType: "mobile" | "desktop" | "tablet" | "unknown";
	deviceName: string;
}

export function parseUserAgent(ua?: string | null): ParsedUserAgent {
	if (!ua || typeof ua !== "string") {
		return {
			browser: "Unknown Browser",
			os: "Unknown OS",
			deviceType: "unknown",
			deviceName: "Unknown Device",
		};
	}

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

		// Fallback for browser if not detected
		if (!browser) {
			if (/firefox|fxios/i.test(ua)) browser = "Firefox";
			else if (/samsungbrowser/i.test(ua)) browser = "Samsung Browser";
			else if (/opr|opera/i.test(ua)) browser = "Opera";
			else if (/edg/i.test(ua)) browser = "Edge";
			else if (/chrome|crios/i.test(ua)) browser = "Chrome";
			else if (/safari/i.test(ua)) browser = "Safari";
			else browser = "Unknown Browser";
		}

		// Fallback for OS if not detected
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
			deviceType: "unknown",
			deviceName: "Unknown Device",
		};
	}
}
