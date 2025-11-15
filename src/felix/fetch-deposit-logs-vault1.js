// fetchFelixDepositLogs.js
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

// Save Felix logs here
const OUTPUT_FILE = "vault1felixDepositLogs.json";

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

// Felix contract
const FELIX = "0x8A862fD6c12f9ad34C9c2ff45AB2b6712e8CEa27";

// Event ABI from the screenshot:
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

async function fetchDepositLogsForRange({ fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (true) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: FELIX,
        event: DEPOSIT_EVENT,
        fromBlock,
        toBlock,
      });

      // viem already decodes args when event is provided
      return logs.map((log) => ({
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
          `❌ Failed range ${fromBlock}-${toBlock} after ${attempt} attempts:`,
          err?.message || err
        );
        return [];
      }
      console.warn(
        `⚠️ Error on range ${fromBlock}-${toBlock}, attempt ${attempt}: ${
          err?.message || err
        } – retrying...`
      );
      await sleep(300 * attempt);
    }
  }
}

async function main() {
  // If you ever want to restrict the range, just change these two values.
  const FROM_BLOCK = await client.getBlockNumber() / 2n; // start of chain (or Felix deployment block if you know it)
  const latestBlock = await client.getBlockNumber();
  const TO_BLOCK = latestBlock;

  console.log(
    `Fetching Felix Deposit logs from block ${FROM_BLOCK} to ${TO_BLOCK}...`
  );

  const ranges = buildBlockRanges(FROM_BLOCK, TO_BLOCK, BLOCK_CHUNK_SIZE);
  console.log(`Total ranges: ${ranges.length}`);

  const perRangeLogs = await mapWithConcurrency(
    ranges,
    async (range, i) => {
      const { fromBlock, toBlock } = range;
      console.log(
        `[${i + 1}/${ranges.length}] Fetching ${fromBlock}-${toBlock}...`
      );
      const logs = await fetchDepositLogsForRange(range);
      console.log(
        `[${i + 1}/${ranges.length}] Found ${logs.length} Deposit events`
      );
      return logs;
    },
    CONCURRENCY
  );

  // Flatten and sort
  const allLogs = perRangeLogs.flat().sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    return a.logIndex - b.logIndex;
  });

  console.log(`\nTotal Deposit events found: ${allLogs.length}`);

  fs.mkdirSync("hyperEVM", { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLogs, null, 2));
  console.log(`Saved logs to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});