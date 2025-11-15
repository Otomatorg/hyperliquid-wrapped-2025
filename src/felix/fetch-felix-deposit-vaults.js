// fetchErc4626DepositLogs.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains"; // placeholder; RPC overrides it

// Get the directory of the current module (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
config({ path: path.resolve(__dirname, "../../.env") });

// ---- Config ----
const RPC_URL = process.env.ALCHEMY_HYPEREVM_RPC;

// List of potential ERC-4626 vault contracts (Felix-like)
const VAULT_ADDRESSES = [
  "0x2900ABd73631b2f60747e687095537B673c06A76",
  "0x835febf893c6dddee5cf762b0f8e31c5b06938ab",
  "0xfc5126377f0efc0041c0969ef9ba903ce67d151e",
  "0x9896a8605763106e57A51aa0a97Fe8099E806bb3",
  "0x9c59a9389D8f72DE2CdAf1126F36EA4790E2275e",
  "0x66c71204B70aE27BE6dC3eb41F9aF5868E68fDb6",
];

// Output file
const OUTPUT_FILE = path.join("hyperEVM", "erc4626DepositLogs.json");

// Global scan range: from genesis to latest
const BLOCK_CHUNK_SIZE = 10_000n; // adjust if RPC complains
const CONCURRENCY = 4;

if (!RPC_URL) {
  console.error("❌ Missing ALCHEMY_HYPEREVM_RPC in .env");
  process.exit(1);
}

const client = createPublicClient({
  chain: wanchainTestnet,
  transport: http(RPC_URL),
});

// ERC-4626 / Felix-like Deposit event:
// Deposit(indexed address sender, indexed address owner, uint256 assets, uint256 shares)
const DEPOSIT_EVENT = {
  type: "event",
  name: "Deposit",
  inputs: [
    { indexed: true, name: "sender", type: "address" },
    { indexed: true, name: "owner", type: "address" },
    { indexed: false, name: "assets", type: "uint256" },
    { indexed: false, name: "shares", type: "uint256" },
  ],
};

// Small helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mapWithConcurrency(items, fn, concurrency) {
  const results = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const current = idx++;
      const item = items[current];
      try {
        results[current] = await fn(item, current);
      } catch (e) {
        console.warn(
          `Chunk ${current} (${item.fromBlock}-${item.toBlock}) -> ERROR:`,
          e?.message || e
        );
        results[current] = { error: String(e?.message || e), item };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    worker
  );
  await Promise.all(workers);
  return results;
}

function buildBlockRanges(from, to, chunkSize) {
  const ranges = [];
  let start = from;
  while (start <= to) {
    let end = start + chunkSize;
    if (end > to) end = to;
    ranges.push({ fromBlock: start, toBlock: end });
    start = end + 1n;
  }
  return ranges;
}

async function fetchDepositLogsForRange(vaultAddress, { fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (true) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: vaultAddress,
        event: DEPOSIT_EVENT,
        fromBlock,
        toBlock,
      });

      // viem already decodes args when event is provided
      return logs.map((log) => ({
        vaultAddress,
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),
        sender: log.args.sender,
        owner: log.args.owner,
        assets: log.args.assets.toString(),
        shares: log.args.shares.toString(),
      }));
    } catch (err) {
      if (attempt >= maxRetries) {
        console.error(
          `❌ Failed range ${fromBlock}-${toBlock} for ${vaultAddress} after ${attempt} attempts:`,
          err?.message || err
        );
        return [];
      }
      console.warn(
        `⚠️ Error on range ${fromBlock}-${toBlock} for ${vaultAddress}, attempt ${attempt}: ${
          err?.message || err
        } – retrying...`
      );
      await sleep(300 * attempt);
    }
  }
}

async function fetchAllDepositsForVault(vaultAddress, fromBlock, toBlock) {
  console.log(
    `\n=== Fetching Deposit logs for vault ${vaultAddress} from block ${fromBlock} to ${toBlock} ===`
  );

  const ranges = buildBlockRanges(fromBlock, toBlock, BLOCK_CHUNK_SIZE);
  console.log(`Total ranges for ${vaultAddress}: ${ranges.length}`);

  const perRangeLogs = await mapWithConcurrency(
    ranges,
    async (range, i) => {
      const { fromBlock, toBlock } = range;
      console.log(
        `[${i + 1}/${ranges.length}] ${vaultAddress} -> ${fromBlock}-${toBlock}...`
      );
      const logs = await fetchDepositLogsForRange(vaultAddress, range);
      console.log(
        `[${i + 1}/${ranges.length}] ${vaultAddress} -> ${logs.length} Deposit events`
      );
      return logs;
    },
    CONCURRENCY
  );

  const allLogs = perRangeLogs.flat().sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    return a.logIndex - b.logIndex;
  });

  console.log(
    `Total Deposit events for ${vaultAddress}: ${allLogs.length}`
  );
  return allLogs;
}

async function main() {
  const latestBlock = await client.getBlockNumber();
  const FROM_BLOCK = 0n;
  const TO_BLOCK = latestBlock;

  console.log(
    `Global range: from block ${FROM_BLOCK} to ${TO_BLOCK} (latest)`
  );

  const result = [];

  // Fetch sequentially per vault (easier on RPC; you can parallelize later if needed)
  for (const vault of VAULT_ADDRESSES) {
    const logs = await fetchAllDepositsForVault(vault, FROM_BLOCK, TO_BLOCK);
    result.push(...logs);
  }

  // Sort all events by block number and log index
  result.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    return a.logIndex - b.logIndex;
  });

  fs.mkdirSync("hyperEVM", { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`\nSaved ${result.length} deposit events to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});