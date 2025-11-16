import { generateProfileImage } from "../services/imageGenerationService.js";
import { getNonceStats } from "../services/getUserNonce.js";
import { getGasStats } from "../services/getGasStats.js";
import { getProtocol } from "../services/getProtocol.js";
import { getPoints } from "../services/getPoints.js";
import { getNFTs } from "../services/getNFTs.js";
import { getNetworth } from "../services/getNetworth.js";
import { getTotalRank } from "../services/getTotalRank.js";
import { getArchetype } from "../services/getArchetype.js";
import { getHypercoreStats } from "../services/getHypercoreStats.js";

/**
 * Format percentile as "Top X%" with inverted value.
 * Inverts the percentile (99% becomes "Top 1%") and formats with appropriate precision.
 */
function formatTopPercentile(percentile) {
  if (percentile === null || percentile === undefined || percentile < 0) {
    return "Top 100%";
  }

  const topPercent = 100 - percentile;

  if (topPercent >= 10) {
    return `Top ${Math.round(topPercent)}%`;
  } else if (topPercent >= 1) {
    return `Top ${topPercent.toFixed(1)}%`;
  } else if (topPercent >= 0.1) {
    return `Top ${topPercent.toFixed(1)}%`;
  } else if (topPercent >= 0.01) {
    return `Top ${topPercent.toFixed(2)}%`;
  } else if (topPercent >= 0.001) {
    return `Top ${topPercent.toFixed(3)}%`;
  } else {
    return `Top ${topPercent.toFixed(3)}%`;
  }
}

/**
 * Fetch user data for image generation
 */
async function fetchUserData(address) {
  // Fetch all data in parallel
  const [nonce, gasStats, protocols, points, nfts, networth, archetype, hypercoreStats] = await Promise.all([
    getNonceStats(address),
    getGasStats(address),
    getProtocol(address),
    getPoints(address),
    getNFTs(address),
    getNetworth(address),
    getArchetype(address),
    getHypercoreStats(address)
  ]);

  let badge = "shrimp";
  if (!nfts.profilePicture.startsWith("http"))
    nfts.profilePicture = "catbal";
  if (networth > 1000) {
    badge = "fish";
    if (!nfts.profilePicture.startsWith("http"))
      nfts.profilePicture = "catbal";
  } if (networth > 10000) {
    badge = "shark";
    if (!nfts.profilePicture.startsWith("http"))
      nfts.profilePicture = "hypio";
  } if (networth > 100000) {
    badge = "whale";
    if (!nfts.profilePicture.startsWith("http"))
      nfts.profilePicture = "hypurr";
  }

  let ogString = "Unknown";
  if (gasStats.earlyPercentile !== null) {
    if (gasStats.earlyPercentile >= 99) {
      ogString = "Joined before 99% of users";
    } else if (gasStats.earlyPercentile >= 95) {
      ogString = "Joined before 95% of users";
    } else if (gasStats.earlyPercentile >= 90) {
      ogString = "Joined before 90% of users";
    } else if (gasStats.earlyPercentile >= 75) {
      ogString = "Joined before 75% of users";
    } else if (gasStats.earlyPercentile >= 50) {
      ogString = "Joined before 50% of users";
    } else {
      ogString = "Joined recently";
    }
  }

  // Calculate total rank score
  const rankData = getTotalRank({
    nonce,
    gasStats,
    protocols,
    points,
    networth
  });

  // Calculate topPoints: top 3 protocols by percentile
  const topPoints = Object.entries(points)
    .filter(([protocol, data]) => data.percentile !== null && data.percentile !== undefined)
    .sort(([, a], [, b]) => (b.percentile || 0) - (a.percentile || 0))
    .slice(0, 3)
    .map(([protocol, data]) => {
      return {
        label: formatTopPercentile(data.percentile),
        icon: protocol
      };
    });

  return {
    rank: rankData.rank,
    avatar: nfts.profilePicture,
    userBadge: badge,
    protocolBadges: protocols,
    topPoints: topPoints,
    general: {
      transactions: gasStats.txCount.toString(),
      og: ogString,
      archetype: archetype.name,
    }
  };
}

/**
 * Helper function to parse and validate data
 */
function parseAndValidateData(data) {
  let parsedData;

  if (typeof data === 'object' && data !== null) {
    parsedData = data;
  } else if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      throw new Error('Invalid JSON format');
    }
  } else {
    throw new Error('Invalid data format');
  }

  // Validate required fields
  if (!parsedData.rank || !parsedData.avatar || !parsedData.userBadge) {
    throw new Error('Missing required fields: rank, avatar, userBadge');
  }

  return parsedData;
}

/**
 * Image generation endpoint - accepts address query param or JSON object in body
 * GET /image?address=0x... - Fetches user data and generates image
 * POST /image - Accepts JSON object in body to generate image
 */
export default async function imageRoute(req, res) {
  try {
    let data;

    // If address is provided as query param, fetch user data first
    if (req.query.address) {
      const address = req.query.address;
      if (!address) {
        return res.status(400).json({ error: "Address required" });
      }
      
      data = await fetchUserData(address);
    } 
    // Otherwise, expect JSON object in request body
    else if (req.body && Object.keys(req.body).length > 0) {
      data = parseAndValidateData(req.body);
    } else {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide an address query parameter (GET /image?address=0x...) or a JSON object in the request body (POST /image)'
      });
    }

    // Generate the image
    const imageBuffer = await generateProfileImage(data);

    // Set headers for image download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="profile-image.png"');
    res.setHeader('Content-Length', imageBuffer.length);

    // Send the image buffer
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(400).json({
      error: 'Error generating image',
      message: error.message
    });
  }
}

