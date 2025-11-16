import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getNonceStats } from "../services/getUserNonce.js";
import { getGasStats } from "../services/getGasStats.js";
import { getProtocol } from "../services/getProtocol.js";
import { getPoints } from "../services/getPoints.js";
import { getNFTs } from "../services/getNFTs.js";
import { getNetworth } from "../services/getNetworth.js";
import { getTotalRank } from "../services/getTotalRank.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const TOP_USERS_FILE = path.resolve(__dirname, "topUsers.json");
const OUTPUT_FILE = path.resolve(__dirname, "topUsersWithScores.json");

/**
 * Generate score for a single address
 * Returns just the score value
 */
async function generateScore(address) {
  try {
    // Fetch all data in parallel
    const [nonce, gasStats, protocols, points, nfts, networth] = await Promise.all([
      getNonceStats(address),
      getGasStats(address),
      getProtocol(address),
      getPoints(address),
      getNFTs(address),
      getNetworth(address),
    ]);

    // Calculate total rank score
    const rankData = getTotalRank({
      nonce,
      gasStats,
      protocols,
      points,
      networth,
    });

    return rankData.score;
  } catch (error) {
    console.error(`   ❌ Error processing ${address}: ${error.message}`);
    return 0;
  }
}

/**
 * Collect all addresses from the input file structure
 */
function collectAllAddresses(data) {
  const addressMap = new Map(); // address -> { original data, source }

  // Collect from topUsersByProtocol
  if (data.topUsersByProtocol) {
    for (const [protocol, users] of Object.entries(data.topUsersByProtocol)) {
      for (const user of users) {
        if (!addressMap.has(user.address)) {
          addressMap.set(user.address, {
            address: user.address,
            points: user.points,
            protocol: protocol,
            source: "topUsersByProtocol",
          });
        }
      }
    }
  }

  // Collect from topUsersByProtocolCount
  if (data.topUsersByProtocolCount) {
    for (const user of data.topUsersByProtocolCount) {
      if (!addressMap.has(user.address)) {
        addressMap.set(user.address, {
          address: user.address,
          protocolCount: user.protocolCount,
          protocols: user.protocols,
          source: "topUsersByProtocolCount",
        });
      }
    }
  }

  return Array.from(addressMap.values());
}

/**
 * Reconstruct the output in the same format as input, with scores and ranks added
 */
function reconstructOutput(originalData, scoredAddresses) {
  const scoreMap = new Map();
  const rankMap = new Map();
  
  scoredAddresses.forEach((item) => {
    scoreMap.set(item.address, item.score);
    if (item.rank !== undefined && item.rank !== null) {
      rankMap.set(item.address, item.rank);
    }
  });

  // Deep clone the original data to avoid mutating it
  const output = JSON.parse(JSON.stringify(originalData));

  // Add scores and ranks to topUsersByProtocol
  if (output.topUsersByProtocol) {
    for (const [protocol, users] of Object.entries(output.topUsersByProtocol)) {
      for (const user of users) {
        const score = scoreMap.get(user.address);
        const rank = rankMap.get(user.address);
        if (score !== undefined) {
          user.score = score;
        }
        if (rank !== undefined) {
          user.rank = rank;
        }
      }
    }
  }

  // Add scores and ranks to topUsersByProtocolCount
  if (output.topUsersByProtocolCount) {
    for (const user of output.topUsersByProtocolCount) {
      const score = scoreMap.get(user.address);
      const rank = rankMap.get(user.address);
      if (score !== undefined) {
        user.score = score;
      }
      if (rank !== undefined) {
        user.rank = rank;
      }
    }
  }

  return output;
}

/**
 * Main function to process all addresses and generate scores
 */
