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
const TEST_ADDRESSES_FILE = path.resolve(__dirname, "testAddresses.json");
const OUTPUT_FILE = path.resolve(__dirname, "totalScores.json");

/**
 * Generate full user JSON and score for a single address
 * This mirrors the logic from backend/src/api/user.js
 */
async function generateUserData(address) {
  try {
    console.log(`\n📊 Processing ${address}...`);

    // Fetch all data in parallel
    const [nonce, gasStats, protocols, points, nfts, networth] = await Promise.all([
      getNonceStats(address),
      getGasStats(address),
      getProtocol(address),
      getPoints(address),
      getNFTs(address),
      getNetworth(address),
    ]);

    // Calculate days since first activity
    let daysSinceFirstActivity = null;
    let firstActivityDate = null;

    let badge = "shrimp";
    if (!nfts.profilePicture.startsWith("http")) {
      nfts.profilePicture = "catbal";
    }
    if (networth > 1000) {
      badge = "fish";
      if (!nfts.profilePicture.startsWith("http")) {
        nfts.profilePicture = "catbal";
      }
    }
    if (networth > 10000) {
      badge = "shark";
      if (!nfts.profilePicture.startsWith("http")) {
        nfts.profilePicture = "hypio";
      }
    }
    if (networth > 100000) {
      badge = "whale";
      if (!nfts.profilePicture.startsWith("http")) {
        nfts.profilePicture = "hypurr";
      }
    }

    if (gasStats.firstTxTimestamp) {
      const firstTxDate = new Date(gasStats.firstTxTimestamp * 1000);
      const now = new Date();
      daysSinceFirstActivity = Math.floor((now - firstTxDate) / (1000 * 60 * 60 * 24));
      firstActivityDate = firstTxDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    // Structure gas data similar to nonce
    const gas = {
      value: gasStats.totalGasEth || 0,
      rank:
        gasStats.rank !== null
          ? {
              rank: gasStats.rank,
              totalAddresses: gasStats.totalAddresses,
              percentile: gasStats.percentile,
            }
          : null,
    };

    // Format early rank object
    let earlyRank = null;
    let ogString = "Unknown";
    if (gasStats.earlyRank !== null && gasStats.earlyPercentile !== null) {
      const percentileRounded = Math.round(gasStats.earlyPercentile);
      earlyRank = {
        rank: gasStats.earlyRank,
        percentile: percentileRounded,
      };

      // Format OG string based on percentile
      if (gasStats.earlyPercentile >= 99) {
        ogString = "Elite early adopter - among the first users!";
      } else if (gasStats.earlyPercentile >= 95) {
        ogString = "Very early adopter - joined before 95% of users";
      } else if (gasStats.earlyPercentile >= 90) {
        ogString = "Early adopter - joined before 90% of users";
      } else if (gasStats.earlyPercentile >= 75) {
        ogString = "Early user - joined before 75% of users";
      } else if (gasStats.earlyPercentile >= 50) {
        ogString = "Joined before 50% of users";
      } else {
        ogString = "Joined recently";
      }
    }

    // Calculate total rank score from the fetched data
    const rankData = getTotalRank({
      nonce,
      gasStats,
      protocols,
      points,
      networth,
    });

    const userData = {
      address: address,
      rank: rankData.score,
      firstActivityDate: firstActivityDate || "Unknown",
      daysSinceFirstActivity: daysSinceFirstActivity || 0,
      gas: gas,
      nonce: { value: nonce.value, rank: nonce.rank },
      EarlyRank: earlyRank,
      HypercoreTrades: 42, // Placeholder
      HypercoreVolume: "420k $", // Placeholder
      numberOfProtocolsUsed: protocols.length,
      protocolBadges: protocols,
      userProfile: {
        name: "DeFi Explorer 🧭",
        description: "This user farmed points across many ecosystems.",
      },
      topPoints: [
        { label: "Top 10%", icon: "hyperliquid" },
        { label: "Top 25%", icon: "hyperlend" },
      ],
      allPoints: points,
      avatar: nfts.profilePicture,
      userBadge: badge,
      general: {
        transactions: gasStats.txCount.toString(),
        og: ogString,
        archetype: "Yield Alchemist",
      },
      // Include detailed rank breakdown
      rankBreakdown: {
        noncePoints: rankData.noncePoints,
        earlyRankPoints: rankData.earlyRankPoints,
        protocolPoints: rankData.protocolPoints,
        networthMultiplier: rankData.networthMultiplier,
        protocolCountMultiplier: rankData.protocolCountMultiplier,
        networth: rankData.networth,
        noncePercentile: rankData.noncePercentile,
        earlyPercentile: rankData.earlyPercentile,
        protocolCount: rankData.protocolCount,
        protocols: rankData.protocols,
        details: rankData.details,
      },
    };

    console.log(`   ✅ Score: ${rankData.score}`);
    return userData;
  } catch (error) {
    console.error(`   ❌ Error processing ${address}: ${error.message}`);
    return {
      address: address,
      error: error.message,
      rank: 0,
    };
  }
}

/**
 * Main function to process all addresses and generate total scores
 */
async function generateTotalScores() {
  try {
    console.log("📖 Reading test addresses...");
    const addressesData = JSON.parse(
      await fs.readFile(TEST_ADDRESSES_FILE, "utf-8")
    );

    // Collect all addresses from all protocols and noPoints
    const allAddresses = [];
    const addressToProtocol = {};

    // Process protocol addresses
    for (const [protocol, addresses] of Object.entries(addressesData)) {
      if (protocol === "noPoints") {
        // Handle noPoints addresses separately
        for (const address of addresses) {
          allAddresses.push(address);
          addressToProtocol[address] = "noPoints";
        }
      } else {
        // Handle protocol addresses
        for (const address of addresses) {
          allAddresses.push(address);
          addressToProtocol[address] = protocol;
        }
      }
    }

    console.log(`\n📋 Found ${allAddresses.length} addresses to process`);
    console.log(`   Protocols: ${Object.keys(addressesData).filter(k => k !== 'noPoints').length}`);
    console.log(`   No points addresses: ${addressesData.noPoints?.length || 0}\n`);

    // Process addresses sequentially to avoid overwhelming the system
    const results = {};
    let processed = 0;

    for (const address of allAddresses) {
      processed++;
      const protocol = addressToProtocol[address];
      
      console.log(`[${processed}/${allAddresses.length}] Processing ${protocol}: ${address}`);
      
      const userData = await generateUserData(address);
      
      // Group results by protocol
      if (!results[protocol]) {
        results[protocol] = [];
      }
      results[protocol].push(userData);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Add summary statistics
    const summary = {
      totalAddresses: allAddresses.length,
      protocols: Object.keys(addressesData).filter(k => k !== 'noPoints'),
      noPointsCount: addressesData.noPoints?.length || 0,
      generatedAt: new Date().toISOString(),
    };

    const output = {
      summary,
      results,
    };

    // Save results to file
    console.log(`\n💾 Saving results to ${OUTPUT_FILE}...`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");

    console.log(`\n✅ Successfully generated scores for ${allAddresses.length} addresses!`);
    console.log(`   Results saved to: ${OUTPUT_FILE}`);

    // Print summary statistics
    console.log("\n📊 Summary Statistics:");
    for (const [protocol, users] of Object.entries(results)) {
      const avgScore =
        users.reduce((sum, u) => sum + (u.rank || 0), 0) / users.length;
      const maxScore = Math.max(...users.map((u) => u.rank || 0));
      const minScore = Math.min(...users.map((u) => u.rank || 0));
      console.log(`   ${protocol}:`);
      console.log(`     Count: ${users.length}`);
      console.log(`     Avg Score: ${avgScore.toFixed(2)}`);
      console.log(`     Max Score: ${maxScore.toFixed(2)}`);
      console.log(`     Min Score: ${minScore.toFixed(2)}`);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
generateTotalScores().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

