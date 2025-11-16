// fetch-fd739d4-token-transfers.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPublicClient, http } from "viem";
import { wanchainTestnet } from "viem/chains"; // placeholder; RPC overridden by RPC_URL

// --- __dirname (ESM) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load .env from project root ---
config({ path: path.resolve(__dirname, "../../.env") });

// ---- Config ----
const RPC_URL = process.env.ALCHEMY_HYPEREVM_RPC;
const OUTPUT_DIR = path.join("hyperEVM", "fd739d4TokenTransferLogs");
const OUTPUT_FILE_PREFIX = "fd739d4TokenTransferLogs";

const BLOCK_CHUNK_SIZE = 10_000n;
const CONCURRENCY = 4;
const LOGS_PER_FILE = 500_000; // Split into files of ~500k logs each

if (!RPC_URL) {
  console.error("❌ Missing ALCHEMY_HYPEREVM_RPC in .env");
  process.exit(1);
}

const client = createPublicClient({
  chain: wanchainTestnet,
  transport: http(RPC_URL),
});

// Target ERC20 token
const TOKEN_ADDRESS = "0xfD739d4e423301CE9385c1fb8850539D657C296D";

// Transfer(indexed address from, indexed address to, uint256 value)
const TRANSFER_EVENT = {
  type: "event",
  name: "Transfer",
  inputs: [
    { indexed: true, name: "from", type: "address" },
    { indexed: true, name: "to", type: "address" },
    { indexed: false, name: "value", type: "uint256" },
  ],
};

// --- Helpers ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Helper to write logs to a file stream
async function writeLogsToStream(fileStream, logs, isFirstInFile, isLastInFile) {
  const writeToStream = (data) => {
    return new Promise((resolve, reject) => {
      if (fileStream.write(data)) {
        resolve();
      } else {
        fileStream.once("drain", resolve);
      }
      fileStream.once("error", reject);
    });
  };

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const jsonStr = JSON.stringify(log, null, 2);
    const isLastLog = isLastInFile && i === logs.length - 1;
    
    // Indent each log entry and add comma if not last
    const lines = jsonStr.split("\n");
    for (let j = 0; j < lines.length; j++) {
      await writeToStream("  " + lines[j]);
      if (j < lines.length - 1) {
        await writeToStream("\n");
      }
    }
    
    if (!isLastLog) {
      await writeToStream(",\n");
    } else {
      await writeToStream("\n");
    }
  }
}

// Helper to close a file stream
async function closeStream(fileStream) {
  return new Promise((resolve, reject) => {
    fileStream.end(() => resolve());
    fileStream.once("error", reject);
  });
}

function buildBlockRanges(from, to, chunkSize) {
  const ranges = [];
  let start = from;
  while (start <= to) {
    let end = start + chunkSize;
    if (end > to) end = to;
    ranges.push({ fromBlock: start, toBlock: end });
    start = end + 1n;
  }
  return ranges;
}

async function fetchTransfersForRange({ fromBlock, toBlock }) {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const logs = await client.getLogs({
        address: TOKEN_ADDRESS,
        event: TRANSFER_EVENT,
        // no args filter: we want ALL Transfer logs
        fromBlock,
        toBlock,
      });

      return logs.map((log) => ({
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: Number(log.logIndex),
        from: log.args.from,
        to: log.args.to,
        value: log.args.value.toString(),
      }));
    } catch (err) {
      console.warn(
        `⚠️ Error on range ${fromBlock}-${toBlock}, attempt ${attempt}: ${
          err?.message || err
        }`
      );
      await sleep(300 * attempt);
    }
  }

  console.error(
    `❌ Failed range ${fromBlock}-${toBlock} after ${maxRetries} attempts`
  );
  return [];
}

