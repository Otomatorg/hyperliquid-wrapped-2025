import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map of project names to arrays of uniqueUsers file paths (relative to src/)
const PROJECTS = {
  'felix': [
    "felix/uniqueUsers.json",
    "felix/uniqueUsers2.json",
    "felix/uniqueUsers3.json",
    "felix/uniqueUsers4.json"
  ],
  'Catbal': [
    "Catbal/uniqueUsers.json"
  ],
  'gas': [],
  'gLiquid': [
    "gliquid/uniqueUsers.json"
  ],
  'hlNames': [
    "hlNames/uniqueUsers.json"
  ],
  'hybrafinance': [
    "hybrafinance/uniqueUsers.json",
    "hybrafinance/uniqueUsers2.json"
  ],
  'hyperbeat': [
    "hyperbeat/totalHyperbeatUsers.json"
  ],
  'hyperlend': [
    "hyperlend/uniqueUsers.json"
  ],
  'hypersurface': [
    "hypersurface/uniqueUsers.json"
  ],
  'hyperswap': [
    "hyperswap/uniqueUsers.json"
  ],
  'Hypio': [
    "Hypio/uniqueUsers.json"
  ],
  'hypurrfi': [
    "hypurrfi/uniqueUsers.json",
    "hypurrfi/uniqueUsers2.json"
  ],
  'HypurrNFT': [
    "HypurrNFT/uniqueUsers.json"
  ],
  'kinetiq': [
    "kinetiq/uniqueUsers.json",
    "kinetiq/uniqueUsers2.json"
  ],
  'morpho': [
    "morpho/uniqueUsers.json",
    "morpho/uniqueUsers2.json"
  ],
  'nonce': [],
  'Nunchi': [
    "Nunchi/uniqueUsers.json"
  ],
  'pendle': [
    "pendle/uniqueUsers.json"
  ],
  'projectx': [
    "projectx/uniqueUsers.json"
  ],
  'rysk': [
    "rysk/uniqueUsers.json"
  ],
  'ultrasolid': [
    "ultrasolid/uniqueUsers.json"
  ],
  'ventuals': [
    "ventuals/uniqueUsers.json",
    "ventuals/uniqueUserswVLP.json"
  ]
};