async function processTopUsersScores() {
  try {
    console.log("📖 Reading topUsers.json...");
    const originalData = JSON.parse(
      await fs.readFile(TOP_USERS_FILE, "utf-8")
    );

    // Collect all unique addresses
    const allAddresses = collectAllAddresses(originalData);
    console.log(`\n📋 Found ${allAddresses.length} unique addresses to process\n`);

    // Try to load existing scores if file exists
    let existingScores = new Map();
    try {
      const existingData = JSON.parse(
        await fs.readFile(OUTPUT_FILE, "utf-8")
      );
      // Extract existing scores
      if (existingData.topUsersByProtocol) {
        for (const [protocol, users] of Object.entries(
          existingData.topUsersByProtocol
        )) {
          for (const user of users) {
            if (user.score !== undefined) {
              existingScores.set(user.address, user.score);
            }
          }
        }
      }
      if (existingData.topUsersByProtocolCount) {
        for (const user of existingData.topUsersByProtocolCount) {
          if (user.score !== undefined) {
            existingScores.set(user.address, user.score);
          }
        }
      }
      console.log(
        `   ✅ Loaded ${existingScores.size} existing scores from previous run\n`
      );
    } catch (error) {
      console.log("   ℹ️  No existing scores found, starting fresh\n");
    }

    // Process addresses
    const scoredAddresses = [];
    let processed = 0;
    let skipped = 0;

    for (const addressData of allAddresses) {
      const address = addressData.address;
      processed++;

      // Skip if we already have a score
      if (existingScores.has(address)) {
        scoredAddresses.push({
          address,
          score: existingScores.get(address),
        });
        skipped++;
        console.log(
          `[${processed}/${allAddresses.length}] ⏭️  Skipped ${address} (already scored)`
        );
        continue;
      }

      console.log(
        `[${processed}/${allAddresses.length}] 📊 Processing ${address}...`
      );
      const score = await generateScore(address);
      scoredAddresses.push({ address, score });
      console.log(`   ✅ Score: ${score.toFixed(2)}`);

      // Save every 10 addresses
      if (processed % 10 === 0) {
        const currentOutput = reconstructOutput(originalData, scoredAddresses);
        await fs.writeFile(
          OUTPUT_FILE,
          JSON.stringify(currentOutput, null, 2),
          "utf-8"
        );
        console.log(
          `   💾 Progress saved (${processed}/${allAddresses.length} processed, ${skipped} skipped)\n`
        );
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Rank all addresses by score
    console.log("\n🏆 Ranking all addresses by score...");
    const allScored = scoredAddresses
      .filter((item) => item.score !== undefined && item.score !== null)
      .sort((a, b) => b.score - a.score);

    // Create rank map
    const rankMap = new Map();
    allScored.forEach((item, index) => {
      rankMap.set(item.address, index + 1);
    });

    // Update scoredAddresses with ranks
    scoredAddresses.forEach((item) => {
      item.rank = rankMap.get(item.address) || null;
    });

    // Final save with ranks
    console.log("\n💾 Saving final results...");
    let finalOutput = reconstructOutput(originalData, scoredAddresses);

    // Save final output with ranks
    await fs.writeFile(
      OUTPUT_FILE,
      JSON.stringify(finalOutput, null, 2),
      "utf-8"
    );

    console.log(`\n✅ Successfully processed ${allAddresses.length} addresses!`);
    console.log(`   Results saved to: ${OUTPUT_FILE}`);

    // Print top 100 addresses
    console.log("\n" + "=".repeat(80));
    console.log("🏆 TOP 100 ADDRESSES BY SCORE");
    console.log("=".repeat(80) + "\n");

    const top100 = allScored.slice(0, 100);
    top100.forEach((item, index) => {
      const rank = index + 1;
      console.log(
        `${rank.toString().padStart(3)}. ${item.address} - Score: ${item.score.toFixed(2)}`
      );
    });

    // Print summary statistics
    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY STATISTICS");
    console.log("=".repeat(80));
    console.log(`Total addresses processed: ${allAddresses.length}`);
    console.log(`Addresses with scores: ${allScored.length}`);
    console.log(`Highest score: ${allScored[0]?.score.toFixed(2) || "N/A"}`);
    console.log(
      `Lowest score: ${allScored[allScored.length - 1]?.score.toFixed(2) || "N/A"}`
    );
    const avgScore =
      allScored.reduce((sum, item) => sum + item.score, 0) / allScored.length;
    console.log(`Average score: ${avgScore.toFixed(2)}`);
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
processTopUsersScores().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

