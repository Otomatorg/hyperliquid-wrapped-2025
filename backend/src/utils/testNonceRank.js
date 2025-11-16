// Simple test script to demonstrate getNonceRank usage
import { getNonceRank } from "../services/getNonceRank.js";

async function test() {
  try {
    // Test with different nonce values
    const testNonces = [0, 1, 10, 100, 500, 1000, 2000, 5000];

    console.log("Testing getNonceRank function:\n");

    for (const nonce of testNonces) {
      const result = await getNonceRank(nonce);
      console.log(`Nonce: ${nonce}`);
      console.log(`  Rank: #${result.rank.toLocaleString()} out of ${result.totalAddresses.toLocaleString()}`);
      console.log(`  Percentile: ${result.percentile}%`);
      console.log(`  Label: ${result.rankLabel}`);
      console.log();
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();