async function main() {
  const latestBlock = await client.getBlockNumber();
  const FROM_BLOCK = 0n;
  const TO_BLOCK = latestBlock;

  console.log(
    `Fetching ALL Transfer events for token ${TOKEN_ADDRESS} from ${FROM_BLOCK} to ${TO_BLOCK}...`
  );

  const ranges = buildBlockRanges(FROM_BLOCK, TO_BLOCK, BLOCK_CHUNK_SIZE);
  console.log(`Total ranges: ${ranges.length}`);

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Shared state for file writing (protected by writeLock)
  let totalLogs = 0;
  let currentFileIndex = 0;
  let currentFileStream = null;
  let logsInCurrentFile = 0;
  let writeLock = Promise.resolve(); // Serialize all writes

  // Function to open a new file
  const openNewFile = async () => {
    if (currentFileStream) {
      throw new Error("File stream already open");
    }
    const fileName = `${OUTPUT_FILE_PREFIX}_part${String(currentFileIndex).padStart(4, "0")}.json`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    currentFileStream = fs.createWriteStream(filePath);
    console.log(`\n📁 Opened new file: ${fileName}`);
    
    await new Promise((resolve, reject) => {
      currentFileStream.write("[\n", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    logsInCurrentFile = 0;
    return currentFileStream;
  };

  // Function to write logs (thread-safe via writeLock)
  const writeLogs = async (logs) => {
    // Serialize all writes
    writeLock = writeLock.then(async () => {
      if (logs.length === 0) return;

      // Sort logs by blockNumber and logIndex
      logs.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return a.blockNumber - b.blockNumber;
        }
        return a.logIndex - b.logIndex;
      });

      // Open file if needed
      if (!currentFileStream) {
        await openNewFile();
      }

      let remainingLogs = logs;
      
      while (remainingLogs.length > 0) {
        // Check if we need to close current file and open a new one
        const spaceInFile = LOGS_PER_FILE - logsInCurrentFile;
        const willExceedFileLimit = remainingLogs.length > spaceInFile;
        
        if (willExceedFileLimit && logsInCurrentFile > 0) {
          // Close current file
          await new Promise((resolve, reject) => {
            currentFileStream.write("]\n", (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          await closeStream(currentFileStream);
          console.log(`✅ Closed file part${String(currentFileIndex).padStart(4, "0")}.json (${logsInCurrentFile} logs)`);
          currentFileStream = null;
          currentFileIndex++;
          logsInCurrentFile = 0;
        }

        // Open new file if needed
        if (!currentFileStream) {
          await openNewFile();
        }

        // Determine how many logs to write to current file
        const spaceInCurrentFile = LOGS_PER_FILE - logsInCurrentFile;
        const logsForThisFile = remainingLogs.slice(0, spaceInCurrentFile);
        remainingLogs = remainingLogs.slice(spaceInCurrentFile);

        // Write logs
        const isLastInFile = remainingLogs.length === 0;
        await writeLogsToStream(currentFileStream, logsForThisFile, logsInCurrentFile === 0, isLastInFile);
        
        logsInCurrentFile += logsForThisFile.length;
        totalLogs += logsForThisFile.length;
      }
    }).catch(err => {
      console.error("Error writing logs:", err);
      throw err;
    });

    await writeLock;
  };

  // Function to close the last file
  const closeLastFile = async () => {
    writeLock = writeLock.then(async () => {
      if (currentFileStream) {
        await new Promise((resolve, reject) => {
          currentFileStream.write("]\n", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        await closeStream(currentFileStream);
        console.log(`✅ Closed file part${String(currentFileIndex).padStart(4, "0")}.json (${logsInCurrentFile} logs)`);
        currentFileStream = null;
      }
    });
    await writeLock;
  };

  // Process ranges and write incrementally
  let completedRanges = 0;
  const processRange = async (range, rangeIndex) => {
    const { fromBlock, toBlock } = range;
    console.log(
      `[${rangeIndex + 1}/${ranges.length}] Fetching ${fromBlock}-${toBlock}...`
    );
    
    const logs = await fetchTransfersForRange(range);
    console.log(
      `[${rangeIndex + 1}/${ranges.length}] Found ${logs.length} Transfer events`
    );

    // Write logs immediately (thread-safe)
    if (logs.length > 0) {
      await writeLogs(logs);
    }

    completedRanges++;
    if (completedRanges % 100 === 0) {
      console.log(`  Progress: ${completedRanges}/${ranges.length} ranges, ${totalLogs} logs written`);
    }
  };

  // Process with concurrency
  let rangeIdx = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (rangeIdx < ranges.length) {
      const current = rangeIdx++;
      await processRange(ranges[current], current);
    }
  });

  await Promise.all(workers);

  // Close last file
  await closeLastFile();

  console.log(`\n✅ Complete! Total logs written: ${totalLogs}`);
  console.log(`📁 Files saved in: ${OUTPUT_DIR}`);
  console.log(`📊 Number of files: ${currentFileIndex + 1}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});