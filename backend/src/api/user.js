import { getNonceStats } from "../services/getUserNonce.js";
import { getGasStats } from "../services/getGasStats.js";
import { getProtocol } from "../services/getProtocol.js";
import { getPoints } from "../services/getPoints.js";
import { getNFTs } from "../services/getNFTs.js";
import { getNetworth } from "../services/getNetworth.js";

export default async function userRoute(req, res) {
  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    // Fetch nonce, gas stats, protocols, points, and NFTs in parallel
    const [nonce, gasStats, protocols, points, nfts, networth] = await Promise.all([
      getNonceStats(address),
      getGasStats(address),
      getProtocol(address),
      getPoints(address),
      getNFTs(address),
      getNetworth(address)
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

    const response = {
      rank: 123456,
      firstActivityDate: firstActivityDate || "Unknown",
      daysSinceFirstActivity: daysSinceFirstActivity || 0,
      gas: gas,
      nonce: {value: nonce.value, rank: nonce.rank},
      EarlyRank: "#15,000 (top 5%)",
      HypercoreTrades: 42,
      HypercoreVolume: "420k $",
      numberOfProtocolsUsed: protocols.length,
      protocolBadges: protocols,
      userProfile: {
        name: "DeFi Explorer 🧭",
        description: "This user farmed points across many ecosystems."
      },
      topPoints: [
        { label: "Top 10%", icon: "hyperliquid" },
        { label: "Top 25%", icon: "hyperlend" }
      ],
      allPoints: points,
      avatar: nfts.profilePicture,
      userBadge: badge,
      general: {
        transactions: gasStats.txCount.toString(),
        og: "Joined before 90% of users",
        archetype: "Yield Alchemist",
      }
    };

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}