// backend/src/test/testGasRank.js
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { getGasStats } from "../services/getGasStats.js";

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// --- Get test address from env ---
const TEST_ADDRESS = process.env.TEST_ADDRESS;

async function testGasRank() {
  if (!TEST_ADDRESS) {
    console.error("❌ TEST_ADDRESS not found in .env file");
    console.log("Please add TEST_ADDRESS=0x... to your .env file");
    process.exit(1);
  }

  console.log(`\n🧪 Testing Gas Stats & Rank for address: ${TEST_ADDRESS}\n`);
  console.log("=".repeat(80));

  try {
    const startTime = Date.now();
    const gasStats = await getGasStats(TEST_ADDRESS);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n✅ Gas Stats Retrieved Successfully!");
    console.log(`⏱️  Time taken: ${duration}s\n`);
    console.log("=".repeat(80));
    console.log("\n📊 GAS STATISTICS:\n");
    
    console.log(`  Transaction Count:     ${gasStats.txCount.toLocaleString()}`);
    console.log(`  Total Gas (Wei):       ${gasStats.totalGasWei}`);
    console.log(`  Total Gas (ETH/Hype):  ${gasStats.totalGasEth.toFixed(8)}`);
    
    if (gasStats.firstTxTimestamp) {
      console.log(`  First TX Timestamp:    ${gasStats.firstTxTimestamp}`);
      console.log(`  First TX Date:         ${gasStats.firstTxIso}`);
    } else {
      console.log(`  First TX:              No transactions found`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n🏆 RANKING INFORMATION:\n");
    
    if (gasStats.rank !== null) {
      console.log(`  Rank:                  #${gasStats.rank.toLocaleString()}`);
      console.log(`  Total Addresses:       ${gasStats.totalAddresses.toLocaleString()}`);
      console.log(`  Percentile:            ${gasStats.percentile}%`);
    } else {
      console.log("  ⚠️  Ranking not available (no gas spent or ranking failed)");
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n📋 FULL RESPONSE OBJECT:\n");
    console.log(JSON.stringify(gasStats, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Error fetching gas stats:");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testGasRank();

