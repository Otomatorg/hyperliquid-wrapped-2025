// fetch-pendle-router-events.js
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
const OUTPUT_DIR = "hyperEVM";

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

// ---- Pendle router contract ----
const PENDLE_ROUTER = "0x888888888889758F76e7103c6CbF23ABbF58F946";

// ---- Event ABIs ----
const PENDLE_EVENTS = [
  {
    key: "SwapPtAndToken",
    outputFile: path.join(OUTPUT_DIR, "pendleSwapPtAndTokenLogs.json"),
    abi: {
      type: "event",
      name: "SwapPtAndToken",
      inputs: [
        { indexed: true,  name: "caller",            type: "address" },
        { indexed: true,  name: "market",            type: "address" },
        { indexed: true,  name: "token",             type: "address" },
        { indexed: false, name: "receiver",          type: "address" },
        { indexed: false, name: "netPtToAccount",    type: "int256"  },
        { indexed: false, name: "netTokenToAccount", type: "int256"  },
        { indexed: false, name: "netSyInterm",       type: "uint256" },
      ],
    },
    mapLog: (log) => ({
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
      caller: log.args.caller,
      market: log.args.market,
      token: log.args.token,
      receiver: log.args.receiver,
      netPtToAccount: log.args.netPtToAccount.toString(),
      netTokenToAccount: log.args.netTokenToAccount.toString(),
      netSyInterm: log.args.netSyInterm.toString(),
    }),
  },

  {
    key: "ExitPostExpToToken",
    outputFile: path.join(OUTPUT_DIR, "pendleExitPostExpToTokenLogs.json"),
    abi: {
      type: "event",
      name: "ExitPostExpToToken",
      inputs: [
        { indexed: true,  name: "caller",        type: "address" },
        { indexed: true,  name: "market",        type: "address" },
        { indexed: true,  name: "token",         type: "address" },
        { indexed: false, name: "receiver",      type: "address" },
        { indexed: false, name: "netLpIn",       type: "uint256" },
        { indexed: false, name: "totalTokenOut", type: "uint256" },
        // Struct / params - keep it generic for now
        {
          indexed: false,
          name: "params",
          type: "tuple",
          components: [],
        },
      ],
    },
    mapLog: (log) => ({
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
      caller: log.args.caller,
      market: log.args.market,
      token: log.args.token,
      receiver: log.args.receiver,
      netLpIn: log.args.netLpIn.toString(),
      totalTokenOut: log.args.totalTokenOut.toString(),
      // viem will decode tuple into some JS structure; keep it as-is
      params: log.args.params,
      // keep raw data just in case you want to re-decode later
      data: log.data,
    }),
  },

  {
    key: "SwapYtAndToken",
    outputFile: path.join(OUTPUT_DIR, "pendleSwapYtAndTokenLogs.json"),
    abi: {
      type: "event",
      name: "SwapYtAndToken",
      inputs: [
        { indexed: true,  name: "caller",            type: "address" },
        { indexed: true,  name: "market",            type: "address" },
        { indexed: true,  name: "token",             type: "address" },
        { indexed: false, name: "receiver",          type: "address" },
        { indexed: false, name: "netYtToAccount",    type: "int256"  },
        { indexed: false, name: "netTokenToAccount", type: "int256"  },
        { indexed: false, name: "netSyInterm",       type: "uint256" },
      ],
    },
    mapLog: (log) => ({
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
      caller: log.args.caller,
      market: log.args.market,
      token: log.args.token,
      receiver: log.args.receiver,
      netYtToAccount: log.args.netYtToAccount.toString(),
      netTokenToAccount: log.args.netTokenToAccount.toString(),
      netSyInterm: log.args.netSyInterm.toString(),
    }),
  },

  {
    key: "RemoveLiquiditySingleToken",
    outputFile: path.join(
      OUTPUT_DIR,
      "pendleRemoveLiquiditySingleTokenLogs.json"
    ),
    abi: {
      type: "event",
      name: "RemoveLiquiditySingleToken",
      inputs: [
        { indexed: true,  name: "caller",        type: "address" },
        { indexed: true,  name: "market",        type: "address" },
        { indexed: true,  name: "token",         type: "address" },
        { indexed: false, name: "receiver",      type: "address" },
        { indexed: false, name: "netLpToRemove", type: "uint256" },
        { indexed: false, name: "netTokenOut",   type: "uint256" },
        { indexed: false, name: "netSyInterm",   type: "uint256" },
      ],
    },
    mapLog: (log) => ({
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
      caller: log.args.caller,
      market: log.args.market,
      token: log.args.token,
      receiver: log.args.receiver,
      netLpToRemove: log.args.netLpToRemove.toString(),
      netTokenOut: log.args.netTokenOut.toString(),
      netSyInterm: log.args.netSyInterm.toString(),
    }),
  },

  {
    key: "AddLiquiditySingleToken",
    outputFile: path.join(
      OUTPUT_DIR,
      "pendleAddLiquiditySingleTokenLogs.json"
    ),
    abi: {
      type: "event",
      name: "AddLiquiditySingleToken",
      inputs: [
        { indexed: true,  name: "caller",      type: "address" },
        { indexed: true,  name: "market",      type: "address" },
        { indexed: true,  name: "token",       type: "address" },
        { indexed: false, name: "receiver",    type: "address" },
        { indexed: false, name: "netTokenIn",  type: "uint256" },
        { indexed: false, name: "netLpOut",    type: "uint256" },
        { indexed: false, name: "netSyInterm", type: "uint256" },
      ],
    },
    mapLog: (log) => ({
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
      caller: log.args.caller,
      market: log.args.market,
      token: log.args.token,
      receiver: log.args.receiver,
      netTokenIn: log.args.netTokenIn.toString(),
      netLpOut: log.args.netLpOut.toString(),
      netSyInterm: log.args.netSyInterm.toString(),
    }),
  },

  {
    key: "AddLiquiditySingleSyKeepYt",
    outputFile: path.join(
      OUTPUT_DIR,
      "pendleAddLiquiditySingleSyKeepYtLogs.json"
    ),
    abi: {
      type: "event",
      name: "AddLiquiditySingleSyKeepYt",
      inputs: [
        { indexed: true,  name: "caller",      type: "address" },
        { indexed: true,  name: "market",      type: "address" },
        { indexed: true,  name: "receiver",    type: "address" },
        { indexed: false, name: "netSyIn",     type: "uint256" },
        { indexed: false, name: "netSyMintPy", type: "uint256" },
        { indexed: false, name: "netLpOut",    type: "uint256" },
        { indexed: false, name: "netYtOut",    type: "uint256" },
      ],
    },
    mapLog: (log) => ({
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
      caller: log.args.caller,
      market: log.args.market,
      receiver: log.args.receiver,
      netSyIn: log.args.netSyIn.toString(),
      netSyMintPy: log.args.netSyMintPy.toString(),
      netLpOut: log.args.netLpOut.toString(),
      netYtOut: log.args.netYtOut.toString(),
    }),
  },

  {
    key: "RemoveLiquiditySingleSy",
    outputFile: path.join(
      OUTPUT_DIR,
      "pendleRemoveLiquiditySingleSyLogs.json"
    ),
    abi: {
      type: "event",
      name: "RemoveLiquiditySingleSy",
      inputs: [
        { indexed: true,  name: "caller",        type: "address" },
        { indexed: true,  name: "market",        type: "address" },
        { indexed: true,  name: "receiver",      type: "address" },
        { indexed: false, name: "netLpToRemove", type: "uint256" },
        { indexed: false, name: "netSyOut",      type: "uint256" },
      ],
    },
    mapLog: (log) => ({
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
      caller: log.args.caller,
      market: log.args.market,
      receiver: log.args.receiver,
      netLpToRemove: log.args.netLpToRemove.toString(),
      netSyOut: log.args.netSyOut.toString(),
    }),
  },

  {
    key: "RedeemPyToToken",
    outputFile: path.join(OUTPUT_DIR, "pendleRedeemPyToTokenLogs.json"),
    abi: {
      type: "event",
      name: "RedeemPyToToken",
      inputs: [
        { indexed: true,  name: "caller",      type: "address" },
        { indexed: true,  name: "tokenOut",    type: "address" },
        { indexed: true,  name: "YT",          type: "address" },
        { indexed: false, name: "receiver",    type: "address" },
        { indexed: false, name: "netPyIn",     type: "uint256" },
        { indexed: false, name: "netTokenOut", type: "uint256" },
        { indexed: false, name: "netSyInterm", type: "uint256" },
      ],
    },
    mapLog: (log) => ({
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
      caller: log.args.caller,
      tokenOut: log.args.tokenOut,
      YT: log.args.YT,
      receiver: log.args.receiver,
      netPyIn: log.args.netPyIn.toString(),
      netTokenOut: log.args.netTokenOut.toString(),
      netSyInterm: log.args.netSyInterm.toString(),
    }),
  },
];

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

