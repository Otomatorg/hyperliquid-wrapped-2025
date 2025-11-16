import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { getProtocolRankForPoints } from "./getProtocolRankService.js";

// --- __dirname ESM equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the userInfo JSON file
const USER_INFO_FILE_PATH = path.resolve(
  __dirname,
  "../data/userInfo.json"
);

// Cache for userInfo data (loaded once)
let userInfoCache = null;

/**
 * Load and cache the userInfo data.
 * This is called once on first use.
 */
async function loadUserInfoData() {
  if (userInfoCache !== null) {
    return; // Already loaded
  }

  try {
    console.log("📊 Loading userInfo data from JSON file...");
    const fileContent = await fs.readFile(USER_INFO_FILE_PATH, "utf-8");
    userInfoCache = JSON.parse(fileContent);
    console.log(`✅ Loaded userInfo data for ${Object.keys(userInfoCache).length} addresses.`);
  } catch (error) {
    console.error(`❌ Error loading userInfo data: ${error.message}`);
    throw new Error(`Failed to load userInfo data: ${error.message}`);
  }
}

/**
 * Get the points for a user across all protocols, including rank and percentile.
 * 
 * @param {string} address - The user's Ethereum address
 * @returns {Promise<object>} - Object mapping protocol names to {point, rank, percentile}, or empty object if not found
 *   Each protocol entry has:
 *   - point: number - The points value for this protocol
 *   - rank: number | null - The rank (1 = highest points), or null if not available
 *   - percentile: number | null - The percentile (0-100, where 100 = highest points), or null if not available
 */
export async function getPoints(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  // Ensure data is loaded
  await loadUserInfoData();

  // Normalize address to lowercase for lookup
  const normalizedAddress = address.toLowerCase();

  // Look up the user in the cache
  const userInfo = userInfoCache[normalizedAddress];

  if (!userInfo) {
    return {};
  }

  // Get the raw points object
  const rawPoints = userInfo.points || {};
  
  if (Object.keys(rawPoints).length === 0) {
    return {};
  }

  // Build result with rank and percentile for each protocol
  const result = {};
  
  for (const [protocol, pointsValue] of Object.entries(rawPoints)) {
    const points = typeof pointsValue === 'number' ? pointsValue : Number(pointsValue);
    
    // Initialize result for this protocol
    result[protocol] = {
      point: points,
      rank: null,
      percentile: null,
    };

    // Get rank and percentile if points > 0
    if (Number.isFinite(points) && points > 0) {
      try {
        const rankInfo = await getProtocolRankForPoints(protocol, points);
        if (rankInfo) {
          result[protocol].rank = rankInfo.rank;
          result[protocol].percentile = rankInfo.percentile;
        }
      } catch (error) {
        // If ranking fails for this protocol, keep rank and percentile as null
        // This can happen if the protocol doesn't exist in the ranking data
        console.warn(`⚠️  Could not get rank for protocol ${protocol}: ${error.message}`);
      }
    }
  }

  return result;
}

