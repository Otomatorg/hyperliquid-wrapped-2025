// fetch-address-nonces.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains"; // placeholder; RPC overrides it

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// ---- Config ----
const RPC_URL = "https://rpc.hyperliquid.xyz/evm";
const GLOBAL_UNIQUE_USERS_FILE = path.join(__dirname, "../globalUniqueUsers.json");
const OUTPUT_DIR = path.join(__dirname, "hyperEVM");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "addressNonces.json");
const LIMIT = 2000000; // Default to 50 if not set
const BATCH_SIZE = 10; // Number of parallel requests per batch
const BATCH_DELAY_MS = 1000; // 1 second delay between batches

if (!RPC_URL) {
  console.error("❌ Missing ALCHEMY_HYPEREVM_RPC in .env");
  process.exit(1);
}

const client = createPublicClient({
  chain: wanchainTestnet,
  transport: http(RPC_URL),
});

// Fetch nonce for a single address
async function fetchNonce(address) {
  try {
    const nonce = await client.getTransactionCount({
      address: address,
    });
    return { address, nonce: Number(nonce) };
  } catch (err) {
    console.error(`❌ Error fetching nonce for ${address}:`, err.message);
    return { address, nonce: null }; // Return null on error, we'll handle it in the map
  }
}

// Load existing results from file
function loadExistingResults() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
      if (typeof existingData === "object" && existingData !== null && !Array.isArray(existingData)) {
        return existingData;
      }
    }
  } catch (err) {
    console.warn(`⚠️  Could not load existing results: ${err.message}`);
  }
  return {};
}

// Save results to file
function saveResults(results) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
}

async function main() {
  // Load existing results
  console.log(`📖 Loading existing results from ${OUTPUT_FILE}...`);
  const results = loadExistingResults();
  const existingCount = Object.keys(results).length;
  console.log(`📊 Found ${existingCount} already fetched addresses\n`);

  // Read global unique users
  console.log(`📖 Reading addresses from ${GLOBAL_UNIQUE_USERS_FILE}...`);
  const allAddresses = JSON.parse(fs.readFileSync(GLOBAL_UNIQUE_USERS_FILE, "utf-8"));
  
  if (!Array.isArray(allAddresses)) {
    console.error("❌ globalUniqueUsers.json must be an array of addresses");
    process.exit(1);
  }

  // Apply limit
  const addressesToProcess = allAddresses.slice(0, LIMIT);
  
  // Filter out addresses that have already been fetched
  const addressesToFetch = addressesToProcess.filter(addr => !(addr in results));
  const totalAddresses = allAddresses.length;
  const fetchCount = addressesToFetch.length;
  const skipCount = addressesToProcess.length - fetchCount;

  console.log(`📊 Total addresses in file: ${totalAddresses}`);
  console.log(`🎯 Limit set to: ${LIMIT}`);
  console.log(`⏭️  Skipping ${skipCount} already fetched addresses`);
  console.log(`📥 Fetching nonces for ${fetchCount} remaining addresses...`);
  console.log(`⚡ Processing ${BATCH_SIZE} addresses in parallel, ${BATCH_DELAY_MS / 1000}s delay between batches\n`);

  if (fetchCount === 0) {
    console.log(`✅ All addresses have already been fetched!`);
    return;
  }

  // Process addresses in batches
  const totalBatches = Math.ceil(addressesToFetch.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, addressesToFetch.length);
    const batch = addressesToFetch.slice(startIndex, endIndex);
    const batchNumber = batchIndex + 1;

    console.log(`\n📦 Batch ${batchNumber}/${totalBatches} - Processing ${batch.length} addresses (${startIndex + 1}-${endIndex} of ${fetchCount})...`);

    // Fetch all addresses in this batch in parallel
    const batchPromises = batch.map(addr => fetchNonce(addr));
    const batchResults = await Promise.all(batchPromises);

    // Process results
    for (const result of batchResults) {
      if (result.nonce !== null) {
        results[result.address] = result.nonce;
        console.log(`  ✅ ${result.address}: ${result.nonce}`);
      } else {
        console.log(`  ❌ ${result.address}: Failed`);
      }
    }

    // Save results after each batch
    saveResults(results);
    const currentTotal = Object.keys(results).length;
    console.log(`💾 Saved batch results. Total fetched: ${currentTotal} addresses`);

    // Wait before next batch (except for the last batch)
    if (batchIndex < totalBatches - 1) {
      console.log(`⏳ Waiting ${BATCH_DELAY_MS / 1000} seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  const successCount = Object.keys(results).length;
  console.log(`\n✅ Done! Successfully fetched ${successCount} total nonces (${fetchCount} new in this run).`);
  console.log(`💾 Final results saved to: ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});