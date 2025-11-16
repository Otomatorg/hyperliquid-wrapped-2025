// computePointStats.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- __dirname for ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- File path ----
const INPUT_FILE = path.join(__dirname, "points.json");

// ---- Load data ----
const raw = fs.readFileSync(INPUT_FILE, "utf8");
const points = JSON.parse(raw);

if (!Array.isArray(points)) {
  console.error("❌ points.json must be an array of objects");
  process.exit(1);
}

// ---- Protocol keys (excluding address) ----
const PROTOCOL_KEYS = Object.keys(points[0]).filter(k => k !== "address");

// ---- Counters ----
const protocolCounts = {};
for (const key of PROTOCOL_KEYS) {
  protocolCounts[key] = 0;
}

let noPointsCount = 0;

// ---- Count logic ----
for (const entry of points) {
  let hasAnyPoints = false;

  for (const key of PROTOCOL_KEYS) {
    const val = Number(entry[key] || 0);

    if (val > 0) {
      protocolCounts[key]++;
      hasAnyPoints = true;
    }
  }

  if (!hasAnyPoints) {
    noPointsCount++;
  }
}

// ---- Print results ----
console.log("\n===== POINT STATS =====");

for (const key of PROTOCOL_KEYS) {
  console.log(`${key}: ${protocolCounts[key]} addresses`);
}

console.log(`\nAddresses with NO points: ${noPointsCount}`);

console.log("=========================\n");