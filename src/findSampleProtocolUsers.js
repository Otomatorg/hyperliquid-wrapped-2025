import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads globalUniqueUsers.json and returns:
 * 1. Top 100 users of each protocol for which we have points
 * 2. A sample of 10 random users for protocols in which we don't have points
 * 3. A list of 10 addresses that don't have points on any protocol and interacted with only 1 protocol
 * 4. Top 250 users that interacted with the most protocols
 */
function findSampleProtocolUsers() {
  console.log('📊 Loading globalUniqueUsers.json...\n');
  
  const filePath = path.join(__dirname, 'globalUniqueUsers.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Step 1: Identify all protocols and which ones have points
  const allProtocols = new Set();
  const protocolsWithPoints = new Set();
  const usersByProtocol = new Map(); // protocol -> array of { address, points }
  const usersWithoutPoints = []; // addresses with no points and only 1 protocol
  const usersByProtocolCount = []; // array of { address, protocolCount, protocols }
  
  // Process all users
  for (const [address, userData] of Object.entries(data)) {
    const { protocols = [], points = {} } = userData;
    
    // Track all protocols
    protocols.forEach(protocol => {
      allProtocols.add(protocol);
      
      // Initialize array for this protocol if needed
      if (!usersByProtocol.has(protocol)) {
        usersByProtocol.set(protocol, []);
      }
    });
    
    // Check which protocols have points
    Object.keys(points).forEach(protocol => {
      protocolsWithPoints.add(protocol);
    });
    
    // For each protocol the user interacted with, add them to the list
    protocols.forEach(protocol => {
      const userPoints = points[protocol] || 0;
      usersByProtocol.get(protocol).push({
        address,
        points: userPoints
      });
    });
    
    // Track users with no points and only 1 protocol
    const hasNoPoints = Object.keys(points).length === 0 || 
                       Object.values(points).every(p => p === 0 || p === null || p === undefined);
    if (hasNoPoints && protocols.length === 1) {
      usersWithoutPoints.push(address);
    }
    
    // Track all users with their protocol count for top 250
    if (protocols.length > 0) {
      usersByProtocolCount.push({
        address,
        protocolCount: protocols.length,
        protocols: protocols
      });
    }
  }
  
  console.log(`✅ Loaded ${Object.keys(data).length} users`);
  console.log(`📋 Found ${allProtocols.size} unique protocols\n`);
  
  // Step 2: Get top 100 users for protocols with points
  const topUsersByProtocol = {};
  for (const protocol of protocolsWithPoints) {
    const users = usersByProtocol.get(protocol) || [];
    // Sort by points descending and take top 100
    const topUsers = users
      .filter(u => u.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 100)
      .map(u => ({
        address: u.address,
        points: u.points
      }));
    
    if (topUsers.length > 0) {
      topUsersByProtocol[protocol] = topUsers;
    }
  }
  
  // Step 3: Get 10 random users for protocols without points
  const randomUsersByProtocol = {};
  const protocolsWithoutPoints = Array.from(allProtocols).filter(
    protocol => !protocolsWithPoints.has(protocol)
  );
  
  for (const protocol of protocolsWithoutPoints) {
    const users = usersByProtocol.get(protocol) || [];
    // Shuffle and take 10 random users
    const shuffled = users.sort(() => Math.random() - 0.5);
    const randomUsers = shuffled.slice(0, 10).map(u => ({
      address: u.address
    }));
    
    if (randomUsers.length > 0) {
      randomUsersByProtocol[protocol] = randomUsers;
    }
  }
  
  // Step 4: Get 10 random addresses with no points and only 1 protocol
  const shuffledNoPoints = usersWithoutPoints.sort(() => Math.random() - 0.5);
  const sampleNoPointsUsers = shuffledNoPoints.slice(0, 10);
  
  // Step 5: Get top 250 users that interacted with the most protocols
  const topUsersByProtocolCount = usersByProtocolCount
    .sort((a, b) => b.protocolCount - a.protocolCount)
    .slice(0, 250)
    .map(u => ({
      address: u.address,
      protocolCount: u.protocolCount,
      protocols: u.protocols
    }));
  
  // Prepare result
  const result = {
    topUsersByProtocol,
    randomUsersByProtocol,
    noPointsSingleProtocol: sampleNoPointsUsers,
    topUsersByProtocolCount,
    summary: {
      protocolsWithPoints: Array.from(protocolsWithPoints).sort(),
      protocolsWithoutPoints: protocolsWithoutPoints.sort(),
      totalProtocols: allProtocols.size,
      totalUsers: Object.keys(data).length,
      usersWithNoPointsSingleProtocol: usersWithoutPoints.length,
      topProtocolCountUsers: topUsersByProtocolCount.length
    }
  };
  
  return result;
}

// Main execution
try {
  const result = findSampleProtocolUsers();
  
  console.log('\n📊 Results Summary:');
  console.log(`\n✅ Protocols with points: ${result.summary.protocolsWithPoints.length}`);
  console.log(`   ${result.summary.protocolsWithPoints.join(', ')}`);
  console.log(`\n📋 Protocols without points: ${result.summary.protocolsWithoutPoints.length}`);
  console.log(`   ${result.summary.protocolsWithoutPoints.join(', ')}`);
  console.log(`\n👤 Users with no points and single protocol: ${result.summary.usersWithNoPointsSingleProtocol}`);
  
  console.log('\n🏆 Top 100 users by protocol (with points):');
  for (const [protocol, users] of Object.entries(result.topUsersByProtocol)) {
    console.log(`\n  ${protocol}: ${users.length} users`);
    if (users.length > 0) {
      console.log(`    Top 3: ${users.slice(0, 3).map(u => `${u.address} (${u.points.toFixed(2)} pts)`).join(', ')}`);
    }
  }
  
  console.log('\n🎲 Random 10 users by protocol (without points):');
  for (const [protocol, users] of Object.entries(result.randomUsersByProtocol)) {
    console.log(`\n  ${protocol}:`);
    users.forEach((user, idx) => {
      console.log(`    ${idx + 1}. ${user.address}`);
    });
  }
  
  console.log('\n🔍 10 addresses with no points and single protocol:');
  result.noPointsSingleProtocol.forEach((address, idx) => {
    console.log(`  ${idx + 1}. ${address}`);
  });
  
  console.log('\n🌟 Top 250 users by protocol count:');
  const top10ByCount = result.topUsersByProtocolCount.slice(0, 10);
  top10ByCount.forEach((user, idx) => {
    console.log(`  ${idx + 1}. ${user.address} - ${user.protocolCount} protocols: ${user.protocols.join(', ')}`);
  });
  console.log(`  ... and ${result.topUsersByProtocolCount.length - 10} more users`);
  
  // Save results to JSON file
  const outputPath = path.join(__dirname, 'sampleProtocolUsers.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n💾 Results saved to ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

