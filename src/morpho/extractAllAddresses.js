// extractUniqueUsers.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const INPUT_FILE = path.join(__dirname, "morphoSupplyLogs.json");   // your logs file
const OUTPUT_FILE = path.join(__dirname, "uniqueUsers.json");          // where to save results

function main() {
  // Read logs file
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

  // Use a Set to dedupe users
  const uniqueUsers = new Set();

  for (const entry of raw) {
    if (entry.caller) uniqueUsers.add(entry.caller);
  }

  // Convert set back to array
  const out = Array.from(uniqueUsers);

  // Save output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2));

  console.log(`Done. Found ${out.length} unique users.`);
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main();