// fetch-felix-stability-deposit-operations.js
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
const OUTPUT_FILE = path.join(
  "hyperEVM",
  "felixStabilityDepositOperationLogs.json"
);

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

// Felix stability pool contracts
const STABILITY_POOLS = [
  "0x576c9c501473e01ae23748de28415a74425efd6b",
  "0xabf0369530205ae56dd4c49629474c65d1168924",
  "0x56a346e0730cb209a93964c41cd36098030779ab",
  "0xadfba621a75beced7dd1727b2067047b7eeedc8b",
];

// DepositOperation(indexed address _depositor, uint8 _operation,
//   uint256 _depositLossSinceLastOperation, int256 _depositChange,
//   uint256 _yieldGainSinceLastOperation, uint256 _yieldGainClaimed,
//   uint256 _collGainSinceLastOperation, uint256 _collGainClaimed)
const DEPOSIT_OPERATION_EVENT = {
  type: "event",
  name: "DepositOperation",
  inputs: [
    { indexed: true, name: "_depositor", type: "address" },
    { indexed: false, name: "_operation", type: "uint8" },
    { indexed: false, name: "_depositLossSinceLastOperation", type: "uint256" },
    { indexed: false, name: "_depositChange", type: "int256" },
    { indexed: false, name: "_yieldGainSinceLastOperation", type: "uint256" },
    { indexed: false, name: "_yieldGainClaimed", type: "uint256" },
    { indexed: false, name: "_collGainSinceLastOperation", type: "uint256" },
    { indexed: false, name: "_collGainClaimed", type: "uint256" },
  ],
};

// --- Helpers ---
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

async function fetchDepositOpsForRange(poolAddress, { fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: poolAddress,
        event: DEPOSIT_OPERATION_EVENT,
        fromBlock,
        toBlock,
      });

      return logs.map((log) => ({
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),
        depositor: log.args._depositor,
        operation: Number(log.args._operation),
        depositLossSinceLastOperation:
          log.args._depositLossSinceLastOperation.toString(),
        depositChange: log.args._depositChange.toString(), // int256
        yieldGainSinceLastOperation:
          log.args._yieldGainSinceLastOperation.toString(),
        yieldGainClaimed: log.args._yieldGainClaimed.toString(),
        collGainSinceLastOperation:
          log.args._collGainSinceLastOperation.toString(),
        collGainClaimed: log.args._collGainClaimed.toString(),
      }));
    } catch (err) {
      console.warn(
        `⚠️ Error on ${poolAddress} range ${fromBlock}-${toBlock}, attempt ${attempt}: ${
          err?.message || err
        }`
      );
      await sleep(300 * attempt);
    }
  }

  console.error(
    `❌ Failed range ${fromBlock}-${toBlock} for ${poolAddress} after ${maxRetries} attempts`
  );
  return [];
}

async function fetchAllForPool(poolAddress, fromBlock, toBlock) {
  console.log(
    `\n=== Fetching DepositOperation logs for ${poolAddress} from ${fromBlock} to ${toBlock} ===`
  );

  const ranges = buildBlockRanges(fromBlock, toBlock, BLOCK_CHUNK_SIZE);
  console.log(`Total ranges for ${poolAddress}: ${ranges.length}`);

  const perRangeLogs = await mapWithConcurrency(
    ranges,
    async (range, i) => {
      const { fromBlock, toBlock } = range;
      console.log(
        `[${i + 1}/${ranges.length}] ${poolAddress}: ${fromBlock}-${toBlock}`
      );
      const logs = await fetchDepositOpsForRange(poolAddress, range);
      console.log(
        `[${i + 1}/${ranges.length}] ${poolAddress}: ${logs.length} DepositOperation events`
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
    `→ ${poolAddress}: total ${allLogs.length} DepositOperation events`
  );
  return allLogs;
}

async function main() {
  const latestBlock = await client.getBlockNumber();
  const FROM_BLOCK = 0n;
  const TO_BLOCK = latestBlock;

  console.log(
    `Scanning DepositOperation for Felix stability pools from ${FROM_BLOCK} to ${TO_BLOCK}...`
  );

  let allLogs = [];

  // Fetch sequentially per pool (easy on RPC, still parallel within ranges)
  for (const pool of STABILITY_POOLS) {
    const poolLogs = await fetchAllForPool(pool, FROM_BLOCK, TO_BLOCK);
    // Use concat instead of spread to avoid stack overflow with large arrays
    allLogs = allLogs.concat(poolLogs);
  }

  // Sort all logs by block number and log index
  allLogs.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    return a.logIndex - b.logIndex;
  });

  fs.mkdirSync("hyperEVM", { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLogs, null, 2));

  console.log(`\nSaved ${allLogs.length} Felix stability pool logs to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});