import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findUniqueUsersFiles(dir) {
  const files = fs.readdirSync(dir);
  const fileList = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Only process files (not directories) that match the pattern
    if (stat.isFile() && file.match(/^uniqueUsers.*\.json$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

async function buildGlobalUserList() {
  try {
    // Find all uniqueUsers*.json files in the hyperbeat folder
    const files = findUniqueUsersFiles(__dirname);
    
    console.log(`Found ${files.length} uniqueUsers*.json files`);
    
    // Use a Set to automatically handle uniqueness
    const uniqueAddresses = new Set();
    let totalAddresses = 0;
    
    // Read each file and collect addresses
    for (const file of files) {
      try {
        const fileContent = fs.readFileSync(file, 'utf8');
        const addresses = JSON.parse(fileContent);
        
        if (!Array.isArray(addresses)) {
          console.warn(`Warning: ${file} does not contain an array, skipping...`);
          continue;
        }
        
        const beforeCount = uniqueAddresses.size;
        addresses.forEach(addr => {
          if (typeof addr === 'string' && addr.startsWith('0x')) {
            uniqueAddresses.add(addr);
          }
        });
        
        const added = uniqueAddresses.size - beforeCount;
        totalAddresses += addresses.length;
        
        console.log(`  ${path.basename(file)}: ${addresses.length} addresses (${added} new unique)`);
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message);
      }
    }
    
    // Convert Set to sorted array
    const sortedAddresses = Array.from(uniqueAddresses).sort();
    
    // Output statistics
    console.log('\n=== Summary ===');
    console.log(`Total files processed: ${files.length}`);
    console.log(`Total addresses found: ${totalAddresses}`);
    console.log(`Unique addresses: ${sortedAddresses.length}`);
    console.log(`Duplicates removed: ${totalAddresses - sortedAddresses.length}`);
    
    // Write to output file
    const outputPath = path.join(__dirname, 'globalUniqueUsers.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(sortedAddresses, null, 2),
      'utf8'
    );
    
    console.log(`\n✅ Global unique users list saved to: ${path.basename(outputPath)}`);
    
    return sortedAddresses;
  } catch (error) {
    console.error('Error building global user list:', error);
    throw error;
  }
}

// Run the script
buildGlobalUserList()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to build global user list:', error);
    process.exit(1);
  });

