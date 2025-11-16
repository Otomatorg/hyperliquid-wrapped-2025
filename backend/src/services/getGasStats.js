// backend/src/services/getGasStats.js
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { getGasRank } from "./getGasRank.js";

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// --- Config ---
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
// If you really want to hardcode, you can do it here instead:
// const ETHERSCAN_API_KEY = "ER4U1QDC9QS3XEI61PX7MWP5DJPVFC8YVE";

const BASE_URL = "https://api.etherscan.io/v2/api";
const CHAIN_ID = "999"; // HyperEVM
const OFFSET = 1000; // max txs per page (API limit)
const START_BLOCK = "0";
const END_BLOCK = "9999999999";
const MAX_TX_PER_ADDRESS = 10000; // <== hard cap per user

if (!ETHERSCAN_API_KEY) {
  console.error("❌ Missing ETHERSCAN_API_KEY in .env");
  throw new Error("ETHERSCAN_API_KEY not set");
}

// --- User Growth Points for Early Rank Calculation ---
// All user-count checkpoints (UTC, cumulative users)
const USER_GROWTH_POINTS = [
  { date: new Date('2025-02-18T00:00:00Z'), users: 0 },
  { date: new Date('2025-02-20T00:00:00Z'), users: 250 },
  { date: new Date('2025-02-25T00:00:00Z'), users: 750 },
  { date: new Date('2025-03-01T00:00:00Z'), users: 1750 },
  { date: new Date('2025-04-01T00:00:00Z'), users: 7500 },
  { date: new Date('2025-05-01T00:00:00Z'), users: 18000 },
  { date: new Date('2025-06-01T00:00:00Z'), users: 50000 },
  { date: new Date('2025-07-01T00:00:00Z'), users: 110000 },
  { date: new Date('2025-08-01T00:00:00Z'), users: 200000 },
  { date: new Date('2025-09-01T00:00:00Z'), users: 300000 },
  { date: new Date('2025-10-01T00:00:00Z'), users: 450000 },
  { date: new Date('2025-11-16T00:00:00Z'), users: 643703 }    // today
];

// Make sure they're sorted (just in case)
USER_GROWTH_POINTS.sort((a, b) => a.date - b.date);

// Current total users (from the last checkpoint)
const CURRENT_TOTAL_USERS = USER_GROWTH_POINTS[USER_GROWTH_POINTS.length - 1].users;

/**
 * Linearly interpolate user count for an arbitrary date.
 * - Before first point: linear extrapolation using first two points.
 * - After last point: linear extrapolation using last two points.
 * - Between points: standard linear interpolation.
 */
export function estimateUsersAt(date) {
  const points = USER_GROWTH_POINTS;

  if (points.length < 2) {
    throw new Error('Need at least two growth points to interpolate.');
  }

  // Before first point -> extrapolate using [0] and [1]
  if (date <= points[0].date) {
    const p0 = points[0];
    const p1 = points[1];
    return interpolateUsers(p0, p1, date);
  }

  // After last point -> extrapolate using last two
  if (date >= points[points.length - 1].date) {
    const p0 = points[points.length - 2];
    const p1 = points[points.length - 1];
    return interpolateUsers(p0, p1, date);
  }

  // Find the segment [p0, p1] such that p0.date <= date <= p1.date
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    if (date >= p0.date && date <= p1.date) {
      return interpolateUsers(p0, p1, date);
    }
  }

  // Fallback (should never hit if logic above is correct)
  return points[points.length - 1].users;
}

/**
 * Helper: linear interpolation between two points.
 */
function interpolateUsers(p0, p1, date) {
  const t0 = p0.date.getTime();
  const t1 = p1.date.getTime();
  const t = date.getTime();

  if (t1 === t0) return p1.users;

  const ratio = (t - t0) / (t1 - t0); // between 0 and 1 normally
  return p0.users + (p1.users - p0.users) * ratio;
}

/**
 * Calculate early rank based on first transaction timestamp.
 * Returns the estimated user count at the time of first transaction,
 * which represents the approximate rank (earlier = better rank).
 */
