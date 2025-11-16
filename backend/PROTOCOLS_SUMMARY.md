# Protocol Points Fetching Summary

## 📡 Protocols Fetched from External APIs

These protocols are fetched in real-time from their respective APIs:

1. **ventuals** 
   - API: `https://vhype.ventuals.com/api/points/{address}/stats?latest=false`
   - Max Rank: 8,586
   - Returns: points, rank, max_rank

2. **hybra**
   - API: `https://server.hybra.finance/api/points/user/{address}`
   - Max Rank: 8,665
   - Returns: points, rank, max_rank

3. **prjx** (ProjectX)
   - API: `https://api.prjx.com/points/user?walletAddress={address}`
   - Max Rank: 34,384 (or 5,207 on error)
   - Returns: points, rank, max_rank

4. **ultrasolid**
   - API: `https://api.cluster.ultrasolid.xyz/users/{address}/point-info/999`
   - Max Rank: 30,000
   - Returns: points, rank, max_rank

**Note:** External API points take precedence over JSON file data if both exist for the same protocol.

---

## 📄 Protocols Loaded from JSON File (userInfo.json)

These protocols are loaded from the cached JSON file (`backend/src/data/userInfo.json`):

1. **felix**
2. **gLiquid** (or gliquid)
3. **hyperbeat**
4. **hyperdrive**
5. **hyperlend**
6. **hypurrfi**
7. **theo**
8. **upshift**

**Note:** Rank and percentile for these protocols are calculated using `getProtocolRankForPoints()` which uses the `points.json` data file.

---

## ❌ Protocols NOT Fetched

These protocols are referenced in the codebase but are **NOT** currently fetched:

1. **Catbal** - No API endpoint configured
2. **Hypio** - No API endpoint configured
3. **HypurrNFT** - No API endpoint configured
4. **Nunchi** - No API endpoint configured
5. **hlNames** (or hlnames) - No API endpoint configured
6. **hybrafinance** - No API endpoint configured (different from "hybra")
7. **hypersurface** - No API endpoint configured
8. **hyperswap** - No API endpoint configured
9. **kinetiq** - No API endpoint configured
10. **morpho** - No API endpoint configured
11. **pendle** - No API endpoint configured
12. **projectx** - No API endpoint configured (different from "prjx")
13. **rysk** - No API endpoint configured

---

## 🔄 How It Works

1. **External APIs are fetched first** (in parallel) for: ventuals, hybra, prjx, ultrasolid
2. **JSON file is loaded** and points are merged (external points take precedence)
3. **Rank/Percentile calculation:**
   - External API protocols: Percentile calculated using `max_rank` from API response
   - JSON file protocols: Rank/percentile calculated using `getProtocolRankForPoints()` which uses `points.json` data

---

## 📊 Summary Statistics

- **External API Protocols:** 4 (ventuals, hybra, prjx, ultrasolid)
- **JSON File Protocols:** 8 (felix, gLiquid, hyperbeat, hyperdrive, hyperlend, hypurrfi, theo, upshift)
- **Total Protocols Fetched:** 12
- **Protocols NOT Fetched:** 13

---

## 🔧 Adding New Protocols

To add a new external API protocol:
1. Add the fetch function to `backend/src/services/platforms.js`
2. Add the protocol to the `externalProtocols` object in `backend/src/services/getPoints.js`
3. Include the `max_rank` value in the return object

To add a new JSON-based protocol:
1. Ensure the protocol exists in `userInfo.json` with points data
2. Ensure the protocol exists in `points.json` for ranking calculations
3. No code changes needed - it will be automatically included

