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
  "0x0571362ba5EA9784a97605f57483f865A37dBEAA",
  "0x8A862fD6c12f9ad34C9c2ff45AB2b6712e8CEa27",
  "0x2900ABd73631b2f60747e687095537B673c06A76",
  "0xFc5126377F0efc0041C0969Ef9BA903Ce67d151e",
  "0x9896a8605763106e57A51aa0a97Fe8099E806bb3",
  "0x4346C98E690c17eFbB999aE8e1dA96B089bE320b",
  "0x92B518e1cD76dD70D3E20624AEdd7D107F332Cff",
  "0xd19e3d00f8547f7d108abFD4bbb015486437B487",
  "0x9c59a9389D8f72DE2CdAf1126F36EA4790E2275e",
  "0x53A333e51E96FE288bC9aDd7cdC4B1EAD2CD2FfA",
  "0x08C00F8279dFF5B0CB5a04d349E7d79708Ceadf3",
  "0x0571362ba5EA9784a97605f57483f865A37dBEAA",
  "0xD3A9Cb7312B9c29113290758f5ADFe12304cd16A",
  "0x207ccaE51Ad2E1C240C4Ab4c94b670D438d2201C",
  "0x3Bcc0a5a66bB5BdCEEf5dd8a659a4eC75F3834d8",
  "0xe5ADd96840F0B908ddeB3Bd144C0283Ac5ca7cA0",
  "0x66c71204B70aE27BE6dC3eb41F9aF5868E68fDb6",
  "0x5eEC795d919FA97688Fb9844eeB0072E6B846F9d",
  "0x264a06Fd7A7C9E0Bfe75163b475E2A3cc1856578",
  "0xF0A23671A810995B04A0f3eD08be86797B608D78"
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