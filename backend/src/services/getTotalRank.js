// No longer need to import fetch functions - we'll receive the data as parameters

/**
 * Calculate points based on percentile for nonce or early rank.
 * 
 * @param {number} percentile - The percentile (0-100, where 100 = best)
 * @returns {number} - Points awarded based on percentile threshold
 */
function calculatePointsFromPercentile(percentile) {
  if (percentile === null || percentile === undefined || percentile < 0) {
    return 0;
  }

  // Check thresholds from highest to lowest
  if (percentile >= 99.99) {
    return 300; // top 0.01%
  } else if (percentile >= 99.9) {
    return 150; // top 0.1%
  } else if (percentile >= 99) {
    return 75; // top 1%
  } else if (percentile >= 97.5) {
    return 45; // top 2.5%
  } else if (percentile >= 95) {
    return 35; // top 5%
  } else if (percentile >= 92.5) {
    return 27; // top 7.5%
  } else if (percentile >= 87.5) {
    return 20; // top 12.5%
  } else if (percentile >= 75) {
    return 10; // top 25%
  } else if (percentile >= 50) {
    return 5; // top 50%
  } else if (percentile >= 25) {
    return 3; // top 75%
  } else if (percentile >= 10) {
    return 1; // top 90%
  } else {
    return 0; // below top 90%
  }
}

/**
 * Get networth multiplier based on USD value.
 * 
 * @param {number} networth - Networth in USD
 * @returns {number} - Multiplier value
 */
function getNetworthMultiplier(networth) {
  if (!networth || networth < 0) {
    return 1; // Default multiplier for 0 or negative networth
  }

  if (networth >= 10000000) {
    return 100; // 10M+
  } else if (networth >= 1000000) {
    return 50; // 1M-10M
  } else if (networth >= 500000) {
    return 25; // 500k-1M
  } else if (networth >= 100000) {
    return 15; // 100k-500k
  } else if (networth >= 25000) {
    return 7; // 25k-100k
  } else if (networth >= 10000) {
    return 4; // 10k-25k
  } else if (networth >= 2500) {
    return 2; // 2.5k-10k
  } else if (networth >= 1000) {
    return 1.5; // 1k-2.5k
  } else if (networth >= 250) {
    return 1.25; // 250-1k
  } else {
    return 1; // 0-250
  }
}

/**
 * Protocol points mapping (case-insensitive matching).
 * Protocol names should be normalized to lowercase for lookup.
 */
const PROTOCOL_POINTS = {
  rysk: 20,
  hypersurface: 40,
  nunchi: 15,
  hyperbeat: 10,
  kinetiq: 5,
  hyperlend: 5,
  hypurrfi: 7,
  felix: 7,
  hypurr: 150,
  hypio: 40,
  catbal: 25,
  hlnames: 20,
  "hl names": 20,
  morpho: 10,
  theo: 15,
  pendle: 20,
  prjx: 15,
  projectx: 15,
  hyperswap: 15,
  gliquid: 20,
  hybra: 20,
  ventuals: 25,
  ultrasolid: 0, // Will be added if needed
  upshift: 5, // Will be added if needed
  hyperdrive: 2, // Will be added if needed
};

/**
 * Protocol percentile multiplier scales.
 * Each protocol has a multiplier scale based on percentile thresholds.
 * Format: { protocol: { percentileThreshold: multiplier } }
 * 
 * Percentile thresholds (where 100 = best):
 * - 99.99 = top 0.01%
 * - 99.9 = top 0.1%
 * - 99 = top 1%
 * - 97.5 = top 2.5%
 * - 95 = top 5%
 * - 90 = top 10%
 * - 75 = top 25%
 * - 50 = top 50%
 * - 25 = top 75%
 * 
 * Multipliers are applied to base protocol points.
 */
