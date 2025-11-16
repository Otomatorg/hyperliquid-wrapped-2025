// computeGasData.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- __dirname for ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const INPUT_FILE = path.join(__dirname, "hyperEVM/addressNonces.json");
const OUTPUT_FILE = path.join(__dirname, "gasData.json");

// Average gas cost per tx in Hype
const AVG_GAS_PER_TX_HYPE = 0.000160512;

function loadAddressNonces() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_FILE, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ Failed to parse JSON from ${INPUT_FILE}:`, e.message);
    process.exit(1);
  }

  if (Array.isArray(data) || typeof data !== "object" || data === null) {
    console.error("❌ addressNonces.json must be a plain object { address: nonce, ... }");
    process.exit(1);
  }

  return data;
}

function computeGasData(addressNonces) {
  const result = {};
  let totalGas = 0;
  let totalTx = 0;
  let addrCount = 0;

  for (const [address, nonceValue] of Object.entries(addressNonces)) {
    const txCount = Number(nonceValue);
    if (!Number.isFinite(txCount) || txCount < 0) continue;

    const gasSpent = txCount * AVG_GAS_PER_TX_HYPE; // in Hype
    const gasSpentRounded = Number(gasSpent.toFixed(9)); // keep nice precision

    result[address] = {
      txCount,
      gasSpentHype: gasSpentRounded,
    };

    totalGas += gasSpent;
    totalTx += txCount;
    addrCount++;
  }

  console.log(`🧮 Processed ${addrCount} addresses`);
  console.log(`   Total tx counted: ${totalTx}`);
  console.log(`   Total gas (Hype, approx): ${totalGas.toFixed(6)}`);

  return result;
}

function saveGasData(gasData) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(gasData, null, 2));
  console.log(`💾 gasData.json written to: ${OUTPUT_FILE}`);
}

function main() {
  console.log(`📖 Loading nonces from ${INPUT_FILE}...`);
  const addressNonces = loadAddressNonces();

  console.log("⚙️  Computing gas spent per address...");
  const gasData = computeGasData(addressNonces);

  console.log("💾 Saving results...");
  saveGasData(gasData);

  console.log("✅ Done.");
}

main();