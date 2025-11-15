// extractUniqueUsers.js
import fs from "fs";

// ---- Config ----
const INPUT_FILE = "vHypeTransferLogs.json";   // your logs file
const OUTPUT_FILE = "uniqueUsers.json";          // where to save results

function main() {
  // Read logs file
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

  // Use a Set to dedupe users
  const uniqueUsers = new Set();

  for (const entry of raw) {
    if (entry.to) uniqueUsers.add(entry.to);
  }

  // Convert set back to array
  const out = Array.from(uniqueUsers);

  // Save output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2));

  console.log(`Done. Found ${out.length} unique users.`);
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main();