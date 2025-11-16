import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// --- Config ---
const DEBANK_ACCESS_KEY = process.env.DEBANK_ACCESS_KEY;
const DEBANK_API_URL = "https://pro-openapi.debank.com/v1/user/total_balance";

if (!DEBANK_ACCESS_KEY) {
  console.error("❌ Missing DEBANK_ACCESS_KEY in .env");
  throw new Error("DEBANK_ACCESS_KEY not set");
}

/**
 * Get total balance (networth) for an address from Debank API
 * @param {string} address - The user's Ethereum address
 * @returns {Promise<number>} - Total USD value from Debank API
 */
export async function getNetworth(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  const url = new URL(DEBANK_API_URL);
  url.searchParams.set("id", address);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
        AccessKey: DEBANK_ACCESS_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Debank API error for ${address}: ${response.status} ${response.statusText} - ${errorText}`
      );
      throw new Error(
        `Debank API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.total_usd_value || 0;
  } catch (error) {
    console.error(`❌ Error fetching networth for ${address}: ${error.message}`);
    throw error;
  }
}

