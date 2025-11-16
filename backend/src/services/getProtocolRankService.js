import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

// --- __dirname ESM equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the points JSON file
const POINTS_FILE_PATH = path.resolve(
  __dirname,
  "../../../src/points.json"
);

// Cache for sorted points arrays per protocol (loaded once)
// Structure: { protocolName: sortedArray }
const sortedPointsCache = {};
// Cache for total counts per protocol
// Structure: { protocolName: totalCount }
const totalCountsCache = {};

/**
 * Load and cache the sorted points arrays for all protocols.
 * This is called once on first use.
 */
async function loadPointsData() {
  // Check if already loaded (we can check any protocol)
  if (Object.keys(sortedPointsCache).length > 0) {
    return; // Already loaded
  }

  try {
    console.log("📊 Loading points data from JSON file...");
    const fileContent = await fs.readFile(POINTS_FILE_PATH, "utf-8");
    const pointsData = JSON.parse(fileContent);

    if (!Array.isArray(pointsData)) {
      throw new Error("points.json must be an array of objects");
    }

    // Get all protocol names (excluding "address")
    const sample = pointsData[0] || {};
    const protocolNames = Object.keys(sample).filter((k) => k !== "address");

    // For each protocol, collect and sort all non-zero point values
    for (const protocol of protocolNames) {
      const values = [];
      for (const entry of pointsData) {
        const raw = entry[protocol];
        if (raw == null) continue;

        const v = Number(raw);
        if (!Number.isFinite(v)) continue;

        // Only consider users with >0 points for ranking
        if (v > 0) {
          values.push(v);
        }
      }

      // Sort in descending order (highest points first = rank 1)
      values.sort((a, b) => b - a);
      sortedPointsCache[protocol] = values;
      totalCountsCache[protocol] = values.length;
    }

    const totalProtocols = Object.keys(sortedPointsCache).length;
    console.log(
      `✅ Loaded points data for ${totalProtocols} protocols.`
    );
  } catch (error) {
    console.error(`❌ Error loading points data: ${error.message}`);
    throw new Error(`Failed to load points data: ${error.message}`);
  }
}

/**
 * Get the rank and percentile for a given protocol and points value.
 * 
 * @param {string} protocol - The protocol name (e.g., "hyperlend", "felix")
 * @param {number} pointsValue - The points value to get the rank for
 * @returns {Promise<object>} - Object containing rank information
 *   - rank: number - The rank (1 = highest points, higher number = lower points)
 *   - totalWithPoints: number - Total number of addresses with >0 points for this protocol
 *   - percentile: number - Percentile (0-100, where 100 = highest points)
 *   Returns null if protocol not found or no users with points
 */
export async function getProtocolRankForPoints(protocol, pointsValue) {
  // Ensure data is loaded
  await loadPointsData();

  if (!protocol) {
    throw new Error("Protocol name is required");
  }

  if (typeof pointsValue !== "number" || !Number.isFinite(pointsValue)) {
    throw new Error("Points value must be a finite number");
  }

  // Check if protocol exists
  if (!(protocol in sortedPointsCache)) {
    return null; // Protocol not found
  }

  const sortedValues = sortedPointsCache[protocol];
  const totalWithPoints = totalCountsCache[protocol];

  if (totalWithPoints === 0 || sortedValues.length === 0) {
    return null; // No users with points for this protocol
  }

  // Calculate rank: rank = number of addresses with points > given points + 1
  // Rank 1 = highest points, rank totalWithPoints = lowest points
  
  let rank;
  
  // If points is higher than all others, rank is 1
  if (pointsValue > sortedValues[0]) {
    rank = 1;
  }
  // If points is 0 or lower than all others, rank is totalWithPoints + 1
  else if (pointsValue <= 0 || pointsValue < sortedValues[sortedValues.length - 1]) {
    rank = totalWithPoints + 1;
  }
  // Otherwise, count how many have strictly greater points
  else {
    let countGreater = 0;
    for (let i = 0; i < sortedValues.length; i++) {
      if (sortedValues[i] > pointsValue) {
        countGreater++;
      } else {
        // Since array is sorted descending, we can break here
        break;
      }
    }
    rank = countGreater + 1;
  }

  // Calculate percentile (inverse of rank percentage)
  // Higher points = better percentile
  // For rank = totalWithPoints + 1 (0 points), percentile should be 0
  let percentile;
  if (rank > totalWithPoints) {
    percentile = 0;
  } else {
    percentile = ((totalWithPoints - rank + 1) / totalWithPoints) * 100;
  }
  // Cap percentiles at 0.01 instead of allowing 99.9+
  if (percentile >= 99.9) {
    percentile = 0.01;
    // Round to 2 decimal places to preserve 0.01
    return {
      rank,
      totalWithPoints,
      percentile: 0.01,
    };
  }
  const percentileRounded = Math.round(percentile * 10) / 10;

  return {
    rank,
    totalWithPoints,
    percentile: percentileRounded,
  };
}

