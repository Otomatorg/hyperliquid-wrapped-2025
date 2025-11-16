// getProtocolRank.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- __dirname for ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
// points.json is in src/ directory (2 levels up from backend/src/services/)
const POINTS_FILE = path.resolve(__dirname, "../../../src/points.json");

// ---- Helper: load points.json ----
function loadPoints() {
  if (!fs.existsSync(POINTS_FILE)) {
    console.error(`❌ points.json not found at ${POINTS_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(POINTS_FILE, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to parse points.json:", err.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error("❌ points.json must be an array of objects");
    process.exit(1);
  }

  return data;
}

// ---- Main logic ----
function main() {
  const [, , protocolArg, pointsArg] = process.argv;

  if (!protocolArg || !pointsArg) {
    console.error(
      "Usage: node getProtocolRank.js <protocolName> <pointsAmount>"
    );
    console.error('Example: node getProtocolRank.js hyperlend 15224.253');
    process.exit(1);
  }

  const protocol = protocolArg;
  const targetPoints = Number(pointsArg);

  if (!Number.isFinite(targetPoints)) {
    console.error(`❌ Invalid points amount: "${pointsArg}"`);
    process.exit(1);
  }

  const pointsData = loadPoints();

  // Check protocol exists in data
  const sample = pointsData[0] || {};
  if (!(protocol in sample)) {
    console.error(
      `❌ Protocol "${protocol}" not found in points.json keys.\n` +
        `Available keys (excluding "address") are: ${Object.keys(sample)
          .filter((k) => k !== "address")
          .join(", ")}`
    );
    process.exit(1);
  }

  // Collect all non-zero point values for that protocol
  const values = [];
  for (const entry of pointsData) {
    const raw = entry[protocol];
    if (raw == null) continue;

    const v = Number(raw);
    if (!Number.isFinite(v)) continue;

    // Only consider users with >0 points for ranking
    if (v > 0) values.push(v);
  }

  if (!values.length) {
    console.log(
      `No addresses with > 0 points for protocol "${protocol}". Rank is undefined.`
    );
    return;
  }

  // Sort descending (highest points = rank 1)
  values.sort((a, b) => b - a);

  // Competition-style rank: 1 + number of users strictly above target
  let higherCount = 0;
  for (const v of values) {
    if (v > targetPoints) higherCount++;
    else break; // since sorted desc
  }

  const rank = higherCount + 1;
  const total = values.length;

  // "Top X%" from the top (rank 1 = best)
  const topPercent = (rank / total) * 100;

  const result = {
    protocol,
    points: targetPoints,
    rank,
    totalWithPoints: total,
    topPercent: topPercent,
    topPercentLabel: `top ${topPercent.toFixed(2)}%`,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();