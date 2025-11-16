// backend/src/test/testGetProtocolRank.js
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the getProtocolRank script
const SCRIPT_PATH = path.resolve(__dirname, "../services/getProtocolRank.js");

// All protocols that have points (from computePointStats.js output)
const PROTOCOLS = [
  "hyperbeat",
  "hyperlend",
  "felix",
  "upshift",
  "hyperdrive",
  "hypurrfi",
  "theo",
];

// Test cases: protocol -> array of point values to test
const TEST_CASES = {
  hyperbeat: [100, 1000, 5000, 10000],
  hyperlend: [100, 1000, 5000, 10000],
  felix: [100, 1000, 5000, 10000],
  upshift: [10, 50, 100, 500],
  hyperdrive: [1, 10, 50, 100],
  hypurrfi: [100, 1000, 5000, 10000],
  theo: [10, 50, 100, 500],
};

/**
 * Run getProtocolRank.js script and parse the result
 */
async function getProtocolRank(protocol, points) {
  try {
    const { stdout, stderr } = await execAsync(
      `node "${SCRIPT_PATH}" ${protocol} ${points}`
    );

    if (stderr) {
      console.error(`⚠️  stderr: ${stderr}`);
    }

    // Parse JSON output
    const result = JSON.parse(stdout.trim());
    return result;
  } catch (error) {
    // If the command failed, try to parse error message
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout.trim());
      } catch {
        throw new Error(`Failed to parse output: ${error.stdout}`);
      }
    }
    throw error;
  }
}

/**
 * Test a single protocol with multiple point values
 */
async function testProtocol(protocol, pointValues) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 Testing Protocol: ${protocol.toUpperCase()}`);
  console.log("=".repeat(80));

  const results = [];

  for (const points of pointValues) {
    try {
      console.log(`\n📍 Testing with ${points} points...`);
      const startTime = Date.now();
      const result = await getProtocolRank(protocol, points);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(3);

      // Validate result structure
      if (
        !result.protocol ||
        result.rank === undefined ||
        result.totalWithPoints === undefined ||
        result.topPercent === undefined
      ) {
        throw new Error("Invalid result structure");
      }

      // Validate rank is within bounds
      // Note: rank can be totalWithPoints + 1 for edge cases (e.g., 0 points)
      if (result.rank < 1 || result.rank > result.totalWithPoints + 1) {
        throw new Error(
          `Invalid rank: ${result.rank} (should be between 1 and ${result.totalWithPoints + 1})`
        );
      }

      // Validate topPercent is reasonable (can be slightly > 100 for edge cases)
      if (result.topPercent < 0 || result.topPercent > 101) {
        throw new Error(
          `Invalid topPercent: ${result.topPercent} (should be between 0 and 101)`
        );
      }

      console.log(`   ✅ Rank: ${result.rank.toLocaleString()}`);
      console.log(`   ✅ Total with points: ${result.totalWithPoints.toLocaleString()}`);
      console.log(`   ✅ Top ${result.topPercent.toFixed(2)}%`);
      console.log(`   ⏱️  Time: ${duration}s`);

      results.push({
        points,
        ...result,
        duration: parseFloat(duration),
      });
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        points,
        error: error.message,
      });
    }
  }

  // Summary for this protocol
  console.log(`\n📊 Summary for ${protocol}:`);
  if (results.length > 0 && !results[0].error) {
    const firstResult = results[0];
    console.log(`   Total users with points: ${firstResult.totalWithPoints.toLocaleString()}`);
    
    // Show rank progression
    console.log(`   Rank progression:`);
    results.forEach((r) => {
      if (!r.error) {
        console.log(
          `     ${r.points.toLocaleString().padStart(10)} points → Rank ${r.rank.toLocaleString().padStart(6)} (top ${r.topPercent.toFixed(2)}%)`
        );
      }
    });
  }

  return results;
}

/**
 * Test edge cases
 */
async function testEdgeCases() {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 Testing Edge Cases`);
  console.log("=".repeat(80));

  const edgeCases = [
    { protocol: "hyperlend", points: 0, description: "Zero points" },
    { protocol: "hyperlend", points: 999999999, description: "Very high points" },
    { protocol: "invalidprotocol", points: 100, description: "Invalid protocol" },
  ];

  for (const testCase of edgeCases) {
    console.log(`\n📍 ${testCase.description} (${testCase.protocol}, ${testCase.points})...`);
    try {
      const result = await getProtocolRank(testCase.protocol, testCase.points);
      console.log(`   ✅ Result:`, JSON.stringify(result, null, 2));
    } catch (error) {
      // Expected for invalid protocol
      if (testCase.protocol === "invalidprotocol") {
        console.log(`   ✅ Correctly rejected invalid protocol`);
      } else {
        console.log(`   ⚠️  Result: ${error.message}`);
      }
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log("\n🚀 Starting getProtocolRank Tests");
  console.log("=".repeat(80));

  const allResults = {};

  // Test each protocol
  for (const protocol of PROTOCOLS) {
    const pointValues = TEST_CASES[protocol] || [100, 1000];
    const results = await testProtocol(protocol, pointValues);
    allResults[protocol] = results;
  }

  // Test edge cases
  await testEdgeCases();

  // Final summary
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 Final Summary`);
  console.log("=".repeat(80));

  let totalTests = 0;
  let passedTests = 0;

  for (const [protocol, results] of Object.entries(allResults)) {
    for (const result of results) {
      totalTests++;
      if (!result.error) {
        passedTests++;
      }
    }
  }

  console.log(`\n✅ Tests passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Tests failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log(`\n🎉 All tests passed!\n`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Some tests failed.\n`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

