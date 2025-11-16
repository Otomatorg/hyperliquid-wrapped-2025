import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { getProtocolRankForPoints } from "./getProtocolRankService.js";
import {
  fetchVentualsPoints,
  fetchHybraPoints,
  fetchPrjxPoints,
  fetchUltrasolidPoints,
} from "./platforms.js";

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
 * Calculate percentile from rank and max_rank
 * Formula: percentile = ((max_rank - rank + 1) / max_rank) * 100
 * This gives rank 1 = 100%, rank max_rank = lowest percentile
 */
function calculatePercentile(rank, max_rank) {
  if (typeof rank !== 'number' || typeof max_rank !== 'number' || rank <= 0 || max_rank <= 0) {
    return null;
  }
  let percentile = ((max_rank - rank + 1) / max_rank) * 100;
  // Cap percentiles at 0.01 instead of allowing 99.9+
  if (percentile >= 99.9) {
    return 0.01; // Return 0.01 directly without rounding
  }
  return Math.round(percentile * 10) / 10; // Round to 1 decimal place
}

/**
 * Fetch points from external APIs for ventuals, hybra, prjx, and ultrasolid
 */
async function fetchExternalPoints(address) {
  const externalProtocols = {
    ventuals: fetchVentualsPoints,
    hybra: fetchHybraPoints,
    prjx: fetchPrjxPoints,
    ultrasolid: fetchUltrasolidPoints,
  };

  const results = {};

  // Fetch all external points in parallel
  const promises = Object.entries(externalProtocols).map(async ([protocol, fetchFn]) => {
    try {
      const data = await fetchFn(address);
      if (data.success && data.points > 0) {
        const rank = typeof data.rank === 'number' ? data.rank : null;
        const max_rank = typeof data.max_rank === 'number' ? data.max_rank : null;
        const percentile = rank && max_rank ? calculatePercentile(rank, max_rank) : null;
        
        results[protocol] = {
          point: typeof data.points === 'number' ? data.points : Number(data.points) || 0,
          rank: rank,
          percentile: percentile,
        };
      }
    } catch (error) {
      // Silently skip failed fetches
      console.warn(`⚠️  Could not fetch points for ${protocol}: ${error.message}`);
    }
  });

  await Promise.all(promises);
  return results;
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

  // Normalize address to lowercase
  const normalizedAddress = address.toLowerCase();

  // Fetch external API points in parallel with loading JSON data
  const [externalPoints] = await Promise.all([
    fetchExternalPoints(normalizedAddress),
    loadUserInfoData(),
  ]);

  // Start with external points
  const result = { ...externalPoints };

  // Look up the user in the cache
  const userInfo = userInfoCache[normalizedAddress];

  if (userInfo) {
    // Get the raw points object from JSON
    const rawPoints = userInfo.points || {};
    
    // Merge JSON points with external points (external points take precedence if both exist)
    for (const [protocol, pointsValue] of Object.entries(rawPoints)) {
      // Skip if we already have this protocol from external API
      if (result[protocol]) {
        continue;
      }

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
  }

  // For external points, try to get rank/percentile if we have points but no rank
  for (const [protocol, data] of Object.entries(result)) {
    if (data.point > 0 && data.rank === null && data.percentile === null) {
      try {
        const rankInfo = await getProtocolRankForPoints(protocol, data.point);
        if (rankInfo) {
          data.rank = rankInfo.rank;
          data.percentile = rankInfo.percentile;
        }
      } catch (error) {
        // If ranking fails, keep rank and percentile as null
        console.warn(`⚠️  Could not get rank for protocol ${protocol}: ${error.message}`);
      }
    }
  }

  return result;
}

