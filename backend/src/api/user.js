import { getNonceStats } from "../services/getUserNonce.js";

export default async function userRoute(req, res) {
  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    const nonce = await getNonceStats(address);

    const response = {
      rank: 123456,
      firstActivityDate: "1st January",
      daysSinceFirstActivity: 200,
      gasSpent: 1.23,
      gasRank: "#88,888 (top 40%)",
      nonce: {value: nonce.value, rank: nonce.rank},
      EarlyRank: "#15,000 (top 5%)",
      HypercoreTrades: 42,
      HypercoreVolume: "420k $",
      numberOfProtocolsUsed: 7,
      protocolBadges: [
        "hyperlend",
        "hyperbeat",
        "ventuals",
        "ultrasolid",
        "pendle",
        "hypurrfi",
        "hyperliquid"
      ],
      userProfile: {
        name: "DeFi Explorer 🧭",
        description: "This user farmed points across many ecosystems."
      },
      topPoints: [
        { label: "Top 10%", icon: "hyperliquid" },
        { label: "Top 25%", icon: "hyperlend" }
      ],
      allPoints: {
        hyperlend: { points: 123, rank: "#20,000", max_rank: "#100,000" },
        hyperbeat: { points: 95, rank: "#45,000", max_rank: "#100,000" }
      },
      avatar: "avatar1",
      userBadge: "degen",
      general: {
        transactions: "100+ (top 20%)",
        og: "Joined before 90% of users",
        archetype: "Yield Alchemist",
        gas: "Burned more gas than 80% of users"
      }
    };

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}