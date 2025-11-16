// backend/src/test/testGetPointsWithEnv.js
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { getPoints } from "../services/getPoints.js";

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// --- Get test address from env ---
const TEST_ADDRESS = process.env.TEST_ADDRESS;

async function testGetPoints() {
  if (!TEST_ADDRESS) {
    console.error("❌ TEST_ADDRESS not found in .env file");
    console.log("Please add TEST_ADDRESS=0x... to your .env file");
    process.exit(1);
  }

  console.log(`\n🧪 Testing getPoints Service for address: ${TEST_ADDRESS}\n`);
  console.log("=".repeat(80));

  try {
    const startTime = Date.now();
    const points = await getPoints(TEST_ADDRESS);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n✅ Points Retrieved Successfully!");
    console.log(`⏱️  Time taken: ${duration}s\n`);
    console.log("=".repeat(80));

    const pointCount = Object.keys(points).length;
    const totalPoints = Object.values(points).reduce((sum, entry) => {
      const pointValue = typeof entry === 'object' && entry !== null ? entry.point : (typeof entry === 'number' ? entry : 0);
      return sum + pointValue;
    }, 0);

    console.log("\n📊 POINTS SUMMARY:\n");
    console.log(`  Number of protocols with points: ${pointCount}`);
    console.log(`  Total points: ${totalPoints.toLocaleString()}\n`);

    if (pointCount > 0) {
      console.log("=".repeat(80));
      console.log("\n📋 POINTS BREAKDOWN BY PROTOCOL:\n");
      
      // Sort by points (descending)
      const sortedProtocols = Object.entries(points).sort((a, b) => {
        const aPoints = typeof a[1] === 'object' && a[1] !== null ? a[1].point : (typeof a[1] === 'number' ? a[1] : 0);
        const bPoints = typeof b[1] === 'object' && b[1] !== null ? b[1].point : (typeof b[1] === 'number' ? b[1] : 0);
        return bPoints - aPoints;
      });

      for (const [protocol, entry] of sortedProtocols) {
        if (typeof entry === 'object' && entry !== null) {
          // New structure: {point, rank, percentile}
          const pointStr = entry.point.toLocaleString();
          const rankStr = entry.rank !== null ? `Rank #${entry.rank.toLocaleString()}` : 'No rank';
          const percentileStr = entry.percentile !== null ? `${entry.percentile.toFixed(2)}%` : 'N/A';
          console.log(`  ${protocol.padEnd(20)} ${pointStr.padStart(15)} points  (${rankStr}, ${percentileStr} percentile)`);
        } else {
          // Legacy structure: just a number
          console.log(`  ${protocol.padEnd(20)} ${(typeof entry === 'number' ? entry.toLocaleString() : entry).toString().padStart(15)} points`);
        }
      }
    } else {
      console.log("  (no points found)");
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n📄 FULL RESPONSE OBJECT:\n");
    console.log(JSON.stringify(points, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Error fetching points:");
    console.error(error);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testGetPoints();

