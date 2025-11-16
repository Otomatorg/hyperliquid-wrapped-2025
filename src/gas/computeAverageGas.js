// fetch-first-tx-and-gas-stats.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// --- Config ---
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
// If you really want to hardcode, you can replace the line above with:
// const ETHERSCAN_API_KEY = "ER4U1QDC9QS3XEI61PX7MWP5DJPVFC8YVE";

const BASE_URL = "https://api.etherscan.io/v2/api";
const CHAIN_ID = "999"; // Hyperchain / HyperEVM as in your curl
const OFFSET = 1000; // max txs per page
const START_BLOCK = "0";
const END_BLOCK = "9999999999";

if (!ETHERSCAN_API_KEY) {
  console.error("❌ Missing ETHERSCAN_API_KEY in .env");
  process.exit(1);
}

// --- Helpers ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildUrl(address, page) {
  const url = new URL(BASE_URL);
  url.searchParams.set("apikey", ETHERSCAN_API_KEY);
  url.searchParams.set("chainid", CHAIN_ID);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "txlist");
  url.searchParams.set("address", address);
  url.searchParams.set("tag", "latest");
  // you had blockno=8000000 in the curl; it's not really needed
  // we keep startblock/endblock instead:
  url.searchParams.set("blockno", "8000000");
  url.searchParams.set("startblock", START_BLOCK);
  url.searchParams.set("endblock", END_BLOCK);
  url.searchParams.set("page", String(page));
  url.searchParams.set("offset", String(OFFSET));
  url.searchParams.set("sort", "asc");
  return url.toString();
}

// Some Etherscan variants wrap txs differently; this tries to handle both
function extractTransactions(apiResponse) {
  if (!apiResponse) return [];
  if (Array.isArray(apiResponse.result)) return apiResponse.result;
  if (Array.isArray(apiResponse.result?.transactions))
    return apiResponse.result.transactions;
  return [];
}

async function fetchAllTxsForAddress(address) {
  let page = 1;
  const allTxs = [];

  while (true) {
    const url = buildUrl(address, page);
    // Simple backoff in case of rate limiting etc.
    await sleep(150);

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(
        `⚠️ HTTP error for ${address} page ${page}: ${res.status} ${res.statusText}`
      );
      break;
    }

    const data = await res.json();

    // Handle Etherscan-style errors
    if (data.status === "0" && data.message && data.message !== "No transactions found") {
      console.warn(
        `⚠️ API error for ${address} page ${page}: ${data.message}`
      );
      break;
    }

    const txs = extractTransactions(data);

    if (!txs.length) break;

    allTxs.push(...txs);

    if (txs.length < OFFSET) {
      // Last page
      break;
    }

    page++;
  }

  return allTxs;
}

function computeFirstTxDate(txs) {
  if (!txs.length) return null;
  // Etherscan usually returns "timeStamp" as unix seconds (string)
  const minTs = txs.reduce((min, tx) => {
    const ts = Number(tx.timeStamp ?? tx.timeStamp);
    if (!Number.isFinite(ts)) return min;
    return min === null ? ts : Math.min(min, ts);
  }, null);

  if (minTs == null) return null;

  return {
    timestamp: minTs,
    iso: new Date(minTs * 1000).toISOString(),
  };
}

function computeTrimmedAverageGasPriceWei(gasPricesWei) {
  if (!gasPricesWei.length) return null;

  const sorted = [...gasPricesWei].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const n = sorted.length;
  const cut = Math.floor(n * 0.05); // 5%

  const startIdx = cut;
  const endIdx = n - cut;

  if (startIdx >= endIdx) {
    // Not enough data to trim; just average everything
    const sumAll = sorted.reduce((acc, v) => acc + v, 0n);
    return sumAll / BigInt(sorted.length);
  }

  const trimmed = sorted.slice(startIdx, endIdx);
  if (!trimmed.length) return null;

  const sum = trimmed.reduce((acc, v) => acc + v, 0n);
  return sum / BigInt(trimmed.length);
}

