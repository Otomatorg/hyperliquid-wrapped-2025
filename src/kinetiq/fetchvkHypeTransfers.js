// fetch-fd739d4-token-transfers.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains"; // placeholder; RPC overridden by RPC_URL

// --- __dirname (ESM) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load .env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// ---- Config ----
const RPC_URL = process.env.ALCHEMY_HYPEREVM_RPC;
const OUTPUT_FILE = path.join(
  "hyperEVM",
  "vkHypeTokenTransferLogs.json"
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

// Target ERC20 token
const TOKEN_ADDRESS = "0x9ba2edc44e0a4632eb4723e81d4142353e1bb160";

// Transfer(indexed address from, indexed address to, uint256 value)
const TRANSFER_EVENT = {
  type: "event",
  name: "Transfer",
  inputs: [
    { indexed: true, name: "from", type: "address" },
    { indexed: true, name: "to", type: "address" },
    { indexed: false, name: "value", type: "uint256" },
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

async function fetchTransfersForRange({ fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: TOKEN_ADDRESS,
        event: TRANSFER_EVENT,
        // no args filter: we want ALL Transfer logs
        fromBlock,
        toBlock,
      });

      return logs.map((log) => ({
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),
        from: log.args.from,
        to: log.args.to,
        value: log.args.value.toString(),
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
    `Fetching ALL Transfer events for token ${TOKEN_ADDRESS} from ${FROM_BLOCK} to ${TO_BLOCK}...`
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
      const logs = await fetchTransfersForRange(range);
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
  
  // Write JSON incrementally to avoid "Invalid string length" error
  console.log(`Writing ${allLogs.length} logs to ${OUTPUT_FILE}...`);
  const fileStream = fs.createWriteStream(OUTPUT_FILE);
  
  // Helper to write and wait for drain if needed
  const writeToStream = (data) => {
    return new Promise((resolve, reject) => {
      if (fileStream.write(data)) {
        resolve();
      } else {
        fileStream.once("drain", resolve);
      }
      fileStream.once("error", reject);
    });
  };
  
  await writeToStream("[\n");
  
  for (let i = 0; i < allLogs.length; i++) {
    const log = allLogs[i];
    const jsonStr = JSON.stringify(log, null, 2);
    const isLast = i === allLogs.length - 1;
    
    // Indent each log entry and add comma if not last
    const lines = jsonStr.split("\n");
    for (let j = 0; j < lines.length; j++) {
      await writeToStream("  " + lines[j]);
      if (j < lines.length - 1) {
        await writeToStream("\n");
      }
    }
    
    if (!isLast) {
      await writeToStream(",\n");
    } else {
      await writeToStream("\n");
    }
    
    // Progress indicator for large files
    if ((i + 1) % 100000 === 0) {
      console.log(`  Written ${i + 1}/${allLogs.length} logs...`);
    }
  }
  
  await writeToStream("]\n");
  
  // Wait for stream to finish
  await new Promise((resolve, reject) => {
    fileStream.end(() => resolve());
    fileStream.once("error", reject);
  });
  
  console.log(`Saved logs to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});