// fetchRyskCollateralAssetDeposited.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains"; // placeholder; RPC overrides it

// ----- __dirname (ESM helper) -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- Load env from project root -----
config({ path: path.resolve(__dirname, "../../.env") });

console.log("RPC:", process.env.ALCHEMY_HYPEREVM_RPC);

// ---- Config ----
const RPC_URL = process.env.ALCHEMY_HYPEREVM_RPC;
const OUTPUT_FILE = "ryskCollateralAssetDepositedLogs.json";

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

// ---- Rysk contract ----
const RYSK_CONTRACT = "0x577b846A95711015769452F7f29d8054Cf087964";

// CollateralAssetDeposited(
//   indexed address asset,
//   indexed address accountOwner,
//   indexed address from,
//   uint256 vaultId,
//   uint256 amount
// )
const COLLATERAL_ASSET_DEPOSITED_EVENT = {
  type: "event",
  name: "CollateralAssetDeposited",
  inputs: [
    { indexed: true, name: "asset",        type: "address" },
    { indexed: true, name: "accountOwner", type: "address" },
    { indexed: true, name: "from",         type: "address" },
    { indexed: false, name: "vaultId",     type: "uint256" },
    { indexed: false, name: "amount",      type: "uint256" },
  ],
};

// ----- Helpers -----
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

async function fetchCollateralAssetDepositedForRange({ fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (true) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: RYSK_CONTRACT,
        event: COLLATERAL_ASSET_DEPOSITED_EVENT,
        fromBlock,
        toBlock,
      });

      return logs.map((log) => ({
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),

        asset: log.args.asset,
        accountOwner: log.args.accountOwner,
        from: log.args.from,
        vaultId: log.args.vaultId.toString(),
        amount: log.args.amount.toString(),
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
  const latestBlock = await client.getBlockNumber();

  // last 1,000,000 blocks (floor at 0)
  const span = 1_000_000n;
  const FROM_BLOCK = 0n;
  const TO_BLOCK = latestBlock;

  console.log(
    `Fetching Rysk CollateralAssetDeposited logs from block ${FROM_BLOCK} to ${TO_BLOCK}...`
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
      const logs = await fetchCollateralAssetDepositedForRange(range);
      console.log(
        `[${i + 1}/${ranges.length}] Found ${logs.length} CollateralAssetDeposited events`
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
    `\nTotal CollateralAssetDeposited events found: ${allLogs.length}`
  );

  fs.mkdirSync("hyperEVM", { recursive: true });
  fs.writeFileSync(
    path.join("hyperEVM", OUTPUT_FILE),
    JSON.stringify(allLogs, null, 2)
  );
  console.log(`Saved logs to hyperEVM/${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});