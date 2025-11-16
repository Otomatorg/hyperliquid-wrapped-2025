// extractUniqueUsers.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- __dirname (ESM) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const INPUT_DIR = path.join("hyperEVM", "fd739d4TokenTransferLogs");
const OUTPUT_FILE = "uniqueUsers.json";

// Helper function to fix common JSON issues (like missing commas)
function fixJsonString(jsonStr) {
  // Fix missing commas between array elements: "}\n  {" -> "},\n  {"
  // This regex looks for closing brace followed by whitespace and opening brace
  let fixed = jsonStr.replace(/\}\s*\{/g, "},\n  {");
  
  // Also handle cases where there might be a newline: "}\n{" -> "},\n{"
  fixed = fixed.replace(/\}\n\s*\{/g, "},\n  {");
  
  return fixed;
}

// Helper function to parse JSON with error recovery
function parseJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn(`  ⚠️  JSON parse error, attempting to fix: ${error.message}`);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const fixed = fixJsonString(content);
        return JSON.parse(fixed);
      } catch (fixError) {
        console.error(`  ❌ Failed to fix JSON in ${filePath}: ${fixError.message}`);
        throw fixError;
      }
    }
    throw error;
  }
}

function main() {
  // Use a Set to dedupe users
  const uniqueUsers = new Set();

  // Get all JSON files from the directory
  const files = fs.readdirSync(INPUT_DIR)
    .filter(file => file.endsWith(".json"))
    .sort(); // Sort to process in order

  console.log(`Found ${files.length} JSON files to process...`);

  let totalEntries = 0;

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(INPUT_DIR, file);
    
    console.log(`[${i + 1}/${files.length}] Processing ${file}...`);
    
    try {
      const raw = parseJsonFile(filePath);
      
      // Extract unique addresses from this file
      for (const entry of raw) {
        if (entry.to) uniqueUsers.add(entry.to);
        if (entry.from) uniqueUsers.add(entry.from);
      }
      
      totalEntries += raw.length;
      console.log(`  → Processed ${raw.length} entries, ${uniqueUsers.size} unique addresses so far`);
    } catch (error) {
      console.error(`  ❌ Error processing ${file}: ${error.message}`);
      throw error;
    }
  }

  // Convert set back to array
  const out = Array.from(uniqueUsers).sort();

  // Save output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   Total entries processed: ${totalEntries}`);
  console.log(`   Unique addresses found: ${out.length}`);
  console.log(`   Saved to ${OUTPUT_FILE}`);
}

main();