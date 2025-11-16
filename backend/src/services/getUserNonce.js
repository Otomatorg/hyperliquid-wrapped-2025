// backend/src/services/getNonceStats.js
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains";
import { getNonceRank } from "./getNonceRank.js";

// --- __dirname ESM equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// ---- Config ----
// Uses Lava HyperEVM RPC if provided, otherwise falls back to Hyperliquid RPC
const RPC_URL =
  process.env.LAVA_HYPEREVM_RPC || "https://rpc.hyperliquid.xyz/evm";

if (!RPC_URL) {
  console.error("❌ Missing LAVA_HYPEREVM_RPC in .env and no fallback RPC URL");
  throw new Error("RPC URL not configured");
}

// ---- Viem client ----
const client = createPublicClient({
  chain: wanchainTestnet, // placeholder; actual network comes from RPC_URL
  transport: http(RPC_URL),
});

/**
 * Fetch nonce stats for a single address from the RPC.
 *
 * Returns an object like:
 * {
 *   value: 123,                   // REAL nonce from RPC (0 if never interacted)
 *   rankLabel: "#123,456 (N/A)",  // dummy for now
 * }
 */
export async function getNonceStats(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  try {
    // Fetch real nonce from RPC
    // This will return 0 if the address never interacted with the chain
    const nonce = await client.getTransactionCount({ 
      address: address 
    });

    // Real nonce value (will be 0 for addresses that never interacted)
    const value = Number(nonce);

    const rank = await getNonceRank(value);

    return {
      value,
      rank: rank,
    };
  } catch (err) {
    console.error(`❌ Error fetching nonce for ${address}: ${err.message}`);

    // Return 0 if there's an error (treat as never interacted)
    // This ensures we always return a number, not null
    return {
      value: 0,
      rankLabel: "N/A",
      error: true,
    };
  }
}