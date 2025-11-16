// backend/src/test/testEarlyRank.js
import { calculateEarlyRank, estimateUsersAt } from "../services/getGasStats.js";

/**
 * Convert a date string or Date object to Unix timestamp
 */
function dateToTimestamp(date) {
  if (typeof date === "string") {
    return Math.floor(new Date(date).getTime() / 1000);
  }
  if (date instanceof Date) {
    return Math.floor(date.getTime() / 1000);
  }
  return date;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toISOString();
}

async function testEarlyRank() {
  console.log("\n🧪 Testing Early Rank Calculation\n");
  console.log("=".repeat(80));

  // Test cases: different first transaction dates
  const testCases = [
    {
      name: "Very Early User (Feb 18, 2025 - launch day)",
      firstTxDate: "2025-02-18T00:00:00Z",
      description: "First day of the platform",
    },
    {
      name: "Early Adopter (Feb 19, 2025)",
      firstTxDate: "2025-02-19T00:00:00Z",
      description: "Day after launch",
    },
    {
      name: "Early User (Feb 22, 2025)",
      firstTxDate: "2025-02-22T00:00:00Z",
      description: "Between first two checkpoints",
    },
    {
      name: "Early User (Feb 27, 2025)",
      firstTxDate: "2025-02-27T00:00:00Z",
      description: "Between second and third checkpoints",
    },
    {
      name: "March User (March 15, 2025)",
      firstTxDate: "2025-03-15T00:00:00Z",
      description: "Mid-March",
    },
    {
      name: "April User (April 15, 2025)",
      firstTxDate: "2025-04-15T00:00:00Z",
      description: "Mid-April",
    },
    {
      name: "May User (May 15, 2025)",
      firstTxDate: "2025-05-15T00:00:00Z",
      description: "Mid-May",
    },
    {
      name: "June User (June 15, 2025)",
      firstTxDate: "2025-06-15T00:00:00Z",
      description: "Mid-June",
    },
    {
      name: "July User (July 15, 2025)",
      firstTxDate: "2025-07-15T00:00:00Z",
      description: "Mid-July",
    },
    {
      name: "August User (August 15, 2025)",
      firstTxDate: "2025-08-15T00:00:00Z",
      description: "Mid-August",
    },
    {
      name: "September User (September 15, 2025)",
      firstTxDate: "2025-09-15T00:00:00Z",
      description: "Mid-September",
    },
    {
      name: "October User (October 15, 2025)",
      firstTxDate: "2025-10-15T00:00:00Z",
      description: "Mid-October",
    },
    {
      name: "Recent User (November 1, 2025)",
      firstTxDate: "2025-11-01T00:00:00Z",
      description: "Early November",
    },
    {
      name: "Very Recent User (November 16, 2025 - today)",
      firstTxDate: "2025-11-16T00:00:00Z",
      description: "Current date",
    },
    {
      name: "Future User (December 1, 2025)",
      firstTxDate: "2025-12-01T00:00:00Z",
      description: "Future date (extrapolation)",
    },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📍 ${testCase.name}`);
      console.log(`   ${testCase.description}`);
      console.log("-".repeat(80));

      const timestamp = dateToTimestamp(testCase.firstTxDate);
      const result = calculateEarlyRank(timestamp);

      console.log(`   First TX Date: ${formatTimestamp(timestamp)}`);
      console.log(`   Estimated Users at First TX: ${result.estimatedUsersAtFirstTx?.toLocaleString() || "N/A"}`);
      console.log(`   Early Rank: ${result.earlyRank?.toLocaleString() || "N/A"}`);
      console.log(`   Early Percentile: ${result.earlyPercentile !== null ? result.earlyPercentile.toFixed(1) + "%" : "N/A"}`);

      // Additional info: show what percentile means
      if (result.earlyPercentile !== null) {
        if (result.earlyPercentile >= 99) {
          console.log(`   🏆 Status: Top 1% - Elite early adopter!`);
        } else if (result.earlyPercentile >= 95) {
          console.log(`   🥇 Status: Top 5% - Very early adopter!`);
        } else if (result.earlyPercentile >= 90) {
          console.log(`   🥈 Status: Top 10% - Early adopter!`);
        } else if (result.earlyPercentile >= 75) {
          console.log(`   🥉 Status: Top 25% - Early user`);
        } else if (result.earlyPercentile >= 50) {
          console.log(`   ✅ Status: Top 50% - Above average`);
        } else {
          console.log(`   📊 Status: Below 50% - Later adopter`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }

  // Test edge cases
  console.log("\n" + "=".repeat(80));
  console.log("\n🔍 Testing Edge Cases\n");
  console.log("=".repeat(80));

  // Test with null timestamp
  try {
    console.log(`\n📍 Testing with null timestamp`);
    console.log("-".repeat(80));
    const result = calculateEarlyRank(null);
    console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    console.log(`   ✅ Correctly handled null timestamp`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }

  // Test with undefined timestamp
  try {
    console.log(`\n📍 Testing with undefined timestamp`);
    console.log("-".repeat(80));
    const result = calculateEarlyRank(undefined);
    console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    console.log(`   ✅ Correctly handled undefined timestamp`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }

  // Test with very old date (before first checkpoint)
  try {
    console.log(`\n📍 Testing with very old date (Jan 1, 2025)`);
    console.log("-".repeat(80));
    const timestamp = dateToTimestamp("2025-01-01T00:00:00Z");
    const result = calculateEarlyRank(timestamp);
    console.log(`   First TX Date: ${formatTimestamp(timestamp)}`);
    console.log(`   Estimated Users: ${result.estimatedUsersAtFirstTx?.toLocaleString() || "N/A"}`);
    console.log(`   Early Rank: ${result.earlyRank?.toLocaleString() || "N/A"}`);
    console.log(`   ✅ Correctly handled date before first checkpoint (extrapolation)`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }

  // Test estimateUsersAt function directly
  console.log("\n" + "=".repeat(80));
  console.log("\n🔍 Testing estimateUsersAt Function Directly\n");
  console.log("=".repeat(80));

  const testDates = [
    "2025-02-18T00:00:00Z",
    "2025-02-20T00:00:00Z",
    "2025-02-22T12:00:00Z", // Midpoint between first two checkpoints
    "2025-03-01T00:00:00Z",
    "2025-06-15T00:00:00Z",
  ];

  for (const dateStr of testDates) {
    try {
      const date = new Date(dateStr);
      const estimatedUsers = estimateUsersAt(date);
      console.log(`\n   Date: ${date.toISOString()}`);
      console.log(`   Estimated Users: ${Math.round(estimatedUsers).toLocaleString()}`);
    } catch (error) {
      console.error(`   ❌ Error for ${dateStr}: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Test completed!\n");
}

// Run the test
testEarlyRank().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

