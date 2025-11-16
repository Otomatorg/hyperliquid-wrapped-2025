import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains";
import fs from "fs/promises";

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// --- Config ---
const RPC_URL = process.env.LAVA_HYPEREVM_RPC;

if (!RPC_URL) {
  console.error("❌ Missing LAVA_HYPEREVM_RPC in .env");
  throw new Error("LAVA_HYPEREVM_RPC not set");
}

const client = createPublicClient({
  chain: wanchainTestnet,
  transport: http(RPC_URL),
});

// --- NFT Contract Addresses ---
const NFT_CONTRACTS = {
  hypio: "0x63eb9d77d083ca10c304e28d5191321977fd0bfb",
  hypurr: "0x9125e2d6827a00b0f8330d6ef7bef07730bac685",
  catbal: "0xddab956f9eee629510b4410627cd63c0448a78ab",
};

// --- Path to Catbal owners JSON file ---
const CATBAL_OWNERS_FILE = path.resolve(
  __dirname,
  "../data/catbalOwners.json"
);

// Cache for Catbal owners data
let catbalOwnersCache = null;

// --- ERC721Enumerable ABI (minimal) ---
const ERC721_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * Load and cache the Catbal owners data from JSON file
 * @returns {Promise<object>} - Object mapping addresses to token ID arrays
 */
async function loadCatbalOwners() {
  if (catbalOwnersCache !== null) {
    return catbalOwnersCache;
  }

  try {
    const fileContent = await fs.readFile(CATBAL_OWNERS_FILE, "utf-8");
    catbalOwnersCache = JSON.parse(fileContent);
    return catbalOwnersCache;
  } catch (error) {
    console.error(`❌ Error loading Catbal owners data: ${error.message}`);
    return {};
  }
}

/**
 * Get Catbal token IDs for an address from the JSON file
 * @param {string} ownerAddress - The owner's address (normalized to lowercase)
 * @returns {Promise<string[]>} - Array of token IDs as strings
 */
async function getCatbalTokenIds(ownerAddress) {
  const catbalOwners = await loadCatbalOwners();
  const tokenIds = catbalOwners[ownerAddress] || [];
  // Convert numbers to strings
  return tokenIds.map((id) => String(id));
}

/**
 * Get all token IDs owned by an address for a specific NFT contract
 * @param {string} contractAddress - The NFT contract address
 * @param {string} ownerAddress - The owner's address
 * @returns {Promise<string[]>} - Array of token IDs as strings
 */
async function getTokenIdsForContract(contractAddress, ownerAddress) {
  try {
    // Get balance (number of tokens owned)
    const balance = await client.readContract({
      address: contractAddress,
      abi: ERC721_ABI,
      functionName: "balanceOf",
      args: [ownerAddress],
    });

    const balanceNum = Number(balance);
    if (balanceNum === 0) {
      return [];
    }

    // Fetch all token IDs using tokenOfOwnerByIndex
    const tokenIdPromises = [];
    for (let i = 0; i < balanceNum; i++) {
      tokenIdPromises.push(
        client.readContract({
          address: contractAddress,
          abi: ERC721_ABI,
          functionName: "tokenOfOwnerByIndex",
          args: [ownerAddress, BigInt(i)],
        })
      );
    }

    const tokenIds = await Promise.all(tokenIdPromises);
    return tokenIds.map((id) => id.toString());
  } catch (error) {
    // If the contract doesn't support ERC721Enumerable, return empty array
    // or if there's any other error, log it and return empty
    console.warn(
      `⚠️ Error fetching tokens for contract ${contractAddress}: ${error.message}`
    );
    return [];
  }
}

/**
 * Get image URLs for all tokens in a collection
 * @param {string} contractAddress - The NFT contract address
 * @param {string[]} tokenIds - Array of token IDs
 * @returns {Promise<Array<{tokenId: string, imageUrl: string|null}>>} - Array of objects with tokenId and imageUrl
 */
async function getNFTsWithImages(contractAddress, tokenIds) {
  if (tokenIds.length === 0) {
    return [];
  }

  // Fetch image URLs for all tokens in parallel
  const nftPromises = tokenIds.map(async (tokenId) => {
    const imageUrl = await getNFTImageURL(contractAddress, tokenId);
    return {
      tokenId,
      imageUrl,
    };
  });

  return Promise.all(nftPromises);
}

