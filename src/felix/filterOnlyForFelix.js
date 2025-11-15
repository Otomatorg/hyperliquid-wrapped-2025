// filterOnlyForFelix.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const INPUT_FILE = path.join(__dirname, "morphoWithdrawCollateralAllLogs.json");
const OUTPUT_FILE = path.join(__dirname, "felixWithdrawCollateralAllLogs.json");

// Felix market IDs
const FELIX_MARKET_IDS = new Set([
  "0xf9f0473b23ebeb82c83078f0f0f77f27ac534c9fb227cb4366e6057b6163ffbf",
  "0xb5b215bd2771f5ed73125bf6a02e7b743fadc423dfbb095ad59df047c50d3e81",
  "0x64e7db7f042812d4335947a7cdf6af1093d29478aff5f1ccd93cc67f8aadfddc",
  "0xc0a3063a0a7755b7d58642e9a6d3be1c05bc974665ef7d3b158784348d4e17c5",
  "0x78f6b57d825ef01a5dc496ad1f426a6375c685047d07a30cd07ac5107ffc7976",
  "0x292f0a3ddfb642fbaadf258ebcccf9e4b0048a9dc5af93036288502bde1a71b1",
  "0xace279b5c6eff0a1ce7287249369fa6f4d3d32225e1629b04ef308e0eb568fb0",
  "0x96c7abf76aed53d50b2cc84e2ed17846e0d1c4cc28236d95b6eb3b12dcc86909",
  "0x5fe3ac84f3a2c4e3102c3e6e9accb1ec90c30f6ee87ab1fcafc197b8addeb94c",
  "0x707dddc200e95dc984feb185abf1321cabec8486dca5a9a96fb5202184106e54",
  "0x87272614b7a2022c31ddd7bba8eb21d5ab40a6bcbea671264d59dc732053721d",
  "0xe9a9bb9ed3cc53f4ee9da4eea0370c2c566873d5de807e16559a99907c9ae227",
  "0xb39e45107152f02502c001a46e2d3513f429d2363323cdaffbc55a951a69b998",
  "0x1f79fe1822f6bfe7a70f8e7e5e768efd0c3f10db52af97c2f14e4b71e3130e70",
  "0xe500760b79e397869927a5275d64987325faae43326daf6be5a560184e30a521",
  "0x86d7bc359391486de8cd1204da45c53d6ada60ab9764450dc691e1775b2e8d69",
  "0x920244a8682a53b17fe15597b63abdaa3aecec44e070379c5e43897fb9f42a2b",
  "0xd4fd53f612eaf411a1acea053cfa28cbfeea683273c4133bf115b47a20130305",
  "0x1df0d0ebcdc52069692452cb9a3e5cf6c017b237378141eaf08a05ce17205ed6",
  "0x888679b2af61343a4c7c0da0639fc5ca5fc5727e246371c4425e4d634c09e1f6",
  "0xe0a1de770a9a72a083087fe1745c998426aaea984ddf155ea3d5fbba5b759713"
]);

function main() {
  console.log("Reading input file...");
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  
  console.log(`Total entries: ${raw.length}`);
  
  // Filter entries where id matches one of the felix market IDs
  const filtered = raw.filter(entry => {
    if (!entry.id) return false;
    return FELIX_MARKET_IDS.has(entry.id.toLowerCase());
  });
  
  console.log(`Filtered entries: ${filtered.length}`);
  
  // Save output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filtered, null, 2));
  
  console.log(`Done. Saved ${filtered.length} entries to ${OUTPUT_FILE}`);
}

main();

