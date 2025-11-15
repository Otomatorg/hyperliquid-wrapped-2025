// fetchHyperLendSupplyLogs.js
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

console.log(process.env.ALCHEMY_HYPEREVM_RPC);

// ---- Config ----
const RPC_URL = process.env.ALCHEMY_HYPEREVM_RPC;

const OUTPUT_FILE = "hyperLendSupplyLogs.json";

// NOTE: You said "between block 19167463 & block 31736".
// We'll just take the min/max to build the range.
const RAW_A = 19167463n;
const RAW_B = 31736n;
const FROM_BLOCK = RAW_A < RAW_B ? RAW_A : RAW_B;
const TO_BLOCK = RAW_A > RAW_B ? RAW_A : RAW_B;

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

// HyperLend Pool contract
const HYPERLEND_POOL = "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b";

// Event ABI (from your screenshot)
// Supply(indexed address reserve, address user, indexed address onBehalfOf, uint256 amount, indexed uint16 referralCode)
const SUPPLY_EVENT = {
  type: "event",
  name: "Supply",
  inputs: [
    { indexed: true, name: "reserve", type: "address" },
    { indexed: false, name: "user", type: "address" },
    { indexed: true, name: "onBehalfOf", type: "address" },
    { indexed: false, name: "amount", type: "uint256" },
    { indexed: true, name: "referralCode", type: "uint16" },
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

async function fetchSupplyLogsForRange({ fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (true) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: HYPERLEND_POOL,
        event: SUPPLY_EVENT,
        fromBlock,
        toBlock,
      });

      // viem already decodes args when event is provided
      return logs.map((log) => ({
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),
        reserve: log.args.reserve,
        user: log.args.user,
        onBehalfOf: log.args.onBehalfOf,
        amount: log.args.amount.toString(),
        referralCode: Number(log.args.referralCode),
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
  console.log(
    `Fetching HyperLend Supply logs from block ${FROM_BLOCK} to ${TO_BLOCK}...`
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
      const logs = await fetchSupplyLogsForRange(range);
      console.log(
        `[${i + 1}/${ranges.length}] Found ${logs.length} Supply events`
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

  console.log(`\nTotal Supply events found: ${allLogs.length}`);

  fs.mkdirSync("hyperEVM", { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLogs, null, 2));
  console.log(`Saved logs to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});