import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const GLOBAL_UNIQUE_USERS_FILE = path.join(__dirname, '..', 'globalUniqueUsers.json');
const HYPERLEND_USERS_FILE = path.join(__dirname, 'hyperlendUsers.json');
const ALREADY_FETCHED_FILE = path.join(__dirname, 'alreadyFetched.json');
const OUTPUT_FILE = path.join(__dirname, 'dataset.json');

function buildDataset() {
  try {
    console.log('Loading files...');
    
    // Load global unique users
    console.log(`  Reading ${path.basename(GLOBAL_UNIQUE_USERS_FILE)}...`);
    const globalUniqueUsers = JSON.parse(fs.readFileSync(GLOBAL_UNIQUE_USERS_FILE, 'utf8'));
    if (!Array.isArray(globalUniqueUsers)) {
      throw new Error('globalUniqueUsers.json must contain an array');
    }
    console.log(`    Found ${globalUniqueUsers.length} global unique users`);
    
    // Load hyperlend users (to exclude)
    console.log(`  Reading ${path.basename(HYPERLEND_USERS_FILE)}...`);
    const hyperlendUsers = JSON.parse(fs.readFileSync(HYPERLEND_USERS_FILE, 'utf8'));
    if (!Array.isArray(hyperlendUsers)) {
      throw new Error('hyperlendUsers.json must contain an array');
    }
    console.log(`    Found ${hyperlendUsers.length} hyperlend users to exclude`);
    
    // Load already fetched users (to exclude)
    console.log(`  Reading ${path.basename(ALREADY_FETCHED_FILE)}...`);
    const alreadyFetched = JSON.parse(fs.readFileSync(ALREADY_FETCHED_FILE, 'utf8'));
    if (!Array.isArray(alreadyFetched)) {
      throw new Error('alreadyFetched.json must contain an array');
    }
    console.log(`    Found ${alreadyFetched.length} already fetched users to exclude`);
    
    // Create Sets for efficient lookup (normalize to lowercase for comparison)
    console.log('\nCreating exclusion sets...');
    const hyperlendUsersSet = new Set(
      hyperlendUsers.map(addr => addr.toLowerCase())
    );
    const alreadyFetchedSet = new Set(
      alreadyFetched.map(addr => addr.toLowerCase())
    );
    
    // Combine exclusion sets
    const exclusionSet = new Set([...hyperlendUsersSet, ...alreadyFetchedSet]);
    console.log(`  Total unique addresses to exclude: ${exclusionSet.size}`);
    
    // Filter global unique users to exclude hyperlend users and already fetched
    console.log('\nFiltering dataset...');
    const dataset = globalUniqueUsers.filter(addr => {
      const normalizedAddr = addr.toLowerCase();
      return !exclusionSet.has(normalizedAddr);
    });
    
    // Sort the result
    const sortedDataset = dataset.sort();
    
    // Output statistics
    console.log('\n=== Summary ===');
    console.log(`Global unique users: ${globalUniqueUsers.length}`);
    console.log(`Hyperlend users excluded: ${hyperlendUsers.length}`);
    console.log(`Already fetched excluded: ${alreadyFetched.length}`);
    console.log(`Total excluded (unique): ${exclusionSet.size}`);
    console.log(`Remaining in dataset: ${sortedDataset.length}`);
    
    // Write to output file
    console.log(`\nWriting dataset to ${path.basename(OUTPUT_FILE)}...`);
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(sortedDataset, null, 2),
      'utf8'
    );
    
    console.log(`\n✅ Done! Dataset saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error building dataset:', error.message);
    process.exit(1);
  }
}

buildDataset();

