// --- Config ---
const API_URL = "https://api-ui.hyperliquid.xyz/info";
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 800;

// Helper functions
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toNum(x, d = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}

/**
 * Fetch user fills from Hyperliquid API
 */
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

/**
 * Calculate Hypercore stats from trades/fills
 */
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

/**
 * Format volume in USD to a human-readable string (e.g., "420k$", "1.2M$")
 */
function formatVolume(volumeUSD) {
  if (!volumeUSD || volumeUSD === 0) {
    return "0$";
  }

  if (volumeUSD >= 1000000) {
    const millions = volumeUSD / 1000000;
    if (millions >= 10) {
      return `${Math.round(millions)}M$`;
    }
    return `${millions.toFixed(1)}M$`;
  }

  if (volumeUSD >= 1000) {
    const thousands = volumeUSD / 1000;
    if (thousands >= 100) {
      return `${Math.round(thousands)}k$`;
    }
    return `${thousands.toFixed(1)}k$`;
  }

  return `${Math.round(volumeUSD)}$`;
}

/**
 * Get Hypercore stats (trades and volume) for a user.
 * Fetches data directly from Hyperliquid API.
 * 
 * @param {string} address - The user's Ethereum address
 * @returns {Promise<object>} - Object containing Hypercore stats
 *   - trades: number - Total number of trades (0 if not found or error)
 *   - volume: string - Formatted volume string (e.g., "420k$")
 */
export async function getHypercoreStats(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  try {
    // Fetch user fills from Hyperliquid API
    const fills = await fetchUserFills(address);
    
    // Calculate stats from fills
    const stats = calculateHypercoreStats(fills);
    
    const volume = formatVolume(stats.volumeUSD);

    return {
      trades: stats.trades,
      volume,
    };
  } catch (error) {
    // Log error but return default values instead of throwing
    // This ensures the API endpoint doesn't fail if Hypercore data is unavailable
    console.warn(`⚠️ Error fetching Hypercore stats for ${address}: ${error.message}`);
    return {
      trades: 0,
      volume: "0$",
    };
  }
}

