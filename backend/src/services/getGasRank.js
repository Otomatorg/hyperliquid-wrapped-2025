import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

// --- __dirname ESM equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the gas data JSON file
const GAS_DATA_FILE_PATH = path.resolve(
  __dirname,
  "../data/gasData.json"
);

// Cache for sorted gas values array (loaded once)
let sortedGasCache = null;
let totalAddresses = 0;

/**
 * Load and cache the sorted gas values array.
 * This is called once on first use.
 */
async function loadGasData() {
  if (sortedGasCache !== null) {
    return; // Already loaded
  }

  try {
    console.log("📊 Loading gas data from JSON file...");
    const fileContent = await fs.readFile(GAS_DATA_FILE_PATH, "utf-8");
    const gasData = JSON.parse(fileContent);

    // Extract all gasSpentHype values into an array
    const gasValues = Object.values(gasData).map(entry => entry.gasSpentHype);
    totalAddresses = gasValues.length;

    // Sort in descending order (highest gas spent first = rank 1)
    sortedGasCache = gasValues.sort((a, b) => b - a);

    console.log(`✅ Loaded ${totalAddresses} gas values. Highest: ${sortedGasCache[0]}, Lowest: ${sortedGasCache[sortedGasCache.length - 1]}`);
  } catch (error) {
    console.error(`❌ Error loading gas data: ${error.message}`);
    throw new Error(`Failed to load gas data: ${error.message}`);
  }
}

/**
 * Get the rank of a given gas spent value.
 * 
 * @param {number} gasSpentValue - The gas spent value (gasSpentHype) to get the rank for
 * @returns {object} - Object containing rank information
 *   - rank: number - The rank (1 = highest gas spent, higher number = lower gas spent)
 *   - totalAddresses: number - Total number of addresses
 *   - percentile: number - Percentile (0-100, where 100 = highest gas spent)
 */
export async function getGasRank(gasSpentValue) {
  // Ensure data is loaded
  await loadGasData();

  if (typeof gasSpentValue !== "number" || gasSpentValue < 0) {
    throw new Error("Gas spent value must be a non-negative number");
  }

  // Calculate rank: rank = number of addresses with gas spent > given value + 1
  // Rank 1 = highest gas spent, rank totalAddresses = lowest gas spent
  
  let rank;
  
  // If the gas spent is higher than all others, rank is 1
  if (gasSpentValue > sortedGasCache[0]) {
    rank = 1;
  }
  // If the gas spent is lower than all others, rank is totalAddresses
  else if (gasSpentValue < sortedGasCache[sortedGasCache.length - 1]) {
    rank = totalAddresses;
  }
  // Otherwise, find the first position where gas spent is less than the given value
  else {
    // Count how many addresses have a gas spent strictly greater than the given value
    // Rank = count + 1 (because rank 1 is the highest)
    let countGreater = 0;
    for (let i = 0; i < sortedGasCache.length; i++) {
      if (sortedGasCache[i] > gasSpentValue) {
        countGreater++;
      } else {
        // Since array is sorted descending, we can break here
        break;
      }
    }
    rank = countGreater + 1;
  }

  // Calculate percentile (inverse of rank percentage)
  // Higher gas spent = better percentile
  const percentile = ((totalAddresses - rank + 1) / totalAddresses) * 100;
  const percentileRounded = Math.round(percentile * 10) / 10;

  return {
    rank,
    totalAddresses,
    percentile: percentileRounded,
  };
}

