// fetchAllVaultDepositLogs.js
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
const OUTPUT_FILE = "isolatedMarketDepositLogs.json";

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

// ---- Vault addresses ----
const VAULT_ADDRESSES = [
  "0xcDA6D421d5edB4267D99B4b66Dd423Ca1B8d4410",
  "0x14148d1876bD40a39DB1ED09675A81e14199C394",
  "0x543DBF5C74C6fb7C14f62b1Ae010a3696e22E3A0",
  "0x32BE2B5989e9452b6e1B993b49eA0181eB0a5A83",
  "0xE4847Cb23dAd9311b9907497EF8B39d00AC1DE14",
  "0x1C5164A764844356d57654ea83f9f1B72Cd10db5",
  "0xAeedD5B6d42e0F077ccF3E7A78ff70b8cB217329",
  "0x2c910F67DbF81099e6f8e126E7265d7595DC20aD",
  "0x8001e1e7b05990d22DD8Cdb9737f9fE6589827cE",
  "0x64dF7B4DA81a26A59417857f508B39370138D95e",
  "0x6f344dB6b76BE7E110D8AD37d14D5A9F03e2db03",
  "0xDC87120DdFC236db5E48e8E0Fee0C4b8c323B64b",
  "0x34E3d3834B79D77d8558307535Cdf4871B64Bc65",
  "0x26672D3ef84b53Ddbcd3732e9bc96c3712Ad758d",
  "0xe8648B00570B5562488d8324c98242EE8FB1A35F",
  "0x1aA7e637f62642d85f65d2a0795ec4B8C85a9095",
  "0x6ecbc0FBE25664C9a1f55aA773f91B77b60E860c",
  "0xa89bFE5222841fcE6D2602A74535Fc1C3C9Cc07E",
  "0x9136199C9002af633e4d24e4D1c8cCa5192d3dAf",
  "0xBC3FD25d4f88D8fa4C6Cc54b2eb5f623dDF5Ec22",
];

// Deposit(indexed address caller, indexed address owner, uint256 assets, uint256 shares)
const DEPOSIT_EVENT = {
  type: "event",
  name: "Deposit",
  inputs: [
    { indexed: true, name: "caller", type: "address" },
    { indexed: true, name: "owner", type: "address" },
    { indexed: false, name: "assets", type: "uint256" },
    { indexed: false, name: "shares", type: "uint256" },
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

async function fetchDepositLogsForRange(vault, { fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (true) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: vault,
        event: DEPOSIT_EVENT,
        fromBlock,
        toBlock,
      });

      return logs.map((log) => ({
        vault,
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),
        caller: log.args.caller,
        owner: log.args.owner,
        assets: log.args.assets.toString(),
        shares: log.args.shares.toString(),
      }));
    } catch (err) {
      if (attempt >= maxRetries) {
        console.error(
          `❌ Failed range ${fromBlock}-${toBlock} for ${vault} after ${attempt} attempts:`,
          err?.message || err
        );
        return [];
      }
      console.warn(
        `⚠️ Error on ${vault} range ${fromBlock}-${toBlock}, attempt ${attempt}: ${
          err?.message || err
        } – retrying...`
      );
      await sleep(300 * attempt);
    }
  }
}

async function main() {
  const latestBlock = await client.getBlockNumber();
const FROM_BLOCK = 0n;
  const TO_BLOCK = latestBlock;

  console.log(
    `Fetching Deposit logs for ${VAULT_ADDRESSES.length} vaults from block ${FROM_BLOCK} to ${TO_BLOCK}...`
  );

  const allVaultLogs = [];

  for (let i = 0; i < VAULT_ADDRESSES.length; i++) {
    const vault = VAULT_ADDRESSES[i];
    console.log(`\n=== [${i + 1}/${VAULT_ADDRESSES.length}] Vault ${vault} ===`);

    const ranges = buildBlockRanges(FROM_BLOCK, TO_BLOCK, BLOCK_CHUNK_SIZE);
    console.log(`Ranges for ${vault}: ${ranges.length}`);

    const perRangeLogs = await mapWithConcurrency(
      ranges,
      async (range, idx) => {
        const { fromBlock, toBlock } = range;
        console.log(
          `[${idx + 1}/${ranges.length}] ${vault}: ${fromBlock}-${toBlock}...`
        );
        const logs = await fetchDepositLogsForRange(vault, range);
        console.log(
          `[${idx + 1}/${ranges.length}] ${vault}: found ${logs.length} Deposit events`
        );
        return logs;
      },
      CONCURRENCY
    );

    const vaultLogs = perRangeLogs.flat();
    console.log(
      `Total Deposit events for ${vault}: ${vaultLogs.length}`
    );
    allVaultLogs.push(...vaultLogs);
  }

  // sort globally
  allVaultLogs.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    if (a.vault !== b.vault) {
      return a.vault.localeCompare(b.vault);
    }
    return a.logIndex - b.logIndex;
  });

  console.log(`\nTotal Deposit events across all vaults: ${allVaultLogs.length}`);

  fs.mkdirSync("hyperEVM", { recursive: true });
  fs.writeFileSync(
    path.join("hyperEVM", OUTPUT_FILE),
    JSON.stringify(allVaultLogs, null, 2)
  );
  console.log(`Saved logs to hyperEVM/${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});