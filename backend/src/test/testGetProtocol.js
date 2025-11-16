// backend/src/test/testGetProtocol.js
import { getProtocol } from "../services/getProtocol.js";

// Test addresses from userInfo.json
const TEST_ADDRESSES = [
  "0x0000000000000000000000000000000000000000", // Has 8 protocols
  "0x0000000188e3604489698ea73de28524f2bea6c6", // Has 2 protocols
  "0x000000087f00ae6e6b0da6d4125096cbe2138f25", // Has 9 protocols
  "0x000000000000000000000000000000000000dead", // Has 4 protocols, no points
  "0x1234567890123456789012345678901234567890", // Doesn't exist
];

async function testGetProtocol() {
  console.log("\n🧪 Testing getProtocol Service\n");
  console.log("=".repeat(80));

  for (const address of TEST_ADDRESSES) {
    try {
      console.log(`\n📍 Testing address: ${address}`);
      console.log("-".repeat(80));
      
      const startTime = Date.now();
      const protocols = await getProtocol(address);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(3);

      console.log(`⏱️  Time taken: ${duration}s`);
      console.log(`📊 Number of protocols: ${protocols.length}`);
      console.log(`📋 Protocols: ${protocols.length > 0 ? JSON.stringify(protocols, null, 2) : "[]"}`);
      
    } catch (error) {
      console.error(`❌ Error for address ${address}:`);
      console.error(error.message);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Test completed!\n");
}

// Run the test
testGetProtocol();