async function fetchEventForRange(eventConfig, { fromBlock, toBlock }) {
  const { abi, key } = eventConfig;
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: PENDLE_ROUTER,
        event: abi,
        fromBlock,
        toBlock,
      });
      return logs;
    } catch (err) {
      console.warn(
        `⚠️ Error on ${key} range ${fromBlock}-${toBlock}, attempt ${attempt}: ${
          err?.message || err
        }`
      );
      await sleep(300 * attempt);
    }
  }

  console.error(
    `❌ Failed range ${fromBlock}-${toBlock} for ${key} after ${maxRetries} attempts`
  );
  return [];
}

async function fetchAllForEvent(eventConfig, fromBlock, toBlock) {
  const { key, mapLog } = eventConfig;

  console.log(
    `\n=== Fetching ${key} logs from block ${fromBlock} to ${toBlock} ===`
  );

  const ranges = buildBlockRanges(fromBlock, toBlock, BLOCK_CHUNK_SIZE);
  console.log(`Total ranges for ${key}: ${ranges.length}`);

  const perRangeLogs = await mapWithConcurrency(
    ranges,
    async (range, i) => {
      const { fromBlock, toBlock } = range;
      console.log(
        `[${i + 1}/${ranges.length}] ${key}: ${fromBlock}-${toBlock}`
      );
      const rawLogs = await fetchEventForRange(eventConfig, range);
      const mapped = rawLogs.map(mapLog);
      console.log(
        `[${i + 1}/${ranges.length}] ${key}: ${mapped.length} events`
      );
      return mapped;
    },
    CONCURRENCY
  );

  let allLogs = perRangeLogs.flat();

  // Deduplicate by txHash + logIndex
  const seen = new Set();
  allLogs = allLogs.filter((log) => {
    const id = `${log.transactionHash}-${log.logIndex}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // Sort all logs by block number and log index
  allLogs.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    return a.logIndex - b.logIndex;
  });

  console.log(`→ ${key}: total ${allLogs.length} events after dedupe`);
  return allLogs;
}

async function main() {
  const latestBlock = await client.getBlockNumber();
  const FROM_BLOCK = 0n;
  const TO_BLOCK = latestBlock;

  console.log(
    `Scanning Pendle router events from ${FROM_BLOCK} to ${TO_BLOCK} on ${PENDLE_ROUTER}...`
  );

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const eventConfig of PENDLE_EVENTS) {
    const logs = await fetchAllForEvent(eventConfig, FROM_BLOCK, TO_BLOCK);
    fs.writeFileSync(eventConfig.outputFile, JSON.stringify(logs, null, 2));
    console.log(
      `Saved ${logs.length} ${eventConfig.key} logs to ${eventConfig.outputFile}`
    );
  }

  console.log("\n✅ Done fetching Pendle router logs.");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});