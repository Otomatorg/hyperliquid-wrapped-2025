import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config ---
const API_URL = "https://api-ui.hyperliquid.xyz/info";
const INPUT_FILE = path.join(__dirname, "../globalUniqueUsers.json"); // your address map
const OUTPUT_FILE = path.join(__dirname, "hypercoreVolumeAndTrades.json");

// politeness + robustness
const SLEEP_MS = 250;
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 800;
const SAVE_EVERY = 10; // ⬅️ save frequency

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toNum(x, d = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}

function safeWriteJSON(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
}

async function fetchUserFills(address) {
  const body = { aggregateByTime: true, type: "userFills", user: address };

  let attempt = 0;
  while (true) {
    attempt++;
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Origin: "https://app.dextrabot.com",
        Referer: "https://app.dextrabot.com/",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (!json) throw new Error("Invalid JSON from API");

      let fills = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.fills)
        ? json.fills
        : null;

      if (!Array.isArray(fills)) {
        const nested =
          (json?.result && Array.isArray(json.result) && json.result) ||
          (json?.response && Array.isArray(json.response) && json.response);
        if (nested) fills = nested;
      }

      if (!Array.isArray(fills)) {
        throw new Error("Could not find fills array in API response");
      }
      return fills;
    }

    if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      const text = await res.text().catch(() => "");
      console.warn(
        `API ${res.status} (attempt ${attempt}/${MAX_RETRIES}). Backing off ${backoff}ms. Body: ${text.slice(0, 200)}`
      );
      await sleep(backoff);
      continue;
    }

    const bodyText = await res.text().catch(() => "");
    throw new Error(`API HTTP ${res.status} ${res.statusText} — ${bodyText}`);
  }
}

function calculateHypercoreStats(trades) {
  let totalTrades = 0;
  let totalVolumeUSD = 0;

  for (const t of trades) {
    const szAbs = Math.abs(toNum(t.sz));
    const px = toNum(t.px);
    const notional = szAbs * px;

    totalTrades += 1;
    totalVolumeUSD += notional;
  }

  return {
    trades: totalTrades,
    volumeUSD: Number(totalVolumeUSD.toFixed(2)),
  };
}

async function main() {
  const input = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const addresses = Object.keys(input);
  console.log(`Processing ${addresses.length} addresses from ${INPUT_FILE}...`);

  // Resume
  let out = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      out = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
      console.log(`Resuming: found ${Object.keys(out).length} entries in ${OUTPUT_FILE}`);
    } catch {
      console.warn(`Could not parse existing ${OUTPUT_FILE}; starting fresh.`);
    }
  }

  let processed = 0;
  let success = 0;

  // Graceful shutdown handlers -> persist progress
  const flushAndExit = (label, code = 0) => {
    try {
      safeWriteJSON(OUTPUT_FILE, out);
      console.log(`\n💾 Progress flushed on ${label}. Exiting.`);
    } catch (e) {
      console.error(`Failed to flush on ${label}:`, e.message || e);
    }
    process.exit(code);
  };
  process.on("SIGINT", () => flushAndExit("SIGINT", 130));
  process.on("SIGTERM", () => flushAndExit("SIGTERM", 143));
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    flushAndExit("uncaughtException", 1);
  });

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];

    // Skip if already processed (and no error on record)
    if (out[addr]?.trades !== undefined && out[addr]?.volumeUSD !== undefined && !out[addr]?.error) {
      processed++;
      if (processed % SAVE_EVERY === 0) {
        safeWriteJSON(OUTPUT_FILE, out);
        console.log(`Progress saved after ${processed} addresses (resume skip).`);
      }
      continue;
    }

    try {
      console.log(`[${i + 1}/${addresses.length}] Fetching Hypercore data for ${addr}`);
      const fills = await fetchUserFills(addr);
      const stats = calculateHypercoreStats(fills);
      out[addr] = {
        trades: stats.trades,
        volumeUSD: stats.volumeUSD,
        fetchedAt: new Date().toISOString(),
      };
      delete out[addr]?.error;
      success++;
    } catch (e) {
      out[addr] = {
        ...(out[addr] || {}),
        error: String(e.message || e),
      };
      console.error(`Error for ${addr}: ${out[addr].error}`);
    }

    processed++;

    // ⬇️ Save every N addresses, regardless of skip/fetch
    if (processed % SAVE_EVERY === 0) {
      safeWriteJSON(OUTPUT_FILE, out);
      console.log(`Progress saved after ${processed} addresses`);
    }

    await sleep(SLEEP_MS);
  }

  // Final save
  safeWriteJSON(OUTPUT_FILE, out);
  console.log(`\n✅ Done. Successful=${success}/${addresses.length}. Output saved to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

