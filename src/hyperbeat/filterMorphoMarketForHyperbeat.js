// filterOnlyForFelix.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const INPUT_FILE = path.join(__dirname, "morphoWithdrawCollateralAllLogs.json");
const OUTPUT_FILE = path.join(__dirname, "hyperbeatWithdrawCollateralAllLogs.json");

// Felix market IDs
const HYPERBEAT_MARKET_IDS = new Set([
  "0x0e5172eeb1bbf076fccc101f4a47e6f2db42eb7c39e44bd015c64b5e63e3da3d",
  "0xe7aa046832007a975d4619260d221229e99cc27da2e6ef162881202b4cd2349b",
  "0xd5c5b5db889eb5d4f4026b9704cddffbc1356732a37c2b543330c10756ae7a18",
  "0xd13b1bad542045a8dc729fa0ffcc4f538b9771592c2666e1f09667dcf85804fc",
  "0xae019cf2bf3d650ab4037986405c80ebb83fec18fb120c71bf8889d327caef0f",
  "0x45af9c72aa97978e143a646498c8922058b7c6f18b6f7b05d7316c8cf7ab942f",
  "0xfbe436e9aa361487f0c3e4ff94c88aea72887a4482c6b8bcfec60a8584cdb05e",
  "0xd5a9fba2309a0b85972a96f2cc45f9784e786d712944d8fc0b31a6d9cb4f21d3",
  "0xd2e8f6fd195556222d7a0314d4fb93fdf84ae920faaebba6dbcf584ac865e1f5",
  "0xfea758e88403739fee1113b26623f43d3c37b51dc1e1e8231b78b23d1404e439",
  "0x6eb4ce92dc1d89abd40f9634249ec28e8ab4e3f9bef0ab47ea784773c140d4ef",
  "0x8eb8cfe3b1ac8f653608ae09fb099263fa2fe25d4a59305c309937292c2aeee9",
  "0x19bbcc95b876740c0765ed1e4bac1979c4aea1b4bfbfee0e61dc1fe76a6887dc",
  "0xa62327642e110efd38ba2d153867a8625c8dc40832e1d211ba4f4151c3de9050",
  "0xb5b575e402c7c19def8661069c39464c8bf3297b638e64d841b09a4eb2807de5",
  "0x5ef35fe4418a6bcfcc70fe32efce30074f22e9a782f81d432c1e537ddbda11e2",
  "0x1da89208e6cb5173e97a83461853b8400de4f7c37542cf010a10579a5f7ca451",
  "0x19e47d37453628ebf0fd18766ce6fee1b08ea46752a5da83ca0bfecb270d07e8",
  "0x2acd218c67daa94dd2f92e81f477ffc9f8507319f0f2d698eae5ed631ae14039",
  "0x0ecf5be1fadf4bec3f79ce196f02a327b507b34d230c0f033f4970b1b510119c",
  "0x70c171a5123103f82a10b18be5efe49bd6cf21423d6f8320235ef746a24184df",
  "0xbc15a1782163f4be46c23ac61f5da50fed96ad40293f86a5ce0501ce4a246b32",
  "0x31aaa663d718e83ea15326ec110c4bcf5e123585d0b6c4d0ad61a50c4aa65b1e",
  "0x964e7d1db11bdf32262c71274c297dcdb4710d73acb814f04fdca8b0c7cdf028",
  "0xa7fe39c692f0192fb2f281a6cc16c8b2e1c8f9b9f2bc418e0c0c1e9374bf4b04",
  "0xf25db2433ae650155eae04ebd8b3795d19bfcb318d22926a8a5e746e8028e0a8",
  "0x09ed416b38a29e077383da5ae4200523e54e33ecff6e148c2590969a9852513f",
  "0xa24d04c3aff60d49b3475f0084334546cbf66182e788b6bf173e6f9990b2c816",
  "0x15f505f8dda26a523f7490ad0322f3ed4f325a54fd50832bc65e4bd75e3dca54",
  "0xebeabb17bd69d4b8ed6929a821d69478b564f4cc604d0995944c9da8b5cb3f04",
  "0xb142d65d7c624def0a9f4b49115b83f400a86bd2904d4f3339ec4441e28483ea",
  "0x7268244d330f1462f77ded7a14e2f868893e86e76e8b8eaa869405d588aff6ce",
  "0xc5526286d537c890fdd879d17d80c4a22dc7196c1e1fff0dd6c853692a759c62",
  "0x53bf81793c2cc384c19a3bc9b032467e179a390a9225cd9542742ac10f539cc2",
  "0xe0ede98b4425285a9c93d51f8ba27d9a09bc0033874e4a883d3f29d41f9f2e4a",
  "0x216bd19960f140177a4a3fb9cf258edcbadb1f5d54740fc944503bff4a00e65e",
  "0xd173e9d80aeacac486b46a9a849ecb386cec260cc7dd5be0db3505a0f9f93fb5",
  "0x0a2e456ebd22ed68ae1d5c6b2de70bc514337ac588a7a4b0e28f546662144036",
  "0xe41ace68f2de7be8e47185b51ddc23d4a58aac4ce9f8cc5f9384fe26f2104ec8",
  "0x5ecb7a25d51c870ec57f810c880e3e20743e56d0524575b7b8934a778aaec1af",
  "0x65f2a559764859a559d8c39604cf665942bab7d10dfaa1b82e914c9d351038d4",
  "0xdb2cf3ad3ef91c9bb673bf35744e7141bc2950b27a75c8d11b0ead9f6742d927",
  "0xed00791e29eb08c9bc0d8b389fe1f00084699baf2a785ba2a42e915706b17b82",
  "0x2b62c4153d81d5b5a233d1d2b7ef899d3fca4076d458e215ff3a00176b415b0d",
  "0xc59a3f8a3918d89ebef44ee1dcda435719f543cfd3f37ead7e74852ea5931581"
]);

function main() {
  console.log("Reading input file...");
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

  console.log(`Total entries: ${raw.length}`);

  // Filter entries where id matches one of the felix market IDs
  const filtered = raw.filter(entry => {
    if (!entry.id) return false;
    return HYPERBEAT_MARKET_IDS.has(entry.id.toLowerCase());
  });

  console.log(`Filtered entries: ${filtered.length}`);

  // Save output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filtered, null, 2));

  console.log(`Done. Saved ${filtered.length} entries to ${OUTPUT_FILE}`);
}

main();

