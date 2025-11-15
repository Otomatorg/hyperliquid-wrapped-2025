// fetchErc721Transfers.js
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
const OUTPUT_FILE = "erc721_0x1d9d87eB_transfers.json";

const FROM_BLOCK = 0n;          // scan from genesis; tighten if you know deploy block
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

// ---- ERC721 contract ----
const ERC721_ADDRESS = "0x1d9d87eBc14e71490bB87f1C39F65BDB979f3cb7";

// Transfer(indexed address from, indexed address to, indexed uint256 tokenId)
const TRANSFER_EVENT = {
  type: "event",
  name: "Transfer",
  inputs: [
    { indexed: true, name: "from", type: "address" },
    { indexed: true, name: "to", type: "address" },
    { indexed: true, name: "tokenId", type: "uint256" },
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

async function fetchTransferLogsForRange({ fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (true) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: ERC721_ADDRESS,
        event: TRANSFER_EVENT,
        fromBlock,
        toBlock,
      });

      return logs.map((log) => ({
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),

        from: log.args.from,
        to: log.args.to,
        tokenId: log.args.tokenId.toString(),
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
  const TO_BLOCK = latestBlock;

  console.log(
    `Fetching ERC721 Transfer logs for ${ERC721_ADDRESS} from block ${FROM_BLOCK} to ${TO_BLOCK}...`
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
      const logs = await fetchTransferLogsForRange(range);
      console.log(
        `[${i + 1}/${ranges.length}] Found ${logs.length} Transfer events`
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

  console.log(`\nTotal Transfer events found: ${allLogs.length}`);

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