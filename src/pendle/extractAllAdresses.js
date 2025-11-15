// extractUniqueUsers.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const HYPER_EVM_DIR = path.join(__dirname, "hyperEVM");
const OUTPUT_FILE = path.join(__dirname, "uniqueUsers.json");

// Map each input file to the field(s) that contain user addresses
// Format: "filename.json": ["field1", "field2", ...]
const FILE_FIELD_MAP = {
  "pendleSwapPtAndTokenLogs.json": ["caller", "receiver"],
  "pendleAddLiquiditySingleSyKeepYtLogs.json": ["caller", "receiver"],
  "pendleAddLiquiditySingleTokenLogs.json": ["caller", "receiver"],
  "pendleExitPostExpToTokenLogs.json": ["caller", "receiver"],
  "pendleRedeemPyToTokenLogs.json": ["caller", "receiver"],
  "pendleRemoveLiquiditySingleSyLogs.json": ["caller", "receiver"],
  "pendleRemoveLiquiditySingleTokenLogs.json": ["caller", "receiver"],
  "pendleSwapYtAndTokenLogs.json": ["caller", "receiver"],
};

function main() {
  // Use a Set to dedupe users across all files
  const uniqueUsers = new Set();

  // Process each file in the mapping
  for (const [filename, fields] of Object.entries(FILE_FIELD_MAP)) {
    const filePath = path.join(HYPER_EVM_DIR, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File ${filename} not found, skipping...`);
      continue;
    }

    try {
      // Read logs file
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      
      // Handle empty arrays
      if (!Array.isArray(raw) || raw.length === 0) {
        console.log(`Skipping ${filename}: empty or invalid file`);
        continue;
      }

      let fileUserCount = 0;

      // Extract user addresses from specified fields
      for (const entry of raw) {
        for (const field of fields) {
          if (entry[field]) {
            uniqueUsers.add(entry[field]);
            fileUserCount++;
          }
        }
      }

      console.log(`Processed ${filename}: found ${fileUserCount} address entries`);
    } catch (error) {
      console.error(`Error processing ${filename}:`, error.message);
    }
  }

  // Convert set back to array
  const out = Array.from(uniqueUsers).sort();

  // Save output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2));

  console.log(`\nDone. Found ${out.length} unique users across all files.`);
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main();