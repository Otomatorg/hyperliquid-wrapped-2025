import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_FILE = path.join(__dirname, 'to-fetch.json');
const OUTPUT_FILE = path.join(__dirname, 'hyperlendPoints.json');

// Delay function to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch points for a single address
async function fetchPointsForAddress(address, index, total) {
  try {
    console.log(`[${index + 1}/${total}] Fetching points for ${address}...`);
    
    const response = await fetch(
      `https://app.hyperbeat.org/api/hyperfolio/points?address=${address}`,
      {
        method: "GET",
        redirect: "follow"
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract all protocol points from the points array
    const pointsData = {
      address: address
    };
    
    if (data.points && Array.isArray(data.points)) {
      // Extract points for each protocol
      data.points.forEach(point => {
        if (point.name && point.balance !== undefined) {
          // Use lowercase protocol name as key
          const protocolKey = point.name.toLowerCase();
          pointsData[protocolKey] = point.balance || '0';
        }
      });
    }
    
    // Log all protocols found
    const protocols = Object.keys(pointsData).filter(key => key !== 'address');
    console.log(`  ✓ [${index + 1}/${total}] Success: Found ${protocols.length} protocols for ${address}`);
    
    return { success: true, data: pointsData };
    
  } catch (error) {
    console.log(`  ✗ [${index + 1}/${total}] Error for ${address}: ${error.message}`);
    return { 
      success: false, 
      data: { address: address },
      error: error.message 
    };
  }
}

async function fetchPointsForAllAddresses() {
  try {
    // Read unique addresses
    console.log(`Reading addresses from ${INPUT_FILE}...`);
    const addresses = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    if (!Array.isArray(addresses)) {
      throw new Error('Input file must contain an array of addresses');
    }
    
    // Check if output file exists and load existing results
    let existingResults = [];
    let alreadyFetchedAddresses = new Set();
    
    if (fs.existsSync(OUTPUT_FILE)) {
      try {
        existingResults = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        if (Array.isArray(existingResults)) {
          existingResults.forEach(result => {
            if (result.address) {
              alreadyFetchedAddresses.add(result.address.toLowerCase());
            }
          });
          console.log(`📂 Found existing results: ${existingResults.length} addresses already fetched`);
        }
      } catch (error) {
        console.log(`⚠️  Could not read existing output file: ${error.message}`);
        console.log('   Starting fresh...');
      }
    }
    
    // Filter out addresses that have already been fetched
    const addressesToFetch = addresses.filter(addr => 
      !alreadyFetchedAddresses.has(addr.toLowerCase())
    );
    
    console.log(`Found ${addresses.length} total addresses`);
    console.log(`✅ Already fetched: ${alreadyFetchedAddresses.size}`);
    console.log(`🔄 Remaining to fetch: ${addressesToFetch.length}`);
    
    if (addressesToFetch.length === 0) {
      console.log('\n✨ All addresses have already been fetched!');
      return;
    }
    
    console.log('Starting to fetch points in parallel batches...\n');
    
    const results = [...existingResults]; // Start with existing results
    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 50;
    
    // Process addresses in batches
    for (let i = 0; i < addressesToFetch.length; i += BATCH_SIZE) {
      const batch = addressesToFetch.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(addressesToFetch.length / BATCH_SIZE);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} addresses)...`);
      
      // Process batch in parallel
      const batchPromises = batch.map((address, batchIndex) => 
        fetchPointsForAddress(address, i + batchIndex, addressesToFetch.length)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // Process results
      batchResults.forEach(result => {
        results.push(result.data);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });
      
      // Save progress after each batch
      const newlyFetched = results.length - existingResults.length;
      console.log(`💾 Saving progress... (${newlyFetched}/${addressesToFetch.length} newly fetched, ${results.length}/${addresses.length} total)`);
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8');
      
      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < addressesToFetch.length) {
        await delay(100); // 100ms delay between batches
      }
    }
    
    // Save final results
    console.log('\n💾 Saving final results...');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8');
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ Finished fetching points!');
    console.log(`📁 Output file: ${OUTPUT_FILE}`);
    console.log(`✅ Successful (this run): ${successCount}`);
    console.log(`❌ Errors (this run): ${errorCount}`);
    console.log(`📊 Total addresses in file: ${addresses.length}`);
    console.log(`📊 Total results saved: ${results.length}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
fetchPointsForAllAddresses();

