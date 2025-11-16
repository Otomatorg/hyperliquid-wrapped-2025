// backend/src/test/testGetPoints.js
import { getPoints } from "../services/getPoints.js";

// Test addresses from userInfo.json
const TEST_ADDRESSES = [
  "0x0000000000000000000000000000000000000000", // Has 1 point (felix)
  "0x0000000188e3604489698ea73de28524f2bea6c6", // Has 2 points (hyperlend, felix)
  "0x000000087f00ae6e6b0da6d4125096cbe2138f25", // Has 4 points (hyperbeat, hyperlend, felix, hypurrfi)
  "0x000000000a84b8460598b33fc6739c320960b659", // Has 1 point (hypurrfi: 11553)
  "0x000000000000000000000000000000000000dead", // No points (empty object)
  "0x1234567890123456789012345678901234567890", // Doesn't exist
];

async function testGetPoints() {
  console.log("\n🧪 Testing getPoints Service\n");
  console.log("=".repeat(80));

  for (const address of TEST_ADDRESSES) {
    try {
      console.log(`\n📍 Testing address: ${address}`);
      console.log("-".repeat(80));
      
      const startTime = Date.now();
      const points = await getPoints(address);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(3);

      const pointCount = Object.keys(points).length;
      const totalPoints = Object.values(points).reduce((sum, entry) => {
        const pointValue = typeof entry === 'object' && entry !== null ? entry.point : (typeof entry === 'number' ? entry : 0);
        return sum + pointValue;
      }, 0);

      console.log(`⏱️  Time taken: ${duration}s`);
      console.log(`📊 Number of protocols with points: ${pointCount}`);
      console.log(`💰 Total points: ${totalPoints.toLocaleString()}`);
      console.log(`📋 Points breakdown:`);
      
      if (pointCount > 0) {
        for (const [protocol, entry] of Object.entries(points)) {
          if (typeof entry === 'object' && entry !== null) {
            // New structure: {point, rank, percentile}
            const pointStr = entry.point.toLocaleString();
            const rankStr = entry.rank !== null ? `Rank ${entry.rank.toLocaleString()}` : 'No rank';
            const percentileStr = entry.percentile !== null ? `${entry.percentile}%` : 'N/A';
            console.log(`   - ${protocol}: ${pointStr} points (${rankStr}, ${percentileStr} percentile)`);
          } else {
            // Legacy structure: just a number
            console.log(`   - ${protocol}: ${typeof entry === 'number' ? entry.toLocaleString() : entry}`);
          }
        }
      } else {
        console.log(`   (no points)`);
      }
      
      console.log(`\n📄 Full points object:`);
      console.log(JSON.stringify(points, null, 2));
      
    } catch (error) {
      console.error(`❌ Error for address ${address}:`);
      console.error(error.message);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Test completed!\n");
}

// Run the test
testGetPoints();

