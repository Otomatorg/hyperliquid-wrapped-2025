import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

// --- __dirname ESM equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Hypercore data JSON file
const HYPERCORE_DATA_FILE_PATH = path.resolve(
  __dirname,
  "../../../src/hypercore/hypercoreVolumeAndTrades.json"
);

// Cache for Hypercore data (loaded once)
let hypercoreDataCache = null;

/**
 * Load and cache the Hypercore data.
 * This is called once on first use.
 */
async function loadHypercoreData() {
  if (hypercoreDataCache !== null) {
    return; // Already loaded
  }

  try {
    console.log("📊 Loading Hypercore data from JSON file...");
    const fileContent = await fs.readFile(HYPERCORE_DATA_FILE_PATH, "utf-8");
    const rawData = JSON.parse(fileContent);
    
    // Normalize all keys to lowercase for consistent lookup
    // This handles both lowercase and checksummed addresses
    hypercoreDataCache = {};
    for (const [key, value] of Object.entries(rawData)) {
      hypercoreDataCache[key.toLowerCase()] = value;
    }
    
    console.log(`✅ Loaded Hypercore data for ${Object.keys(hypercoreDataCache).length} addresses.`);
  } catch (error) {
    console.warn(`⚠️ Error loading Hypercore data: ${error.message}`);
    // Don't throw - return default values if file doesn't exist yet
    hypercoreDataCache = {};
  }
}

/**
 * Format volume in USD to a human-readable string (e.g., "420k $", "1.2M $")
 */
function formatVolume(volumeUSD) {
  if (!volumeUSD || volumeUSD === 0) {
    return "0 $";
  }

  if (volumeUSD >= 1000000) {
    const millions = volumeUSD / 1000000;
    if (millions >= 10) {
      return `${Math.round(millions)}M $`;
    }
    return `${millions.toFixed(1)}M $`;
  }

  if (volumeUSD >= 1000) {
    const thousands = volumeUSD / 1000;
    if (thousands >= 100) {
      return `${Math.round(thousands)}k $`;
    }
    return `${thousands.toFixed(1)}k $`;
  }

  return `${Math.round(volumeUSD)} $`;
}

/**
 * Get Hypercore stats (trades and volume) for a user.
 * 
 * @param {string} address - The user's Ethereum address
 * @returns {Promise<object>} - Object containing Hypercore stats
 *   - trades: number - Total number of trades (0 if not found)
 *   - volume: string - Formatted volume string (e.g., "420k $")
 */
export async function getHypercoreStats(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  // Ensure data is loaded
  await loadHypercoreData();

  // Normalize address to lowercase for lookup (cache is already normalized)
  const normalizedAddress = address.toLowerCase();

  // Get user data from cache (already normalized on load)
  const userData = hypercoreDataCache[normalizedAddress] || null;

  if (!userData || userData.error) {
    // Return default values if user not found or has error
    return {
      trades: 0,
      volume: "0 $",
    };
  }

  const trades = userData.trades || 0;
  const volumeUSD = userData.volumeUSD || 0;
  const volume = formatVolume(volumeUSD);

  return {
    trades,
    volume,
  };
}

