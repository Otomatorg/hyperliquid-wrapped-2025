import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing the uniqueUsers JSON files
const hyperbeatDir = __dirname;

// Get all uniqueUsers*.json files
const files = fs.readdirSync(hyperbeatDir)
  .filter(file => file.startsWith('uniqueUsers') && file.endsWith('.json'))
  .sort(); // Sort for consistent processing

console.log(`Found ${files.length} uniqueUsers JSON files:`);
files.forEach(file => console.log(`  - ${file}`));

// Create a Set to store all unique addresses
const uniqueUsersSet = new Set();

// Read each file and add addresses to the set
files.forEach((file, index) => {
  const filePath = path.join(hyperbeatDir, file);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const addresses = JSON.parse(data);
    
    if (!Array.isArray(addresses)) {
      console.warn(`Warning: ${file} does not contain an array, skipping...`);
      return;
    }
    
    addresses.forEach(address => {
      if (typeof address === 'string' && address.trim()) {
        uniqueUsersSet.add(address.trim());
      }
    });
    
    console.log(`✓ Processed ${file}: ${addresses.length} addresses (${addresses.length - addresses.filter(a => uniqueUsersSet.has(a)).length} duplicates in this file)`);
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
});

// Convert Set to sorted array
const megaUniqueUsers = Array.from(uniqueUsersSet).sort();

// Output file
const outputFile = path.join(hyperbeatDir, 'megaUniqueUsers.json');

// Write to file
fs.writeFileSync(outputFile, JSON.stringify(megaUniqueUsers, null, 2), 'utf8');

console.log('\n' + '='.repeat(60));
console.log(`✨ Successfully created mega unique users set!`);
console.log(`📁 Output file: ${outputFile}`);
console.log(`👥 Total unique users: ${megaUniqueUsers.length}`);
console.log('='.repeat(60));