export function calculateEarlyRank(firstTxTimestamp) {
  if (!firstTxTimestamp) {
    return {
      earlyRank: null,
      earlyPercentile: null,
      estimatedUsersAtFirstTx: null,
    };
  }

  try {
    // Convert Unix timestamp to Date
    const firstTxDate = new Date(firstTxTimestamp * 1000);
    
    // Estimate how many users existed at that time
    const estimatedUsersAtFirstTx = Math.round(estimateUsersAt(firstTxDate));
    
    // The early rank is approximately the estimated user count
    // (if you were the Nth user, your rank is approximately N)
    const earlyRank = Math.max(1, estimatedUsersAtFirstTx);
    
    // Calculate percentile: earlier users = higher percentile
    // If you were among the first N users out of CURRENT_TOTAL_USERS,
    // your percentile is: ((CURRENT_TOTAL_USERS - N + 1) / CURRENT_TOTAL_USERS) * 100
    let earlyPercentile = ((CURRENT_TOTAL_USERS - earlyRank + 1) / CURRENT_TOTAL_USERS) * 100;
    
    // Clamp percentile between 0 and 100
    earlyPercentile = Math.max(0, Math.min(100, earlyPercentile));
    
    const earlyPercentileRounded = Math.round(earlyPercentile * 10) / 10;

    return {
      earlyRank,
      earlyPercentile: earlyPercentileRounded,
      estimatedUsersAtFirstTx,
    };
  } catch (error) {
    console.warn(`⚠️ Error calculating early rank: ${error.message}`);
    return {
      earlyRank: null,
      earlyPercentile: null,
      estimatedUsersAtFirstTx: null,
    };
  }
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
  // keep a blockno like in your original curl (not really needed but harmless)
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

// ---- Fetch up to MAX_TX_PER_ADDRESS txs for an address ----
async function fetchAllTxsForAddress(address) {
  let page = 1;
  const allTxs = [];

  while (true) {
    // Stop if we already hit the per-address cap
    if (allTxs.length >= MAX_TX_PER_ADDRESS) break;

    const url = buildUrl(address, page);
    await sleep(150); // simple backoff

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(
        `⚠️ HTTP error for ${address} page ${page}: ${res.status} ${res.statusText}`
      );
      break;
    }

    const data = await res.json();

    // Etherscan-style errors
    if (data.status === "0" && data.message && data.message !== "No transactions found") {
      console.warn(
        `⚠️ API error for ${address} page ${page}: ${data.message}`
      );
      break;
    }

    let txs = extractTransactions(data);

    if (!txs.length) break;

    // Respect the 10,000 tx cap
    const remaining = MAX_TX_PER_ADDRESS - allTxs.length;
    if (txs.length > remaining) {
      txs = txs.slice(0, remaining);
    }

    allTxs.push(...txs);

    if (txs.length < OFFSET || allTxs.length >= MAX_TX_PER_ADDRESS) {
      // Last page (or we hit our cap)
      break;
    }

    page++;
  }

  return allTxs;
}

function computeFirstTxInfo(txs) {
  if (!txs.length) {
    return { firstTxTimestamp: null, firstTxIso: null };
  }

  const minTs = txs.reduce((min, tx) => {
    const tsRaw = tx.timeStamp ?? tx.timestamp ?? tx.time; // try several keys
    const ts = Number(tsRaw);
    if (!Number.isFinite(ts)) return min;
    return min == null ? ts : Math.min(min, ts);
  }, null);

  if (minTs == null) {
    return { firstTxTimestamp: null, firstTxIso: null };
  }

  return {
    firstTxTimestamp: minTs,
    firstTxIso: new Date(minTs * 1000).toISOString(),
  };
}

// ---- Public service: getGasStats(address) ----
export async function getGasStats(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  console.log(`[gasService] Fetching txs for ${address} (max ${MAX_TX_PER_ADDRESS})`);

  const txs = await fetchAllTxsForAddress(address);
  const txCount = txs.length;

  console.log(
    `[gasService] ${address}: fetched ${txCount} txs (capped at ${MAX_TX_PER_ADDRESS})`
  );

  // Compute first tx info
  const { firstTxTimestamp, firstTxIso } = computeFirstTxInfo(txs);

  // Sum total gas cost in wei
  let totalGasWei = 0n;

  for (const tx of txs) {
    const gpStr = tx.gasPrice ?? tx.gasprice;
    const gasUsedStr = tx.gasUsed ?? tx.gasused;

    if (gpStr == null || gasUsedStr == null) continue;

    try {
      const gasPrice = BigInt(gpStr);
      const gasUsed = BigInt(gasUsedStr);
      const cost = gasPrice * gasUsed;
      totalGasWei += cost;
    } catch {
      // ignore unparsable values
    }
  }

  // Convert to "ETH/Hype" units (1e18)
  const WEI_PER_ETH = 10n ** 18n;
  let totalGasEth = 0;

  if (totalGasWei > 0n) {
    const intPart = totalGasWei / WEI_PER_ETH;
    const fracPart = Number(totalGasWei % WEI_PER_ETH) / 1e18;
    totalGasEth = Number(intPart) + fracPart;
  }

  // Get gas rank information
  let rank = null;
  let percentile = null;
  let totalAddresses = null;

  try {
    if (totalGasEth > 0) {
      const rankInfo = await getGasRank(totalGasEth);
      rank = rankInfo.rank;
      percentile = rankInfo.percentile;
      totalAddresses = rankInfo.totalAddresses;
    }
  } catch (error) {
    console.warn(`⚠️ Error computing gas rank: ${error.message}`);
    // Keep default values if ranking fails
  }

  // Calculate early rank based on first transaction timestamp
  const earlyRankInfo = calculateEarlyRank(firstTxTimestamp);

  return {
    // real values
    txCount,
    totalGasWei: totalGasWei.toString(),
    totalGasEth, // numeric, e.g. 1.2345
    firstTxTimestamp,
    firstTxIso,

    // gas rank information
    rank,
    percentile,
    totalAddresses,

    // early rank information
    earlyRank: earlyRankInfo.earlyRank,
    earlyPercentile: earlyRankInfo.earlyPercentile,
    estimatedUsersAtFirstTx: earlyRankInfo.estimatedUsersAtFirstTx,
  };
}