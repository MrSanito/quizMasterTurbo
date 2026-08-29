import path from "node:path";
import { config } from "dotenv";

// 1. Load local apps/ws/.env if present
config({ path: path.resolve(process.cwd(), ".env") });
// 2. Fallback to root .env
config({ path: path.resolve(process.cwd(), "../../.env") });
