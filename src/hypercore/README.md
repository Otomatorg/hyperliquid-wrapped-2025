# Hypercore Volume & Trades Data Extraction

This directory contains scripts for fetching Hypercore trading volume and number of trades per user from the Hyperliquid API.

## Files

### Scripts

#### `fetchHypercoreVolumeAndTrades.js`
Fetches all user fills (trades) from the Hyperliquid API and calculates:
- Total number of trades
- Total volume in USD

**Features:**
- Fetches user fills from Hyperliquid API
- Calculates total volume and trade count per user
- Handles retries and error recovery with exponential backoff
- Saves progress periodically (every 10 addresses) for resume capability
- Graceful shutdown handlers to persist progress on interruption

**Configuration:**
- Input: `../globalUniqueUsers.json` (address map)
- Output: `hypercoreVolumeAndTrades.json`
- Sleep between requests: 250ms
- Max retries: 4
- Save frequency: Every 10 addresses

**Output Format:**
```json
{
  "0x...": {
    "trades": 42,
    "volumeUSD": 123456.78,
    "fetchedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Usage

1. **Fetch Hypercore data:**
   ```bash
   cd src/hypercore
   node fetchHypercoreVolumeAndTrades.js
   ```

2. **Resume interrupted runs:**
   The script automatically resumes from where it left off. Simply run it again and it will skip already processed addresses.

## Requirements

- Node.js with ES modules support
- `dotenv` package installed (for environment variables if needed)

## Notes

- The script uses the Hyperliquid API endpoint: `https://api-ui.hyperliquid.xyz/info`
- Rate limiting: 250ms sleep between requests to be polite to the API
- Error handling: Failed addresses are marked with an `error` field and can be retried by deleting the entry or the error field