const PROTOCOL_PERCENTILE_MULTIPLIERS = {
  // High prestige protocols - very competitive
  hyperbeat: {
    99.99: 400,  // top 0.01%
    99.9: 150,   // top 0.1%
    99: 50,      // top 1%
    97.5: 30,    // top 2.5%
    95: 20,       // top 5%
    90: 10,       // top 10%
    75: 5,       // top 25%
    50: 2.5,     // top 50%
    25: 1.2,     // top 75%
  },
  felix: {
    99.99: 400,  // top 0.01%
    99.9: 150,   // top 0.1%
    99: 50,      // top 1%
    97.5: 30,    // top 2.5%
    95: 20,       // top 5%
    90: 10,       // top 10%
    75: 5,       // top 25%
    50: 2.5,     // top 50%
    25: 1.2,     // top 75%
  },
  
  hypurrfi: {
    99.99: 400,  // top 0.01%
    99.9: 150,   // top 0.1%
    99: 50,      // top 1%
    97.5: 30,    // top 2.5%
    95: 20,       // top 5%
    90: 10,       // top 10%
    75: 5,       // top 25%
    50: 2.5,     // top 50%
    25: 1.2,     // top 75%
  },
  
  // Medium-high prestige protocols
  ventuals: {
    99.99: 80,   // top 0.01%
    99.9: 40,    // top 0.1%
    99: 20,      // top 1%
    97.5: 10,     // top 2.5%
    95: 7,       // top 5%
    90: 5,     // top 10%
    75: 3,     // top 25%
    50: 1.3,     // top 50%
    25: 1.1,     // top 75%
  },
  rysk: {
    99.99: 50,   // top 0.01%
    99.9: 10,    // top 0.1%
    99: 5,      // top 1%
    97.5: 2.5,     // top 2.5%
    95: 2,       // top 5%
    90: 1.7,       // top 10%
    75: 1.5,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
  gliquid: {
    99.99: 50,   // top 0.01%
    99.9: 10,    // top 0.1%
    99: 5,      // top 1%
    97.5: 2.5,     // top 2.5%
    95: 2,       // top 5%
    90: 1.7,       // top 10%
    75: 1.5,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
  theo: {
    99.99: 40,   // top 0.01%
    99.9: 20,    // top 0.1%
    99: 8,       // top 1%
    97.5: 4,     // top 2.5%
    95: 2.5,     // top 5%
    90: 1.8,     // top 10%
    75: 1.4,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
  prjx: {
    99.99: 40,   // top 0.01%
    99.9: 20,    // top 0.1%
    99: 8,       // top 1%
    97.5: 4,     // top 2.5%
    95: 2.5,     // top 5%
    90: 1.8,     // top 10%
    75: 1.4,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
  projectx: {
    99.99: 40,   // top 0.01%
    99.9: 20,    // top 0.1%
    99: 8,       // top 1%
    97.5: 4,     // top 2.5%
    95: 2.5,     // top 5%
    90: 1.8,     // top 10%
    75: 1.4,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
  hyperswap: {
    99.99: 40,   // top 0.01%
    99.9: 20,    // top 0.1%
    99: 8,       // top 1%
    97.5: 4,     // top 2.5%
    95: 2.5,     // top 5%
    90: 1.8,     // top 10%
    75: 1.4,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
  
  // Lower prestige protocols
  hyperlend: {
    99.99: 30,   // top 0.01%
    99.9: 15,    // top 0.1%
    99: 6,       // top 1%
    97.5: 3,     // top 2.5%
    95: 2,       // top 5%
    90: 1.5,     // top 10%
    75: 1.3,     // top 25%
    50: 1.1,     // top 50%
    25: 1.05,    // top 75%
  },
  kinetiq: {
    99.99: 100,   // top 0.01%
    99.9: 50,    // top 0.1%
    99: 25,       // top 1%
    97.5: 12.5,     // top 2.5%
    95: 7.5,       // top 5%
    90: 5,     // top 10%
    75: 3,     // top 25%
    50: 2,     // top 50%
    25: 1.25,    // top 75%
  },
  ultrasolid: {
    99.99: 40,   // top 0.01%
    99.9: 20,    // top 0.1%
    99: 8,       // top 1%
    97.5: 4,     // top 2.5%
    95: 2.5,     // top 5%
    90: 1.8,     // top 10%
    75: 1.4,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
  upshift: {
    99.99: 50,   // top 0.01%
    99.9: 25,    // top 0.1%
    99: 10,      // top 1%
    97.5: 5,     // top 2.5%
    95: 3,       // top 5%
    90: 2,       // top 10%
    75: 1.5,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
  hyperdrive: {
    99.99: 40,   // top 0.01%
    99.9: 20,    // top 0.1%
    99: 8,       // top 1%
    97.5: 4,     // top 2.5%
    95: 2.5,     // top 5%
    90: 1.8,     // top 10%
    75: 1.4,     // top 25%
    50: 1.2,     // top 50%
    25: 1.1,     // top 75%
  },
};

/**
 * Get multiplier for a protocol based on percentile.
 * 
 * @param {string} protocol - Protocol name (normalized to lowercase)
 * @param {number} percentile - Percentile value (0-100, where 100 = best)
 * @returns {number} - Multiplier value (defaults to 1 if no multiplier found)
 */
function getProtocolPercentileMultiplier(protocol, percentile) {
  if (!percentile || percentile === null || percentile === undefined || percentile < 0) {
    return 1; // No multiplier if no percentile
  }

  const normalizedProtocol = protocol.toLowerCase().trim();
  const multiplierScale = PROTOCOL_PERCENTILE_MULTIPLIERS[normalizedProtocol];

  if (!multiplierScale) {
    return 1; // No multiplier scale defined for this protocol
  }

  // Find the highest threshold that the percentile meets
  const thresholds = [99.99, 99.9, 99, 97.5, 95, 90, 75, 50, 25];
  
  for (const threshold of thresholds) {
    if (percentile >= threshold && multiplierScale[threshold] !== undefined) {
      return multiplierScale[threshold];
    }
  }

  return 1; // Default to 1x if percentile is below all thresholds
}

/**
 * Calculate protocol points based on the list of protocols used and their percentile ranks.
 * 
 * @param {string[]} protocols - Array of protocol names
 * @param {object} pointsData - Object mapping protocol names to {point, rank, percentile}
 * @returns {object} - Object containing:
 *   - totalPoints: number - Total points from all protocols (with multipliers applied)
 *   - protocolPoints: object - Points per protocol (base points * multiplier)
 *   - protocolMultipliers: object - Multipliers applied per protocol
 */
function calculateProtocolPoints(protocols, pointsData = {}) {
  if (!protocols || !Array.isArray(protocols) || protocols.length === 0) {
    return {
      totalPoints: 0,
      protocolPoints: {},
      protocolMultipliers: {},
    };
  }

  const protocolPoints = {};
  const protocolMultipliers = {};
  let totalPoints = 0;

  for (const protocol of protocols) {
    // Normalize protocol name to lowercase for lookup
    const normalizedProtocol = protocol.toLowerCase().trim();
    
    // Look up base points for this protocol
    const basePoints = PROTOCOL_POINTS[normalizedProtocol] || 0;
    
    if (basePoints > 0) {
      // Get percentile from points data
      const protocolPointsData = pointsData[normalizedProtocol] || pointsData[protocol];
      const percentile = protocolPointsData?.percentile ?? null;
      
      // Get multiplier based on percentile
      const multiplier = getProtocolPercentileMultiplier(normalizedProtocol, percentile);
      
      // Calculate final points (base points * multiplier)
      const finalPoints = basePoints * multiplier;
      
      protocolPoints[protocol] = finalPoints;
      protocolMultipliers[protocol] = multiplier;
      totalPoints += finalPoints;
    }
  }

  return {
    totalPoints,
    protocolPoints,
    protocolMultipliers,
  };
}

/**
 * Get multiplier based on the number of unique protocols used.
 * 
 * @param {number} protocolCount - Number of unique protocols
 * @returns {number} - Multiplier value
 */
function getProtocolCountMultiplier(protocolCount) {
  if (!protocolCount || protocolCount < 2) {
    return 1; // No multiplier for 0 or 1 protocol
  }

  // Multiplier mapping
  const multipliers = {
    2: 1.2,
    3: 1.5,
    4: 2,
    5: 2.5,
    6: 3,
    7: 3.5,
    8: 4,
    9: 5,
    10: 7,
    11: 9,
    12: 11,
    13: 13,
    14: 15,
    15: 16, // Interpolated between 14 (x15) and 16 (x17)
    16: 17,
    17: 19,
    18: 21,
    19: 23,
    20: 25,
    21: 30,
  };

  // For 21+ protocols, use x30
  if (protocolCount >= 21) {
    return 30;
  }

  return multipliers[protocolCount] || 1;
}

/**
 * Calculate total rank score from already-fetched data.
 * 
 * The score is calculated as:
 * (noncePoints + earlyRankPoints + protocolPoints) * networthMultiplier * protocolCountMultiplier
 * 
 * Protocol points are now multiplied based on percentile rank within each protocol.
 * 
 * @param {object} data - Object containing:
 *   - nonce: {value: number, rank: {percentile: number, rank: number, totalAddresses: number} | null}
 *   - gasStats: {earlyPercentile: number | null, earlyRank: number | null, ...}
 *   - protocols: string[] - Array of protocol names
 *   - points: object - Object mapping protocol names to {point, rank, percentile} (optional)
 *   - networth: number - Networth in USD
 * @returns {object} - Object containing:
 *   - score: number - Total calculated score
 *   - noncePoints: number - Points from nonce rank
 *   - earlyRankPoints: number - Points from early rank
 *   - protocolPoints: number - Total points from protocols (with percentile multipliers)
 *   - networthMultiplier: number - Multiplier from networth
 *   - protocolCountMultiplier: number - Multiplier from number of protocols
 *   - networth: number - Networth in USD
 *   - noncePercentile: number | null - Nonce percentile
 *   - earlyPercentile: number | null - Early rank percentile
 *   - protocolCount: number - Number of unique protocols used
 *   - protocols: string[] - List of unique protocols used
 */
export function getTotalRank(data) {
  if (!data) {
    throw new Error("Data object is required");
  }

  const { nonce, gasStats, protocols, points, networth } = data;

  console.log("\n" + "=".repeat(80));
  console.log("📊 CALCULATING TOTAL RANK SCORE");
  console.log("=".repeat(80));

  // Extract percentiles
  const noncePercentile = nonce?.rank?.percentile ?? null;
  const earlyPercentile = gasStats?.earlyPercentile ?? null;

  // Calculate points from percentiles
  const noncePoints = calculatePointsFromPercentile(noncePercentile);
  const earlyRankPoints = calculatePointsFromPercentile(earlyPercentile);

  console.log("\n📈 BASE POINTS:");
  console.log(`   Nonce Points:        ${noncePoints.toFixed(2)} (percentile: ${noncePercentile !== null ? noncePercentile.toFixed(2) + '%' : 'N/A'})`);
  console.log(`   Early Rank Points:   ${earlyRankPoints.toFixed(2)} (percentile: ${earlyPercentile !== null ? earlyPercentile.toFixed(2) + '%' : 'N/A'})`);

  // Calculate protocol points with percentile multipliers
  const protocolData = calculateProtocolPoints(protocols || [], points || {});
  const protocolPoints = protocolData.totalPoints;
  const protocolPointsMap = protocolData.protocolPoints;
  const protocolMultipliers = protocolData.protocolMultipliers;
  
  // Count unique protocols (for multiplier)
  const uniqueProtocols = protocols ? [...new Set(protocols)] : [];
  const protocolCount = uniqueProtocols.length;

  console.log(`\n🏆 PROTOCOL POINTS (${protocolCount} unique protocols):`);
  if (Object.keys(protocolPointsMap).length > 0) {
    // Sort by points (descending)
    const sortedProtocols = Object.entries(protocolPointsMap).sort((a, b) => b[1] - a[1]);
    for (const [protocol, finalPoints] of sortedProtocols) {
      const normalizedProtocol = protocol.toLowerCase().trim();
      const basePoints = PROTOCOL_POINTS[normalizedProtocol] || 0;
      const multiplier = protocolMultipliers[protocol] || 1;
      const protocolPointsData = points?.[normalizedProtocol] || points?.[protocol];
      const percentile = protocolPointsData?.percentile ?? null;
      const percentileStr = percentile !== null ? `${percentile.toFixed(2)}%` : 'N/A';
      
      console.log(`   ${protocol.padEnd(20)} ${finalPoints.toFixed(2).padStart(10)} points (base: ${basePoints}, multiplier: ${multiplier.toFixed(2)}x, percentile: ${percentileStr})`);
    }
    console.log(`   ${'TOTAL'.padEnd(20)} ${protocolPoints.toFixed(2).padStart(10)} points`);
  } else {
    console.log("   (no protocols with points)");
  }

  // Get multipliers
  const networthMultiplier = getNetworthMultiplier(networth || 0);
  const protocolCountMultiplier = getProtocolCountMultiplier(protocolCount);

  console.log(`\n💰 MULTIPLIERS:`);
  console.log(`   Networth:            ${networthMultiplier.toFixed(2)}x (networth: $${(networth || 0).toLocaleString()})`);
  console.log(`   Protocol Count:      ${protocolCountMultiplier.toFixed(2)}x (${protocolCount} protocols)`);

  // Calculate total score
  // Base score = nonce + early rank + protocol points (already includes percentile multipliers)
  const baseScore = noncePoints + earlyRankPoints + protocolPoints;
  // Apply both multipliers
  const totalScore = baseScore * networthMultiplier * protocolCountMultiplier;

  console.log(`\n🧮 SCORE CALCULATION:`);
  console.log(`   Base Score:          ${baseScore.toFixed(2)}`);
  console.log(`   = ${noncePoints.toFixed(2)} (nonce) + ${earlyRankPoints.toFixed(2)} (early rank) + ${protocolPoints.toFixed(2)} (protocols)`);
  console.log(`   × ${networthMultiplier.toFixed(2)} (networth multiplier)`);
  console.log(`   × ${protocolCountMultiplier.toFixed(2)} (protocol count multiplier)`);
  console.log(`   = ${totalScore.toFixed(2)}`);
  console.log(`\n✅ FINAL SCORE: ${Math.round(totalScore * 100) / 100}`);
  console.log("=".repeat(80) + "\n");

  return {
    score: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
    noncePoints,
    earlyRankPoints,
    protocolPoints,
    networthMultiplier,
    protocolCountMultiplier,
    networth: networth || 0,
    noncePercentile,
    earlyPercentile,
    protocolCount,
    protocols: uniqueProtocols,
    // Additional details for debugging/display
    details: {
      nonceValue: nonce?.value ?? null,
      nonceRank: nonce?.rank?.rank ?? null,
      earlyRank: gasStats?.earlyRank ?? null,
      protocolPointsMap, // Points per protocol (with multipliers)
      protocolMultipliers, // Multipliers applied per protocol
    }
  };
}