async function main() {
  // --- CLI arg: path to addresses JSON file ---
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error(
      "Usage: node fetch-first-tx-and-gas-stats.js <addresses.json>"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(inputPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  let addresses = [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON is not an array of addresses");
    }
    addresses = parsed;
  } catch (e) {
    console.error(`❌ Failed to parse JSON (${resolvedPath}):`, e.message);
    process.exit(1);
  }

  console.log(`Loaded ${addresses.length} addresses from ${resolvedPath}`);

  const perAddressResults = [];

  const allGasPricesWei = [];
  const allTxCostsWei = [];

  for (const addr of addresses) {
    console.log(`\n=== Fetching txs for ${addr} ===`);
    const txs = await fetchAllTxsForAddress(addr);
    console.log(`→ ${addr}: fetched ${txs.length} txs`);

    // first tx date
    const first = computeFirstTxDate(txs);
    perAddressResults.push({
      address: addr,
      txCount: txs.length,
      firstTxTimestamp: first ? first.timestamp : null,
      firstTxIso: first ? first.iso : null,
    });

    // collect gas prices and calculate transaction costs
    for (const tx of txs) {
      const gpStr = tx.gasPrice ?? tx.gasprice;
      const gasUsedStr = tx.gasUsed ?? tx.gasused;
      
      if (gpStr != null) {
        try {
          const gp = BigInt(gpStr);
          allGasPricesWei.push(gp);
          
          // Calculate transaction cost if we have gas used
          if (gasUsedStr != null) {
            try {
              const gasUsed = BigInt(gasUsedStr);
              const txCost = gp * gasUsed;
              allTxCostsWei.push(txCost);
            } catch {
              // ignore unparsable gas used
            }
          }
        } catch {
          // ignore unparsable gas price
        }
      }
    }
  }

  // --- Compute trimmed average gas price ---
  const avgWei = computeTrimmedAverageGasPriceWei(allGasPricesWei);
  const avgTxCostWei = computeTrimmedAverageGasPriceWei(allTxCostsWei);

  console.log("\n================ RESULTS ================");

  for (const r of perAddressResults) {
    if (r.firstTxTimestamp == null) {
      console.log(
        `${r.address}: no transactions found (txCount=${r.txCount})`
      );
    } else {
      console.log(
        `${r.address}: first tx at ${r.firstTxIso} (unix=${r.firstTxTimestamp}), txCount=${r.txCount}`
      );
    }
  }

  console.log("\n----- Gas price stats (all addresses combined) -----");
  console.log(`Total tx with gasPrice: ${allGasPricesWei.length}`);
  console.log(`Total tx with cost data: ${allTxCostsWei.length}`);

  if (avgWei == null) {
    console.log("Not enough gasPrice data to compute an average.");
  } else {
    const GWEI = 10n ** 9n;
    const HYPE = 10n ** 18n; // 1 Hype = 10^18 wei
    
    const avgGweiInt = avgWei / GWEI;
    const avgGweiFrac = Number(avgWei % GWEI) / 1e9;
    const avgGwei = Number(avgGweiInt) + avgGweiFrac;

    // Convert gas price to Hype
    const avgHypeInt = avgWei / HYPE;
    const avgHypeFrac = Number(avgWei % HYPE) / 1e18;
    const avgHype = Number(avgHypeInt) + avgHypeFrac;

    console.log(`Trimmed average gas price (5% low & high removed):`);
    console.log(`- ${avgWei.toString()} wei`);
    console.log(`- ≈ ${avgGwei.toFixed(2)} gwei`);
    console.log(`- ≈ ${avgHype.toFixed(9)} Hype`);
  }

  if (avgTxCostWei != null) {
    const HYPE = 10n ** 18n;
    
    // Convert transaction cost to Hype
    const avgCostHypeInt = avgTxCostWei / HYPE;
    const avgCostHypeFrac = Number(avgTxCostWei % HYPE) / 1e18;
    const avgCostHype = Number(avgCostHypeInt) + avgCostHypeFrac;

    console.log(`\nTrimmed average transaction cost (5% low & high removed):`);
    console.log(`- ${avgTxCostWei.toString()} wei`);
    console.log(`- ≈ ${avgCostHype.toFixed(9)} Hype`);
  }

  console.log("=========================================\n");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});