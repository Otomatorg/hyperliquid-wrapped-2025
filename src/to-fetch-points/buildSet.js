import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the input files
const inputDir = path.join(__dirname, 'input');
const pendlePath = path.join(inputDir, 'pendle.json');
const totalHyperbeatUsersPath = path.join(inputDir, 'totalHyperbeatUsers.json');
const hyperlendUsersPath = path.join(inputDir, 'hyperlendUsers.json');

console.log('Reading input files...');
const pendleUsers = JSON.parse(fs.readFileSync(pendlePath, 'utf8'));
const totalHyperbeatUsers = JSON.parse(fs.readFileSync(totalHyperbeatUsersPath, 'utf8'));
const hyperlendUsers = JSON.parse(fs.readFileSync(hyperlendUsersPath, 'utf8'));

console.log(`Pendle users: ${pendleUsers.length}`);
console.log(`Total Hyperbeat users: ${totalHyperbeatUsers.length}`);
console.log(`Hyperlend users: ${hyperlendUsers.length}`);

// Merge pendle.json with totalHyperbeatUsers.json
console.log('\nMerging pendle and totalHyperbeat users...');
const mergedUsers = [...pendleUsers, ...totalHyperbeatUsers];
console.log(`Merged users (before deduplication): ${mergedUsers.length}`);

// Create a Set from hyperlendUsers for efficient lookup
const hyperlendUsersSet = new Set(hyperlendUsers.map(addr => addr.toLowerCase()));

// Remove addresses present in hyperlendUsers.json
console.log('\nRemoving hyperlend users from merged list...');
const filteredUsers = mergedUsers.filter(addr => !hyperlendUsersSet.has(addr.toLowerCase()));

// Remove duplicates from the filtered list
const uniqueUsers = [...new Set(filteredUsers.map(addr => addr.toLowerCase()))];

console.log(`Final unique users: ${uniqueUsers.length}`);
console.log(`Removed ${mergedUsers.length - uniqueUsers.length} addresses (duplicates + hyperlend users)`);

// Output the result
const outputPath = path.join(__dirname, 'output.json');
fs.writeFileSync(outputPath, JSON.stringify(uniqueUsers, null, 2), 'utf8');
console.log(`\nOutput saved to: ${outputPath}`);

