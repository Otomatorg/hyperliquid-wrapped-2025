import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

// --- __dirname ESM equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the nonces JSON file
const NONCES_FILE_PATH = path.resolve(
  __dirname,
  "../data/addressNonces.json"
);

// Cache for sorted nonces array (loaded once)
let sortedNoncesCache = null;
// Hardcoded total addresses for nonce rank calculation
const totalAddresses = 643703;

/**
 * Load and cache the sorted nonces array.
 * This is called once on first use.
 */
async function loadNoncesData() {
  if (sortedNoncesCache !== null) {
    return; // Already loaded
  }

  try {
    console.log("📊 Loading nonces data from JSON file...");
    const fileContent = await fs.readFile(NONCES_FILE_PATH, "utf-8");
    const noncesData = JSON.parse(fileContent);

    // Extract all nonce values into an array
    const nonceValues = Object.values(noncesData);

    // Sort in descending order (highest nonce first = rank 1)
    sortedNoncesCache = nonceValues.sort((a, b) => b - a);

    console.log(`✅ Loaded ${totalAddresses} nonces. Highest: ${sortedNoncesCache[0]}, Lowest: ${sortedNoncesCache[sortedNoncesCache.length - 1]}`);
  } catch (error) {
    console.error(`❌ Error loading nonces data: ${error.message}`);
    throw new Error(`Failed to load nonces data: ${error.message}`);
  }
}

/**
 * Get the rank of a given nonce value.
 * 
 * @param {number} nonceValue - The nonce value to get the rank for
 * @returns {object} - Object containing rank information
 *   - rank: number - The rank (1 = highest nonce, higher number = lower nonce)
 *   - totalAddresses: number - Total number of addresses
 *   - percentile: number - Percentile (0-100, where 100 = highest nonce)
 */
export async function getNonceRank(nonceValue) {
  // Ensure data is loaded
  await loadNoncesData();

  if (typeof nonceValue !== "number" || nonceValue < 0) {
    throw new Error("Nonce value must be a non-negative number");
  }

  // Calculate rank: rank = number of addresses with nonce > given nonce + 1
  // Rank 1 = highest nonce, rank totalAddresses = lowest nonce
  
  let rank;
  
  // If the nonce is higher than all others, rank is 1
  if (nonceValue > sortedNoncesCache[0]) {
    rank = 1;
  }
  // If the nonce is lower than all others, rank is totalAddresses
  else if (nonceValue < sortedNoncesCache[sortedNoncesCache.length - 1]) {
    rank = totalAddresses;
  }
  // Otherwise, find the first position where nonce is less than the given value
  else {
    // Count how many addresses have a nonce strictly greater than the given nonce
    // Rank = count + 1 (because rank 1 is the highest)
    let countGreater = 0;
    for (let i = 0; i < sortedNoncesCache.length; i++) {
      if (sortedNoncesCache[i] > nonceValue) {
        countGreater++;
      } else {
        // Since array is sorted descending, we can break here
        break;
      }
    }
    rank = countGreater + 1;
  }

  // Calculate percentile (inverse of rank percentage)
  // Higher nonce = better percentile
  const percentile = ((totalAddresses - rank + 1) / totalAddresses) * 100;
  const percentileRounded = Math.round(percentile * 10) / 10;

  return {
    rank,
    totalAddresses,
    percentile: percentileRounded,
  };
}