/**
 * Get all NFTs owned by an address across Hypio, Hypurr, and Catbal
 * @param {string} address - The user's Ethereum address
 * @returns {Promise<object>} - Object with NFT collections and their token data
 *   Format: {
 *     hypio: Array<{tokenId: string, imageUrl: string|null}>,
 *     hypurr: Array<{tokenId: string, imageUrl: string|null}>,
 *     catbal: Array<{tokenId: string, imageUrl: string|null}>,
 *     profilePicture: string - Image URL if NFTs owned, or random collection name ("catbal", "hypurr", or "hypio") if none
 *   }
 */
export async function getNFTs(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  // Normalize address
  const normalizedAddress = address.toLowerCase();

  // Fetch token IDs for Hypio and Hypurr from contracts, and Catbal from JSON file
  const [hypioTokenIds, hypurrTokenIds, catbalTokenIds] = await Promise.all([
    getTokenIdsForContract(NFT_CONTRACTS.hypio, normalizedAddress),
    getTokenIdsForContract(NFT_CONTRACTS.hypurr, normalizedAddress),
    getCatbalTokenIds(normalizedAddress),
  ]);

  // Fetch image URLs for all tokens in parallel
  const [hypioNFTs, hypurrNFTs, catbalNFTs] = await Promise.all([
    getNFTsWithImages(NFT_CONTRACTS.hypio, hypioTokenIds),
    getNFTsWithImages(NFT_CONTRACTS.hypurr, hypurrTokenIds),
    getNFTsWithImages(NFT_CONTRACTS.catbal, catbalTokenIds),
  ]);

  // Create object with token IDs for profile picture selection
  const tokenIdsObj = {
    hypio: hypioTokenIds,
    hypurr: hypurrTokenIds,
    catbal: catbalTokenIds,
  };

  const profilePicture = await getBestProfilePicture(tokenIdsObj);

  return {
    hypio: hypioNFTs,
    hypurr: hypurrNFTs,
    catbal: catbalNFTs,
    profilePicture,
  };
}

/**
 * Get the best profile picture URL based on NFT ownership priority:
 * 1. Hypurr (first priority)
 * 2. Hypio (second priority)
 * 3. Catbal (third priority)
 * If no NFTs are owned, returns a random string from ["catbal", "hypurr", "hypio"]
 * @param {object} obj - Object with hypio, hypurr, and catbal token arrays
 * @returns {Promise<string>} - Image URL or random collection name if no NFTs owned
 */
async function getBestProfilePicture(obj) {
  const { hypio, hypurr, catbal } = obj;

  // Priority: Hypurr first, then Hypio, then Catbal
  if (hypurr.length > 0) {
    return await getNFTImageURL(NFT_CONTRACTS.hypurr, hypurr[0]);
  }
  if (hypio.length > 0) {
    return await getNFTImageURL(NFT_CONTRACTS.hypio, hypio[0]);
  }
  if (catbal.length > 0) {
    return await getNFTImageURL(NFT_CONTRACTS.catbal, catbal[0]);
  }
  
  // If no NFTs owned, return a random collection name
  const collections = ["catbal", "hypurr", "hypio"];
  const randomIndex = Math.floor(Math.random() * collections.length);
  return collections[randomIndex];
}

/**
 * Get the image URL for an NFT by fetching tokenURI and extracting image from metadata
 * @param {string} contractAddress - The NFT contract address
 * @param {string} tokenId - The token ID
 * @returns {Promise<string|null>} - Image URL or null if not found
 */
async function getNFTImageURL(contractAddress, tokenId) {
  try {
    // Get tokenURI from contract
    const tokenURI = await client.readContract({
      address: contractAddress,
      abi: ERC721_ABI,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });

    if (!tokenURI) {
      return null;
    }

    // Convert IPFS URL to HTTP gateway URL if needed
    let metadataURL = tokenURI;
    if (tokenURI.startsWith("ipfs://")) {
      // Convert ipfs:// to https://ipfs.io/ipfs/
      metadataURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

    // Fetch metadata JSON
    const response = await fetch(metadataURL);
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch metadata from ${metadataURL}: ${response.statusText}`);
      return null;
    }

    const metadata = await response.json();
    
    // Extract image URL
    let imageURL = metadata.image || metadata.image_url || null;
    
    if (imageURL && imageURL.startsWith("ipfs://")) {
      // Convert IPFS image URL to HTTP gateway
      imageURL = imageURL.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

    return imageURL;
  } catch (error) {
    console.warn(
      `⚠️ Error fetching image URL for token ${tokenId} from contract ${contractAddress}: ${error.message}`
    );
    return null;
  }
}