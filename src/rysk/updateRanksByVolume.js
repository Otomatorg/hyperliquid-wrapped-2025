import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the scraped data
const dataFile = path.join(__dirname, 'scrapedData.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

console.log(`📊 Loaded ${data.length} entries`);

// Separate entries with and without volume
const entriesWithVolume = [];

// Process entries and prepare for ranking
data.forEach(entry => {
  if (entry.volume !== null && entry.volume !== undefined && entry.volume !== '') {
    const volumeNum = parseFloat(entry.volume);
    if (!isNaN(volumeNum) && volumeNum > 0) {
      entriesWithVolume.push({
        address: entry.address,
        volume: volumeNum,
        entry: entry  // Direct reference to the entry in data array
      });
    }
  }
});

console.log(`  ✓ ${entriesWithVolume.length} entries with valid volume`);
console.log(`  ✓ ${data.length - entriesWithVolume.length} entries without volume`);

// Sort by volume (descending - highest volume first)
// When volumes are equal, randomize the order
entriesWithVolume.sort((a, b) => {
  if (b.volume !== a.volume) {
    return b.volume - a.volume;
  }
  // Same volume - randomize order
  return Math.random() - 0.5;
});

console.log(`\n🔢 Assigning ranks based on volume...`);

// Assign ranks (1 = highest volume)
// Since we randomized the order for equal volumes, assign sequential ranks
for (let i = 0; i < entriesWithVolume.length; i++) {
  const item = entriesWithVolume[i];
  // Assign sequential rank (i+1) since equal volumes are randomly ordered
  item.entry.rank = (i + 1).toString();
}

console.log(`  ✓ Assigned ranks to ${entriesWithVolume.length} entries`);
console.log(`  ✓ Highest volume: ${entriesWithVolume[0].volume.toLocaleString()} (Rank #${entriesWithVolume[0].entry.rank})`);
console.log(`  ✓ Lowest volume: ${entriesWithVolume[entriesWithVolume.length - 1].volume.toLocaleString()} (Rank #${entriesWithVolume[entriesWithVolume.length - 1].entry.rank})`);

// The data array is already updated since we modified entries by reference
const updatedData = data;

// Save the updated data
fs.writeFileSync(dataFile, JSON.stringify(updatedData, null, 2));
console.log(`\n✅ Updated ranks saved to ${dataFile}`);

// Also update the progress file if it exists
const progressFile = path.join(__dirname, 'scrapedData_progress.json');
if (fs.existsSync(progressFile)) {
  fs.writeFileSync(progressFile, JSON.stringify(updatedData, null, 2));
  console.log(`✅ Updated ranks saved to ${progressFile}`);
}

// Print some statistics
const rankDistribution = {};
updatedData.forEach(entry => {
  if (entry.rank && entry.rank !== '0' && entry.rank !== null) {
    const rank = parseInt(entry.rank);
    if (!isNaN(rank)) {
      const range = Math.floor(rank / 100) * 100;
      rankDistribution[range] = (rankDistribution[range] || 0) + 1;
    }
  }
});

console.log(`\n📈 Rank Distribution:`);
Object.keys(rankDistribution)
  .sort((a, b) => parseInt(a) - parseInt(b))
  .forEach(range => {
    console.log(`  Rank ${range}-${parseInt(range) + 99}: ${rankDistribution[range]} users`);
  });

