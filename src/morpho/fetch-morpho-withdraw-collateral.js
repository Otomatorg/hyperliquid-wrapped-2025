// fetch-morpho-withdraw-collateral-all.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains"; // placeholder; RPC overrides it

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// ---- Config ----
const RPC_URL = process.env.ALCHEMY_HYPEREVM_RPC;
const OUTPUT_FILE = path.join("hyperEVM", "morphoWithdrawCollateralAll.json");

// Scan full chain; you can tighten this later if you want
const BLOCK_CHUNK_SIZE = 10_000n;
const CONCURRENCY = 4;

if (!RPC_URL) {
  console.error("❌ Missing ALCHEMY_HYPEREVM_RPC in .env");
  process.exit(1);
}

const client = createPublicClient({
  chain: wanchainTestnet,
  transport: http(RPC_URL),
});

// Morpho main contract
const MORPHO = "0x68e37dE8d93d3496ae143F2E900490f6280C57cD";

// WithdrawCollateral(bytes32 indexed id, address caller, address indexed onBehalf, address indexed receiver, uint256 assets)
const WITHDRAW_COLLATERAL_EVENT = {
  type: "event",
  name: "WithdrawCollateral",
  inputs: [
    { indexed: true, name: "id", type: "bytes32" },
    { indexed: false, name: "caller", type: "address" },
    { indexed: true, name: "onBehalf", type: "address" },
    { indexed: true, name: "receiver", type: "address" },
    { indexed: false, name: "assets", type: "uint256" },
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

async function fetchWithdrawLogsForRange({ fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: MORPHO,
        event: WITHDRAW_COLLATERAL_EVENT,
        fromBlock,
        toBlock,
      });

      return logs.map((log) => ({
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),
        id: log.args.id,
        caller: log.args.caller,
        onBehalf: log.args.onBehalf,
        receiver: log.args.receiver,
        assets: log.args.assets.toString(),
      }));
    } catch (err) {
      console.warn(
        `⚠️ Error on range ${fromBlock}-${toBlock}, attempt ${attempt}: ${
          err?.message || err
        }`
      );
      await sleep(300 * attempt);
    }
  }

  console.error(
    `❌ Failed range ${fromBlock}-${toBlock} after ${maxRetries} attempts`
  );
  return [];
}

async function main() {
  const latestBlock = await client.getBlockNumber();
  const FROM_BLOCK = 0n;
  const TO_BLOCK = latestBlock;

  console.log(
    `Fetching ALL Morpho WithdrawCollateral logs from block ${FROM_BLOCK} to ${TO_BLOCK}...`
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
      const logs = await fetchWithdrawLogsForRange(range);
      console.log(
        `[${i + 1}/${ranges.length}] Found ${logs.length} WithdrawCollateral events`
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

  console.log(`\nTotal WithdrawCollateral events found: ${allLogs.length}`);

  fs.mkdirSync("hyperEVM", { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLogs, null, 2));
  console.log(`Saved logs to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});