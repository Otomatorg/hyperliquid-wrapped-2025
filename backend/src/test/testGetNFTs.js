// backend/src/test/testGetNFTs.js
import { getNFTs } from "../services/getNFTs.js";

// Test addresses - using some from existing tests and some that might have NFTs
const TEST_ADDRESSES = [
  "0x0dfcd3419337a894d657ead3c91a4caa821dfe10",
  "0xf7aa7ef08a9ccad9b285fa9c13014d4f8d0d1486",
  "0x216bc59ba62098da4edae8c63a09b600b3d1c47f"
];

async function testGetNFTs() {
  console.log("\n🧪 Testing getNFTs Service\n");
  console.log("=".repeat(80));

  for (const address of TEST_ADDRESSES) {
    try {
      console.log(`\n📍 Testing address: ${address}`);
      console.log("-".repeat(80));
      
      const startTime = Date.now();
      const nfts = await getNFTs(address);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(3);

      const totalNFTs = nfts.hypio.length + nfts.hypurr.length + nfts.catbal.length;

      console.log(`⏱️  Time taken: ${duration}s`);
      console.log(`📊 Total NFTs owned: ${totalNFTs}`);
      console.log(`🖼️  Profile Picture: ${nfts.profilePicture}`);
      console.log(`\n📋 NFT breakdown:`);
      console.log(`   - Hypio: ${nfts.hypio.length} token(s)`);
      if (nfts.hypio.length > 0) {
        nfts.hypio.forEach((nft) => {
          console.log(`     Token ID: ${nft.tokenId}, Image: ${nft.imageUrl || "N/A"}`);
        });
      }
      console.log(`   - Hypurr: ${nfts.hypurr.length} token(s)`);
      if (nfts.hypurr.length > 0) {
        nfts.hypurr.forEach((nft) => {
          console.log(`     Token ID: ${nft.tokenId}, Image: ${nft.imageUrl || "N/A"}`);
        });
      }
      console.log(`   - Catbal: ${nfts.catbal.length} token(s)`);
      if (nfts.catbal.length > 0) {
        nfts.catbal.forEach((nft) => {
          console.log(`     Token ID: ${nft.tokenId}, Image: ${nft.imageUrl || "N/A"}`);
        });
      }
      
      console.log(`\n📄 Full NFTs object:`);
      console.log(JSON.stringify(nfts, null, 2));
      
    } catch (error) {
      console.error(`❌ Error for address ${address}:`);
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }

  // Test edge cases
  console.log("\n" + "=".repeat(80));
  console.log("\n🔍 Testing Edge Cases\n");
  console.log("=".repeat(80));

  // Test with empty address
  try {
    console.log(`\n📍 Testing with empty address`);
    console.log("-".repeat(80));
    await getNFTs("");
    console.log("❌ Should have thrown an error for empty address");
  } catch (error) {
    console.log(`✅ Correctly threw error: ${error.message}`);
  }

  // Test with null/undefined
  try {
    console.log(`\n📍 Testing with null address`);
    console.log("-".repeat(80));
    await getNFTs(null);
    console.log("❌ Should have thrown an error for null address");
  } catch (error) {
    console.log(`✅ Correctly threw error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Test completed!\n");
}

// Run the test
testGetNFTs().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

