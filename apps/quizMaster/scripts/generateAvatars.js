import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Required to fix __dirname

import { createAvatar } from "@dicebear/core";
import { toonHead } from "@dicebear/collection"; // Changed 'toon' to 'avataaars'

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seeds = [
  "alpha",
  "bravo",
  "charlie",
  "delta",
  "echo",
  "foxtrot",
  "gamma",
  "hero",
  "joker",
  "knight",
];

const avatarsDir = path.join(__dirname, "../public/avatars");

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

seeds.forEach((seed, index) => {
  // Use the imported style here (avataaars)
  const avatar = createAvatar(toonHead, {
    seed: seed,
    // You can add style-specific options here, e.g.:
    // radius: 50,
    // backgroundColor: ["b6e3f4","c0aede","d1d4f9"],
  });
 
 
  const svg = avatar.toString();
  fs.writeFileSync(path.join(avatarsDir, `avatar${index + 1}.svg`), svg);
});

console.log("Avatars generated successfully 🎉");
