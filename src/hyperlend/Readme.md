# HyperLend Data Extraction

This directory contains scripts for fetching and processing HyperLend supply event logs from the HyperEVM blockchain.

## Files

### Scripts

#### `fetch-deposit-logs.js`
Fetches all Supply event logs from the HyperLend Pool contract (`0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b`) across a specified block range. 

**Features:**
- Fetches logs in parallel chunks for efficiency
- Handles retries and error recovery
- Sorts logs by block number and log index
- Saves results to `hyperLendSupplyLogs.json`

**Configuration:**
- Block range: Configurable via `RAW_A` and `RAW_B` constants
- Chunk size: 10,000 blocks per request
- Concurrency: 4 parallel requests
- Requires `ALCHEMY_HYPEREVM_RPC` environment variable in `.env`

#### `extractAllAddresses.js`
Extracts all unique user addresses from the supply logs JSON file.

**Features:**
- Reads `hyperLendSupplyLogs.json`
- Deduplicates user addresses using a Set
- Saves unique addresses to `uniqueUsers.json`

### Data Files

#### `hyperLendSupplyLogs.json`
Contains all fetched Supply event logs with the following structure:
- `blockNumber`: Block number where the event occurred
- `transactionHash`: Transaction hash
- `logIndex`: Log index within the block
- `reserve`: Reserve address
- `user`: User address who initiated the supply
- `onBehalfOf`: Address on behalf of which the supply was made
- `amount`: Amount supplied (as string)
- `referralCode`: Referral code (as number)

#### `uniqueUsers.json`
Array of unique user addresses extracted from the supply logs.

## Usage

1. **Fetch logs:**
   ```bash
   node fetch-deposit-logs.js
   ```

2. **Extract unique addresses:**
   ```bash
   node extractAllAddresses.js
   ```

## Requirements

- Node.js with ES modules support
- `.env` file in project root with `ALCHEMY_HYPEREVM_RPC` variable
- `dotenv` and `viem` packages installed
