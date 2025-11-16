// backend/src/test/testHypercoreStats.js
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { getHypercoreStats } from "../services/getHypercoreStats.js";

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// --- Get test address from env ---
const TEST_ADDRESS = process.env.TEST_ADDRESS;

async function testHypercoreStats() {
  if (!TEST_ADDRESS) {
    console.error("❌ TEST_ADDRESS not found in .env file");
    console.log("Please add TEST_ADDRESS=0x... to your .env file");
    process.exit(1);
  }

  console.log(`\n🧪 Testing getHypercoreStats Service for address: ${TEST_ADDRESS}\n`);
  console.log("=".repeat(80));

  try {
    const startTime = Date.now();
    const stats = await getHypercoreStats(TEST_ADDRESS);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n✅ Hypercore Stats Retrieved Successfully!");
    console.log(`⏱️  Time taken: ${duration}s\n`);
    console.log("=".repeat(80));

    console.log("\n📊 HYPERCORE STATS:\n");
    console.log(`  Trades:        ${stats.trades.toLocaleString()}`);
    console.log(`  Volume:        ${stats.volume}`);
    console.log("\n" + "=".repeat(80));

    // Check if data exists
    if (stats.trades === 0 && stats.volume === "0 $") {
      console.log("\n⚠️  WARNING: No Hypercore data found for this address.");
      console.log("   This could mean:");
      console.log("   1. The data file doesn't exist yet (run fetchHypercoreVolumeAndTrades.js)");
      console.log("   2. This address hasn't been processed yet");
      console.log("   3. This address has no Hypercore trading activity");
      console.log("\n   To fetch data, run:");
      console.log("   node src/hypercore/fetchHypercoreVolumeAndTrades.js\n");
    } else {
      console.log("\n✅ Hypercore trading data found!");
    }

    console.log("=".repeat(80));
    console.log("\n📄 FULL RESPONSE OBJECT:\n");
    console.log(JSON.stringify(stats, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Error fetching Hypercore stats:");
    console.error(error);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testHypercoreStats();

