# Rysk User Data Scraper

This script uses Selenium to scrape user rank and volume data from the Rysk website by searching for each address in the `uniqueUsers.json` file.

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install ChromeDriver:**
   
   The script uses Chrome browser. You need to have ChromeDriver installed:
   
   **macOS (using Homebrew):**
   ```bash
   brew install chromedriver
   ```
   
   **Or download manually:**
   - Download from https://chromedriver.chromium.org/downloads
   - Make sure the version matches your Chrome browser version
   - Add it to your PATH

   **Alternative: Use webdriver-manager (recommended):**
   ```bash
   npm install -g webdriver-manager
   webdriver-manager update
   ```

## Configuration

1. **Set the website URL:**
   
   Edit `scrapeUserData.js` and update the `WEBSITE_URL` constant, or set it as an environment variable:
   ```bash
   export RYSK_WEBSITE_URL="https://your-rysk-website.com"
   ```

2. **Adjust selectors (if needed):**
   
   The script tries to automatically find rank and volume data using common selectors. If the page structure is different, you may need to adjust the selectors in the `scrapeAddressData` function:
   - Rank selectors: Look for elements with `data-testid*="rank"`, `.rank`, etc.
   - Volume selectors: Look for elements with `data-testid*="volume"`, `.volume`, etc.

## Usage

1. **Make sure you have the addresses file:**
   - The script reads from `uniqueUsers.json` in the same directory

2. **Run the script:**
   ```bash
   node src/rysk/scrapeUserData.js
   ```

3. **Test Mode (Default):**
   - The script will first test with the first address
   - It will show detailed results including:
     - Found rank and volume
     - Page information for debugging
     - Body text preview
   - You'll be asked to confirm before processing all addresses
   - Type `yes` or `y` to continue, or `no` to cancel

4. **Skip Test Mode:**
   ```bash
   TEST_MODE=false node src/rysk/scrapeUserData.js
   ```

5. **Monitor progress:**
   - The script will log progress to the console
   - Progress is saved every 10 addresses to `scrapedData_progress.json`
   - Final results are saved to `scrapedData.json`

## Output Format

The script generates a JSON file with the following structure:

```json
[
  {
    "address": "0xADC913c074ad4d408a411D916368b4ae4567B7fB",
    "rank": "1",
    "volume": "12345.67"
  },
  {
    "address": "0x0FA21D8005aEB1A6D8701b519ceAcbC662BE092e",
    "rank": "2",
    "volume": "9876.54"
  }
]
```

If data is not found or an error occurs:
```json
{
  "address": "0x...",
  "rank": null,
  "volume": null,
  "error": "Error message (if any)"
}
```

## Customization

### Adjust delays:
- `DELAY_BETWEEN_SEARCHES`: Time to wait between each address search (default: 2000ms)
- `PAGE_LOAD_TIMEOUT`: Timeout for page loads (default: 10000ms)
- `RESULTS_WAIT_TIMEOUT`: Time to wait for results to appear (default: 5000ms)

### Run headless (no browser window):
Uncomment this line in the script:
```javascript
chromeOptions.addArguments('--headless');
```

### Adjust selectors:
If the page structure is different, modify the `rankSelectors` and `volumeSelectors` arrays in the `scrapeAddressData` function to match your page's HTML structure.

## Troubleshooting

1. **ChromeDriver version mismatch:**
   - Make sure ChromeDriver version matches your Chrome browser version
   - Check Chrome version: `chrome://version/` in Chrome browser
   - Download matching ChromeDriver version

2. **Input field not found:**
   - Verify the placeholder text matches exactly: "Search for user"
   - Check if the page has loaded completely before searching
   - Increase `PAGE_LOAD_TIMEOUT` if needed

3. **Data not being scraped:**
   - Inspect the page HTML to find the correct selectors for rank and volume
   - Update the selectors in the script accordingly
   - You may need to wait longer for results to load (increase `RESULTS_WAIT_TIMEOUT`)

4. **Rate limiting:**
   - Increase `DELAY_BETWEEN_SEARCHES` to slow down the scraping
   - The script already includes delays to avoid overwhelming the server

## Notes

- The script saves progress every 10 addresses, so you can resume if it stops
- If the script crashes, check `scrapedData_error.json` for partial results
- The script will continue processing even if some addresses fail

