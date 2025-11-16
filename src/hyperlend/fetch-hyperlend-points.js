import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_FILE = path.join(__dirname, 'uniqueUsers.json');
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
    // Load existing results if file exists
    let existingResults = [];
    const existingAddresses = new Set();
    
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log(`Loading existing results from ${OUTPUT_FILE}...`);
      try {
        existingResults = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        if (Array.isArray(existingResults)) {
          existingResults.forEach(result => {
            if (result.address) {
              existingAddresses.add(result.address.toLowerCase());
            }
          });
          console.log(`Found ${existingResults.length} existing results`);
        }
      } catch (error) {
        console.log(`Warning: Could not parse existing results file: ${error.message}`);
        console.log('Starting fresh...');
      }
    }
    
    // Read unique addresses
    console.log(`Reading addresses from ${INPUT_FILE}...`);
    const addresses = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    if (!Array.isArray(addresses)) {
      throw new Error('Input file must contain an array of addresses');
    }
    
    // Filter out addresses that are already in results
    const addressesToFetch = addresses.filter(address => 
      !existingAddresses.has(address.toLowerCase())
    );
    
    console.log(`Found ${addresses.length} total addresses`);
    console.log(`Already processed: ${addresses.length - addressesToFetch.length}`);
    console.log(`Remaining to fetch: ${addressesToFetch.length}`);
    
    if (addressesToFetch.length === 0) {
      console.log('\n✨ All addresses have already been processed!');
      return;
    }
    
    console.log('Starting to fetch points in parallel batches of 50...\n');
    
    const results = [...existingResults]; // Start with existing results
    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 50;
    
    // Process addresses in batches of 50
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
      console.log(`💾 Saving progress... (${results.length}/${addresses.length} total, ${i + batch.length}/${addressesToFetch.length} new)`);
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
    console.log(`✅ Successful (new): ${successCount}`);
    console.log(`❌ Errors (new): ${errorCount}`);
    console.log(`📊 Total addresses: ${addresses.length}`);
    console.log(`📊 Total results: ${results.length}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
fetchPointsForAllAddresses();

