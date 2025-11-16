import { getNonceStats } from "../services/getUserNonce.js";
import { getGasStats } from "../services/getGasStats.js";
import { getProtocol } from "../services/getProtocol.js";
import { getPoints } from "../services/getPoints.js";
import { getNFTs } from "../services/getNFTs.js";
import { getNetworth } from "../services/getNetworth.js";
import { getTotalRank } from "../services/getTotalRank.js";
import { getArchetype } from "../services/getArchetype.js";
import { getHypercoreStats } from "../services/getHypercoreStats.js";

export default async function userRoute(req, res) {
  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    // Fetch nonce, gas stats, protocols, points, NFTs, networth, archetype, and Hypercore stats in parallel
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

    // Calculate days since first activity
    let daysSinceFirstActivity = null;
    let firstActivityDate = null;

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

    if (gasStats.firstTxTimestamp) {
      const firstTxDate = new Date(gasStats.firstTxTimestamp * 1000);
      const now = new Date();
      daysSinceFirstActivity = Math.floor((now - firstTxDate) / (1000 * 60 * 60 * 24));
      firstActivityDate = firstTxDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
    }

    // Structure gas data similar to nonce
    const gas = {
      value: gasStats.totalGasEth || 0,
      rank: gasStats.rank !== null ? {
        rank: gasStats.rank,
        totalAddresses: gasStats.totalAddresses,
        percentile: gasStats.percentile
      } : null
    };

    // Format early rank object
    let earlyRank = null;
    let ogString = "Unknown";
    if (gasStats.earlyRank !== null && gasStats.earlyPercentile !== null) {
      const percentileRounded = Math.round(gasStats.earlyPercentile);
      earlyRank = {
        rank: gasStats.earlyRank,
        percentile: percentileRounded
      };
      
      // Format OG string based on percentile
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

    // Calculate total rank score from the fetched data
    const rankData = getTotalRank({
      nonce,
      gasStats,
      protocols,
      points,
      networth
    });

    // Calculate topPoints: top 3 protocols by percentile (or all if less than 3)
    const topPoints = Object.entries(points)
      .filter(([protocol, data]) => data.percentile !== null && data.percentile !== undefined)
      .sort(([, a], [, b]) => (b.percentile || 0) - (a.percentile || 0))
      .slice(0, 3)
      .map(([protocol, data]) => {
        const percentileRounded = Math.round(data.percentile);
        return {
          label: `Top ${percentileRounded}%`,
          icon: protocol
        };
      });

    const response = {
      rank: rankData.score,
      firstActivityDate: firstActivityDate || "Unknown",
      daysSinceFirstActivity: daysSinceFirstActivity || 0,
      gas: gas,
      nonce: {value: nonce.value, rank: nonce.rank},
      EarlyRank: earlyRank,
      HypercoreTrades: hypercoreStats.trades,
      HypercoreVolume: hypercoreStats.volume,
      numberOfProtocolsUsed: protocols.length,
      protocolBadges: protocols,
      topPoints: topPoints,
      allPoints: points,
      avatar: nfts.profilePicture,
      userBadge: badge,
      general: {
        transactions: gasStats.txCount.toString(),
        og: ogString,
        archetype: archetype.name,
        archetypeDescription: archetype.description,
      }
    };

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}