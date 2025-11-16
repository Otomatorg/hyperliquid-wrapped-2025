import { getProtocol } from "./getProtocol.js";

/**
 * Archetype categories mapping
 */
const ARCHETYPE_CATEGORIES = {
  "LP specialist": [
    "hyperswap",
    "hybra",
    "ultrasolid",
    "projectx",
    "prjx", // ProjectX API name
    "gliquid", // gLiquid variation
  ],
  "NFT collector": [
    "hypurr",
    "hypurrnft", // HypurrNFT variation
    "hypio",
    "catbal",
    "hlnames", // hlNames variation
  ],
  "Yield alchemist": [
    "hyperbeat",
    "felix",
    "hyperlend",
    "pendle",
    "hypurrfi",
    "kinetiq",
    "morpho",
  ],
  "Early digger": [
    "ventuals",
    "nunchi",
    "rysk",
    "hypersurface",
  ],
};

/**
 * Priority order for archetypes when counts are equal
 */
const ARCHETYPE_PRIORITY = [
  "Early digger",
  "NFT collector",
  "Yield alchemist",
  "LP specialist",
];

/**
 * Archetype descriptions
 */
const ARCHETYPE_DESCRIPTIONS = {
  "LP specialist": "Providing liquidity to the ecosystem",
  "NFT collector": "NFTs don't have secrets for them",
  "Yield alchemist": "This chad knows how to generate yield",
  "Early digger": "Discovers new protocols before they get popular.",
  "Newbie": "Just getting started on the Hyperliquid journey.",
};

/**
 * Normalize protocol name to lowercase for comparison
 */
function normalizeProtocol(protocol) {
  return protocol.toLowerCase();
}

/**
 * Get the archetype category for a protocol
 */
function getProtocolCategory(protocol) {
  const normalized = normalizeProtocol(protocol);
  
  for (const [archetype, protocols] of Object.entries(ARCHETYPE_CATEGORIES)) {
    if (protocols.includes(normalized)) {
      return archetype;
    }
  }
  
  return null; // Protocol doesn't belong to any category
}

/**
 * Get the user's archetype based on the protocols they've interacted with.
 * 
 * @param {string} address - The user's Ethereum address
 * @returns {Promise<string>} - The archetype name, or "Newbie" as default if no protocols match
 */
export async function getArchetype(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  // Get the list of protocols the user has used
  const protocols = await getProtocol(address);

  if (!protocols || protocols.length === 0) {
    return "Newbie"; // Default archetype
  }

  // Count protocols by category
  const categoryCounts = {
    "LP specialist": 0,
    "NFT collector": 0,
    "Yield alchemist": 0,
    "Early digger": 0,
  };

  // Count each protocol's category
  for (const protocol of protocols) {
    const category = getProtocolCategory(protocol);
    if (category && categoryCounts.hasOwnProperty(category)) {
      categoryCounts[category]++;
    }
  }

  // Find the maximum count
  const maxCount = Math.max(...Object.values(categoryCounts));

  // If no protocols match any category, return default
  if (maxCount === 0) {
    return "Newbie";
  }

  // Find all categories with the maximum count
  const topCategories = Object.entries(categoryCounts)
    .filter(([, count]) => count === maxCount)
    .map(([category]) => category);

  // If there's a tie, use priority order
  if (topCategories.length > 1) {
    for (const priorityArchetype of ARCHETYPE_PRIORITY) {
      if (topCategories.includes(priorityArchetype)) {
        return priorityArchetype;
      }
    }
  }

  // Return the top category (or first if somehow no priority match)
  return topCategories[0] || "Newbie";
}

/**
 * Get the description for an archetype.
 * 
 * @param {string} archetype - The archetype name
 * @returns {string} - The archetype description, or empty string if not found
 */
export function getArchetypeDescription(archetype) {
  return ARCHETYPE_DESCRIPTIONS[archetype] || "";
}

