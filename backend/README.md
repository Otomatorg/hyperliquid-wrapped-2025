# .env

```
LAVA_HYPEREVM_RPC=
ETHERSCAN_API_KEY=
DEBANK_ACCESS_KEY=
```

# How to run

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file in the backend directory:**
   ```bash
   cp .env.example .env  # If you have an example file
   # Or create it manually
   ```

3. **Fill in your environment variables in `.env`:**
   ```
   LAVA_HYPEREVM_RPC=your_lava_rpc_url
   ETHERSCAN_API_KEY=your_etherscan_api_key
   DEBANK_ACCESS_KEY=your_debank_access_key
   PORT=3001  # Optional, defaults to 3001
   ```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The API will be available at `http://localhost:3001` (or the port specified in your `.env` file).

## API Endpoints

### GET `/user?address=<ethereum_address>`
Returns user statistics including rank, gas stats, nonce, protocols, points, NFTs, networth, archetype, and Hypercore stats.

**Example:**
```bash
curl "http://localhost:3001/user?address=0x1234567890123456789012345678901234567890"
```

## Testing

Run individual test files:
```bash
node src/test/testHypercoreStats.js
node src/test/testGetPointsWithEnv.js
# etc.
```