// fetchCatbalOwners.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains";

// --- __dirname (ESM helper) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env (to get LAVA_HYPEREVM_RPC if present) ---
config({ path: path.resolve(__dirname, "../../.env") });

// ---- Config ----
const RPC_URL =
  process.env.ALCHEMY_HYPEREVM_RPC || "https://rpc.hyperliquid.xyz/evm";

const CATBAL_CONTRACT = "0xddab956f9eee629510b4410627cd63c0448a78ab";
const TOTAL_SUPPLY = 1776; // token IDs 1..1776

const OUTPUT_DIR = path.join(__dirname, "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "catbalOwners.json");

const BATCH_SIZE = 20; // how many tokenIds to query in parallel
const BATCH_DELAY_MS = 500; // pause between batches to avoid spamming RPC

if (!RPC_URL) {
  console.error("❌ Missing LAVA_HYPEREVM_RPC in .env");
  process.exit(1);
}

// ---- Minimal ERC721 ABI: ownerOf ----
const ERC721_ABI = [
  {
    type: "function",
    stateMutability: "view",
    name: "ownerOf",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
];

// ---- Viem client ----
const client = createPublicClient({
  chain: wanchainTestnet, // placeholder, overridden by RPC URL
  transport: http(RPC_URL),
});

// Small helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch owner for a single tokenId
async function fetchOwner(tokenId) {
  try {
    const owner = await client.readContract({
      address: CATBAL_CONTRACT,
      abi: ERC721_ABI,
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    });

    return { tokenId, owner };
  } catch (err) {
    console.warn(
      `⚠️ ownerOf(${tokenId}) failed: ${err?.shortMessage || err?.message || err}`
    );
    return { tokenId, owner: null };
  }
}

async function main() {
  console.log(
    `Fetching Catbal owners for token IDs 1..${TOTAL_SUPPLY} from ${CATBAL_CONTRACT}`
  );

  const ownerMap = {}; // address -> [tokenId]

  const tokenIds = Array.from({ length: TOTAL_SUPPLY }, (_, i) => i + 1);

  const totalBatches = Math.ceil(tokenIds.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, tokenIds.length);
    const batch = tokenIds.slice(start, end);

    console.log(
      `\n📦 Batch ${batchIndex + 1}/${totalBatches} → tokenIds ${batch[0]}..${
        batch[batch.length - 1]
      }`
    );

    const results = await Promise.all(batch.map((id) => fetchOwner(id)));

    for (const { tokenId, owner } of results) {
      if (!owner) continue;

      const addr = owner.toLowerCase();
      if (!ownerMap[addr]) ownerMap[addr] = [];
      ownerMap[addr].push(tokenId);
    }

    console.log(
      `✅ Batch ${batchIndex + 1} done. Unique owners so far: ${
        Object.keys(ownerMap).length
      }`
    );

    if (batchIndex < totalBatches - 1) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Sort token IDs for each owner
  for (const addr of Object.keys(ownerMap)) {
    ownerMap[addr].sort((a, b) => a - b);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(ownerMap, null, 2));

  console.log(`\n🎉 Done! Saved owner map to ${OUTPUT_FILE}`);
  console.log("Example entry:");
  const [exampleAddr] = Object.keys(ownerMap);
  if (exampleAddr) {
    console.log(exampleAddr, ":", ownerMap[exampleAddr]);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});