function loadPointsData() {
  const pointsMap = new Map();
  
  // Points file paths with their protocol mapping
  const pointsFiles = [
    { path: "gliquid/points.json", protocol: "gLiquid" },
    { path: "points.json", protocol: null } // Multiple protocols in one file
  ];
  
  console.log('\n📊 Loading points data...\n');
  
  for (const { path: pointsFile, protocol } of pointsFiles) {
    const filePath = path.join(__dirname, pointsFile);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Warning: ${pointsFile} does not exist, skipping...`);
      continue;
    }
    
    try {
      console.log(`  Loading ${pointsFile}...`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const pointsData = JSON.parse(fileContent);
      
      if (!Array.isArray(pointsData)) {
        console.warn(`  ⚠️  Warning: ${pointsFile} does not contain an array, skipping...`);
        continue;
      }
      
      pointsData.forEach(entry => {
        if (!entry.address) return;
        
        const normalizedAddr = entry.address.toLowerCase();
        
        // Initialize points object if not exists
        if (!pointsMap.has(normalizedAddr)) {
          pointsMap.set(normalizedAddr, {});
        }
        
        const addressPoints = pointsMap.get(normalizedAddr);
        
        // Handle gliquid format: { address, points, rank }
        if (protocol) {
          const points = parseFloat(entry.points) || 0;
          if (points > 0) {
            addressPoints[protocol] = points;
          }
        } 
        // Handle to-fetch-points format: { address, hyperbeat, hyperlend, felix, ... }
        else {
          // Add each protocol's points to the object
          Object.keys(entry).forEach(key => {
            if (key !== 'address') {
              const points = parseFloat(entry[key]) || 0;
              if (points > 0) {
                // If protocol already exists, sum the points
                addressPoints[key] = (addressPoints[key] || 0) + points;
              }
            }
          });
        }
      });
      
      console.log(`  ✓ ${pointsFile}: ${pointsData.length} entries processed`);
    } catch (error) {
      console.error(`  ✗ Error reading ${pointsFile}:`, error.message);
    }
  }
  
  console.log(`\n  Total addresses with points: ${pointsMap.size}`);
  return pointsMap;
}

async function buildGlobalUserMap() {
  try {
    // Load points data first
    const pointsMap = loadPointsData();
    
    // Map to store address -> array of projects
    const addressToProjects = new Map();
    let totalFilesProcessed = 0;
    let totalAddressesFound = 0;
    
    // Process each project
    for (const [projectName, filePaths] of Object.entries(PROJECTS)) {
      if (filePaths.length === 0) {
        console.log(`⚠️  ${projectName}: No uniqueUsers*.json files specified`);
        continue;
      }
      
      console.log(`\n📁 ${projectName} (${filePaths.length} file(s)):`);
      
      // Read each uniqueUsers file for this project
      for (const relativeFilePath of filePaths) {
        const filePath = path.join(__dirname, relativeFilePath);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`  ⚠️  Warning: ${relativeFilePath} does not exist, skipping...`);
          continue;
        }
        
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const addresses = JSON.parse(fileContent);
          
          if (!Array.isArray(addresses)) {
            console.warn(`  ⚠️  Warning: ${path.basename(filePath)} does not contain an array, skipping...`);
            continue;
          }
          
          let addressesAdded = 0;
          addresses.forEach(addr => {
            if (typeof addr === 'string' && addr.startsWith('0x')) {
              // Normalize address to lowercase for consistency
              const normalizedAddr = addr.toLowerCase();
              
              // Initialize array if address not seen before
              if (!addressToProjects.has(normalizedAddr)) {
                addressToProjects.set(normalizedAddr, []);
              }
              
              // Add project if not already in the list
              const projects = addressToProjects.get(normalizedAddr);
              if (!projects.includes(projectName)) {
                projects.push(projectName);
                addressesAdded++;
              }
            }
          });
          
          totalAddressesFound += addresses.length;
          totalFilesProcessed++;
          
          console.log(`  ✓ ${path.basename(filePath)}: ${addresses.length} addresses (${addressesAdded} new for this project)`);
        } catch (error) {
          console.error(`  ✗ Error reading ${path.basename(filePath)}:`, error.message);
        }
      }
    }
    
    // Convert Map to object and sort projects arrays, add points
    const addressMap = {};
    addressToProjects.forEach((projects, address) => {
      const points = pointsMap.get(address) || {};
      addressMap[address] = {
        protocols: projects.sort(),
        points: points
      };
    });
    
    // Sort addresses alphabetically
    const sortedAddressMap = {};
    Object.keys(addressMap)
      .sort()
      .forEach(address => {
        sortedAddressMap[address] = addressMap[address];
      });
    
    // Output statistics
    console.log('\n=== Summary ===');
    console.log(`Total projects checked: ${Object.keys(PROJECTS).length}`);
    console.log(`Total files processed: ${totalFilesProcessed}`);
    console.log(`Total addresses found: ${totalAddressesFound}`);
    console.log(`Unique addresses: ${Object.keys(sortedAddressMap).length}`);
    
    // Count addresses with points
    const addressesWithPoints = Object.values(sortedAddressMap).filter(addr => {
      const pointsObj = addr.points || {};
      return Object.keys(pointsObj).length > 0;
    }).length;
    console.log(`Addresses with points: ${addressesWithPoints}`);
    
    // Count addresses with 0 points and analyze their protocols
    const addressesWithZeroPointsList = Object.values(sortedAddressMap).filter(addr => {
      const pointsObj = addr.points || {};
      return Object.keys(pointsObj).length === 0;
    });
    const addressesWithZeroPoints = addressesWithZeroPointsList.length;
    console.log(`Addresses with 0 points: ${addressesWithZeroPoints}`);
    
    // Count protocols used by addresses with 0 points
    const protocolCountForZeroPoints = {};
    addressesWithZeroPointsList.forEach(addr => {
      addr.protocols.forEach(protocol => {
        protocolCountForZeroPoints[protocol] = (protocolCountForZeroPoints[protocol] || 0) + 1;
      });
    });
    
    // Sort protocols by count (descending)
    const sortedProtocolCount = Object.entries(protocolCountForZeroPoints)
      .sort((a, b) => b[1] - a[1]);
    
    console.log('\n=== Protocols used by addresses with 0 points ===');
    sortedProtocolCount.forEach(([protocol, count]) => {
      console.log(`  ${protocol}: ${count}`);
    });
    
    // Calculate total points across all protocols
    let totalPoints = 0;
    Object.values(sortedAddressMap).forEach(addr => {
      const pointsObj = addr.points || {};
      Object.values(pointsObj).forEach(points => {
        totalPoints += parseFloat(points) || 0;
      });
    });
    console.log(`Total points: ${totalPoints.toLocaleString()}`);
    
    // Count addresses by number of projects
    const projectCountStats = {};
    Object.values(sortedAddressMap).forEach(addressData => {
      const count = addressData.protocols.length;
      projectCountStats[count] = (projectCountStats[count] || 0) + 1;
    });
    
    console.log('\n=== Addresses by Project Count ===');
    Object.keys(projectCountStats)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(count => {
        console.log(`  ${count} project(s): ${projectCountStats[count]} addresses`);
      });
    
    // Write to output file
    const outputPath = path.join(__dirname, 'globalUniqueUsers.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(sortedAddressMap, null, 2),
      'utf8'
    );
    
    console.log(`\n✅ Global unique users map saved to: ${path.relative(process.cwd(), outputPath)}`);
    
    return sortedAddressMap;
  } catch (error) {
    console.error('Error building global user map:', error);
    throw error;
  }
}

// Run the script
buildGlobalUserMap()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to build global user map:', error);
    process.exit(1);
  });

