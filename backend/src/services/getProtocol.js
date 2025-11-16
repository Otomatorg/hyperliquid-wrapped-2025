import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

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
 * Get the list of protocols a user has used.
 * 
 * @param {string} address - The user's Ethereum address
 * @returns {Promise<string[]>} - Array of protocol names, or empty array if not found
 */
export async function getProtocol(address) {
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
    return [];
  }

  // Get the protocols array, or empty array if not present
  const protocols = userInfo.protocols || [];

  // If the user has theo points, add "theo" to the protocols list if not already present
  const theoPoints = userInfo.points?.theo;
  if (theoPoints && typeof theoPoints === 'number' && theoPoints > 0) {
    if (!protocols.includes('theo')) {
      protocols.push('theo');
    }
  }

  return protocols;
}

