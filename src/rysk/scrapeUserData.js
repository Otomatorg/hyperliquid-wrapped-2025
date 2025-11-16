import { Builder, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WEBSITE_URL = process.env.RYSK_WEBSITE_URL || 'https://app.rysk.finance/leaderboard'; // Update this URL
const INPUT_PLACEHOLDER = 'Search for user';
const DELAY_BETWEEN_SEARCHES = 500; // 2 seconds delay between searches
const PAGE_LOAD_TIMEOUT = 10000; // 10 seconds timeout for page loads
const RESULTS_WAIT_TIMEOUT = 500; // 5 seconds to wait for results to appear
const TEST_MODE = process.env.TEST_MODE !== ''; // Set to 'false' to skip test mode
const TEST_ADDRESS_INDEX = 0; // Index of address to test with (0 = first address)

// Load addresses from uniqueUsers.json
const addresses = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'uniqueUsers.json'), 'utf-8')
);

// Load existing progress if available
const progressFile = path.join(__dirname, 'scrapedData_progress.json');
let existingResults = [];
let processedAddresses = new Set();

if (fs.existsSync(progressFile)) {
  try {
    existingResults = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    // Create a set of already processed addresses
    existingResults.forEach(result => {
      if (result.address) {
        processedAddresses.add(result.address.toLowerCase());
      }
    });
    console.log(`📂 Loaded ${existingResults.length} existing results from progress file`);
  } catch (error) {
    console.log(`⚠️ Could not load progress file: ${error.message}`);
  }
}

// Filter out already processed addresses
const addressesToProcess = addresses.filter(addr => 
  !processedAddresses.has(addr.toLowerCase())
);

// Results storage - start with existing results
const results = [...existingResults];
let processedCount = existingResults.length;
const totalAddresses = addresses.length;
const remainingAddresses = addressesToProcess.length;

// Setup Chrome options
const chromeOptions = new chrome.Options();
// Uncomment the next line to run headless (no browser window)
// chromeOptions.addArguments('--headless');
chromeOptions.addArguments('--no-sandbox');
chromeOptions.addArguments('--disable-dev-shm-usage');
chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
chromeOptions.setUserPreferences({
  'profile.default_content_setting_values.notifications': 2
});

// Function to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to ask user for confirmation
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Function to get page HTML for debugging
async function getPageInfo(driver) {
  try {
    const pageSource = await driver.getPageSource();
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    return {
      pageSourceLength: pageSource.length,
      bodyTextPreview: bodyText.substring(0, 500),
      bodyText: bodyText, // Full body text for parsing
      url: await driver.getCurrentUrl()
    };
  } catch (e) {
    return { error: e.message };
  }
}

// Function to parse rank from body text
// The rank appears 5 lines below "Rank" in the text
function parseRankFromBodyText(bodyText) {
  if (!bodyText) return null;
  
  try {
    const lines = bodyText.split('\n');
    const rankIndex = lines.findIndex(line => line.trim().toLowerCase() === 'rank');
    
    if (rankIndex !== -1 && rankIndex + 5 < lines.length) {
      // Get the line 5 lines below "Rank"
      const rankLine = lines[rankIndex + 5].trim();
      // Extract number from that line
      const rankMatch = rankLine.match(/^\d+$/);
      if (rankMatch) {
        return rankMatch[0];
      }
      // Try to find any number in that line
      const anyNumberMatch = rankLine.match(/\d+/);
      if (anyNumberMatch) {
        return anyNumberMatch[0];
      }
    }
    
    // Alternative: Look for "Rank" and then find the next number
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().toLowerCase() === 'rank') {
        // Check lines below "Rank" for a number
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const line = lines[j].trim();
          const numberMatch = line.match(/^\d+$/);
          if (numberMatch) {
            return numberMatch[0];
          }
        }
      }
    }
  } catch (e) {
    // Parsing error
  }
  
  return null;
}

// Function to scrape data for a single address
async function scrapeAddressData(driver, address, index, verbose = false) {
  try {
    if (verbose) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TEST MODE: Processing ${address}...`);
      console.log(`${'='.repeat(60)}\n`);
    } else {
      console.log(`[${index + 1}/${totalAddresses}] Processing ${address}...`);
    }

    // Find the input field with the placeholder
    const inputSelector = `input[placeholder="${INPUT_PLACEHOLDER}"]`;
    let inputElement;
    
    try {
      inputElement = await driver.wait(
        until.elementLocated(By.css(inputSelector)),
        PAGE_LOAD_TIMEOUT
      );
    } catch (error) {
      console.log(`  ✗ Could not find input field with placeholder "${INPUT_PLACEHOLDER}"`);
      return {
        address: address,
        rank: null,
        volume: null,
        error: 'Input field not found'
      };
    }

    // Clear the input field
    await inputElement.clear();
    await delay(500);

    // Type the address
    await inputElement.sendKeys(address);
    await delay(500);

    // Try to submit the search (press Enter) - some pages require this
    try {
      await inputElement.sendKeys(Key.RETURN);
      await delay(1000);
    } catch (e) {
      // If Enter doesn't work, just wait for autocomplete/dropdown
      await delay(1500);
    }

    // Wait for results to load - look for the ul element with rysk classes
    try {
      // Wait for the ul element with rysk classes (the result container)
      await driver.wait(
        until.elementLocated(By.css('ul[class*="rysk-"]')),
        RESULTS_WAIT_TIMEOUT
      );
      await delay(1500); // Additional delay for data to fully render
    } catch (error) {
      console.log(`  ⚠ No results container found for ${address}, trying to scrape anyway...`);
    }

    // Scrape rank and volume using the actual page structure
    // Structure: <ul class="rysk-..."><li>rank</li><li>username</li><li>volume</li></ul>
    let rank = null;
    let volume = null;

    try {
      // Find the ul element containing the results
      const resultUl = await driver.findElement(By.css('ul[class*="rysk-"]'));
      const listItems = await resultUl.findElements(By.css('li[class*="rysk-"]'));
      
      if (verbose && listItems.length > 0) {
        console.log(`  Found ${listItems.length} list items in result container`);
      }

      // First li contains the rank (inside a span with class "rysk-hGHvhs")
      // The rank is in the span of the first li element
      if (listItems.length > 0) {
        try {
          // Debug: Log all list items to see what we have
          if (verbose) {
            for (let i = 0; i < Math.min(listItems.length, 3); i++) {
              const liText = await listItems[i].getText();
              console.log(`  List item ${i} text: "${liText}"`);
            }
          }
          
          const firstLi = listItems[0];
          let rankText = null;
          
          // Primary method: Find span inside the first li (rank is in the span)
          // Try CSS selector first (most reliable)
          try {
            const rankSpan = await firstLi.findElement(By.css('span'));
            rankText = await rankSpan.getText();
            if (verbose) console.log(`  Found span in first li, text: "${rankText}"`);
          } catch (e1) {
            if (verbose) console.log(`  Could not find span with CSS selector: ${e1.message}`);
            
            // Fallback: Try XPath for span
            try {
              const rankSpan = await firstLi.findElement(By.xpath('.//span'));
              rankText = await rankSpan.getText();
              if (verbose) console.log(`  Found span with XPath, text: "${rankText}"`);
            } catch (e2) {
              if (verbose) console.log(`  Could not find span with XPath: ${e2.message}`);
              
              // Last resort: Get text directly from first li (includes span text)
              rankText = await firstLi.getText();
              if (verbose) console.log(`  Got first li text (fallback): "${rankText}"`);
            }
          }
          
          // Extract rank number from the text
          if (rankText) {
            const cleanedText = rankText.trim();
            // Try exact match first (pure number)
            const rankMatch = cleanedText.match(/^\d+$/);
            if (rankMatch) {
              rank = rankMatch[0];
              if (verbose) console.log(`  ✓ Extracted rank: ${rank}`);
            } else {
              // Try to find any number in the text
              const anyNumberMatch = cleanedText.match(/\d+/);
              if (anyNumberMatch) {
                rank = anyNumberMatch[0];
                if (verbose) console.log(`  ✓ Extracted rank (number match): ${rank}`);
              }
            }
          }
          
          // If still no rank, try innerHTML approach as fallback
          if (!rank) {
            try {
              const innerHTML = await firstLi.getAttribute('innerHTML');
              if (innerHTML) {
                // Try to match <span>83</span> or <span class="...">83</span>
                const htmlMatch = innerHTML.match(/<span[^>]*>(\d+)<\/span>/);
                if (htmlMatch) {
                  rank = htmlMatch[1];
                  if (verbose) console.log(`  ✓ Found rank in innerHTML: ${rank}`);
                }
              }
            } catch (e) {
              if (verbose) console.log(`  innerHTML method failed: ${e.message}`);
            }
          }
          
          if (!rank) {
            const firstLiText = await firstLi.getText();
            console.log(`  ⚠ Could not extract rank. First li text: "${firstLiText}"`);
          }
        } catch (e) {
          console.log(`  ✗ Error extracting rank from first li: ${e.message}`);
        }
      }

      // Third li (or li with justify-content: end) contains the volume
      // Volume format: $28,400.00
      if (listItems.length >= 3) {
        try {
          // Get the third li (index 2)
          const volumeText = await listItems[2].getText();
          // Extract number from text like "$28,400.00"
          const volumeMatch = volumeText.match(/[\d,]+\.?\d*/);
          if (volumeMatch) {
            volume = volumeMatch[0].replace(/,/g, '');
          }
        } catch (e) {
          if (verbose) console.log(`  Could not extract volume from third li: ${e.message}`);
        }
      } else {
        // Try to find li with justify-content: end (which contains volume)
        try {
          const volumeLi = await driver.findElement(By.xpath('//li[contains(@style, "justify-content: end")]'));
          const volumeText = await volumeLi.getText();
          const volumeMatch = volumeText.match(/[\d,]+\.?\d*/);
          if (volumeMatch) {
            volume = volumeMatch[0].replace(/,/g, '');
          }
        } catch (e) {
          if (verbose) console.log(`  Could not find volume li with justify-content: end`);
        }
      }

      // Alternative: Try to find data in a table structure
      if (!rank || !volume) {
        try {
          const tables = await driver.findElements(By.css('table'));
          
          for (const table of tables) {
            const rows = await table.findElements(By.css('tr'));
            
            for (const row of rows) {
              const rowText = await row.getText();
              const cells = await row.findElements(By.css('td, th'));
              
              // Look for rank in this row
              if (rowText.toLowerCase().includes('rank') && !rank) {
                for (const cell of cells) {
                  const cellText = await cell.getText();
                  if (/\d+/.test(cellText) && !cellText.toLowerCase().includes('rank')) {
                    const match = cellText.match(/\d+/);
                    if (match) {
                      rank = match[0];
                      break;
                    }
                  }
                }
              }
              
              // Look for volume in this row
              if (rowText.toLowerCase().includes('volume') && !volume) {
                for (const cell of cells) {
                  const cellText = await cell.getText();
                  if (/[\d,]+\.?\d*/.test(cellText) && !cellText.toLowerCase().includes('volume')) {
                    const match = cellText.match(/[\d,]+\.?\d*/);
                    if (match) {
                      volume = match[0].replace(/,/g, '');
                      break;
                    }
                  }
                }
              }
              
              // Also try XPath to find cells by text content
              if (!rank) {
                try {
                  const rankCell = await driver.findElement(
                    By.xpath('//td[contains(translate(text(), "RANK", "rank"), "rank")]/following-sibling::td[1] | //th[contains(translate(text(), "RANK", "rank"), "rank")]/following-sibling::td[1]')
                  );
                  const rankText = await rankCell.getText();
                  const match = rankText.match(/\d+/);
                  if (match) rank = match[0];
                } catch (e) {
                  // XPath not found
                }
              }
              
              if (!volume) {
                try {
                  const volumeCell = await driver.findElement(
                    By.xpath('//td[contains(translate(text(), "VOLUME", "volume"), "volume")]/following-sibling::td[1] | //th[contains(translate(text(), "VOLUME", "volume"), "volume")]/following-sibling::td[1]')
                  );
                  const volumeText = await volumeCell.getText();
                  const match = volumeText.match(/[\d,]+\.?\d*/);
                  if (match) volume = match[0].replace(/,/g, '');
                } catch (e) {
                  // XPath not found
                }
              }
            }
          }
        } catch (e) {
          // Table not found or error reading table
        }
      }
      
      // Last resort: Try to get all text and parse it
      if (!rank || !volume) {
        try {
          const bodyText = await driver.findElement(By.tagName('body')).getText();
          // Parse rank from body text (rank is 5 lines below "Rank")
          if (!rank) {
            const parsedRank = parseRankFromBodyText(bodyText);
            if (parsedRank) {
              rank = parsedRank;
              if (verbose) console.log(`  ✓ Found rank from body text parsing: ${rank}`);
            } else {
              // Fallback: Look for patterns like "Rank: 123" or "Rank 123"
              const rankMatch = bodyText.match(/rank[:\s]+(\d+)/i);
              if (rankMatch) rank = rankMatch[1];
            }
          }
          // Look for patterns like "Volume: 1234.56" or "Volume 1234.56"
          if (!volume) {
            const volumeMatch = bodyText.match(/volume[:\s]+([\d,]+\.?\d*)/i);
            if (volumeMatch) volume = volumeMatch[1].replace(/,/g, '');
          }
        } catch (e) {
          // Could not get body text
        }
      }

    } catch (error) {
      console.log(`  ⚠ Error scraping data for ${address}: ${error.message}`);
    }

    const result = {
      address: address,
      rank: rank,
      volume: volume
    };

    if (verbose) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TEST RESULTS:`);
      console.log(`  Address: ${address}`);
      console.log(`  Rank: ${rank || 'NOT FOUND'}`);
      console.log(`  Volume: ${volume || 'NOT FOUND'}`);
      console.log(`${'='.repeat(60)}\n`);
      
      // Show page info for debugging
      const pageInfo = await getPageInfo(driver);
      console.log(`Page Info:`);
      console.log(`  URL: ${pageInfo.url}`);
      console.log(`  Page Source Length: ${pageInfo.pageSourceLength} characters`);
      if (pageInfo.bodyTextPreview) {
        console.log(`  Body Text Preview (first 500 chars):`);
        console.log(`  ${pageInfo.bodyTextPreview}...\n`);
      }
    } else {
      if (rank || volume) {
        console.log(`  ✓ Found - Rank: ${rank || 'N/A'}, Volume: ${volume || 'N/A'}`);
      } else {
        console.log(`  ⚠ No data found for ${address}`);
      }
    }

    return result;

  } catch (error) {
    console.log(`  ✗ Error processing ${address}: ${error.message}`);
    return {
      address: address,
      rank: null,
      volume: null,
      error: error.message
    };
  }
}

// Test function - processes one address with detailed output
async function runTest(driver, testAddress, testIndex) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST MODE: Testing with address`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`Test Address: ${testAddress}`);
  console.log(`Website: ${WEBSITE_URL}`);
  console.log(`Input placeholder: "${INPUT_PLACEHOLDER}"\n`);
  
  const testResult = await scrapeAddressData(driver, testAddress, testIndex, true);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST SUMMARY:`);
  console.log(`${'='.repeat(60)}`);
  console.log(JSON.stringify(testResult, null, 2));
  console.log(`${'='.repeat(60)}\n`);
  
  return testResult;
}

// Main function
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RYSK USER DATA SCRAPER`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total addresses: ${totalAddresses}`);
  console.log(`Already processed: ${processedCount}`);
  console.log(`Remaining to process: ${remainingAddresses}`);
  console.log(`Website: ${WEBSITE_URL}`);
  console.log(`Input placeholder: "${INPUT_PLACEHOLDER}"`);
  console.log(`Test mode: ${TEST_MODE ? 'ENABLED' : 'DISABLED'}\n`);
  
  // If all addresses are already processed, exit early
  if (remainingAddresses === 0) {
    console.log(`✅ All addresses have already been processed!`);
    return;
  }

  let driver;
  
  try {
    // Initialize WebDriver
    console.log(`Initializing Chrome browser...`);
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    // Navigate to the website
    console.log(`Navigating to ${WEBSITE_URL}...`);
    await driver.get(WEBSITE_URL);
    await delay(3000); // Wait for initial page load
    console.log(`✓ Page loaded\n`);

    // Run test mode first if enabled
    if (TEST_MODE) {
      // Use first unprocessed address for test, or first address if all are processed
      const testAddress = addressesToProcess.length > 0 ? addressesToProcess[0] : addresses[0];
      const testIndex = addresses.indexOf(testAddress);
      
      const testResult = await scrapeAddressData(driver, testAddress, testIndex, true);
      
      // Ask user if they want to continue
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Test completed. Review the results above.`);
      console.log(`${'='.repeat(60)}`);
      const answer = await askQuestion(`\nDo you want to continue with remaining ${remainingAddresses} addresses? (yes/no): `);
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\n❌ Scraping cancelled by user.');
        return;
      }
      
      console.log(`\n✓ Proceeding with ${remainingAddresses} remaining addresses...\n`);
      
      // Add test result to results if not already processed
      if (!processedAddresses.has(testAddress.toLowerCase())) {
        results.push(testResult);
        processedCount++;
        // Remove from addressesToProcess if it was there
        const testIndexInToProcess = addressesToProcess.indexOf(testAddress);
        if (testIndexInToProcess !== -1) {
          addressesToProcess.splice(testIndexInToProcess, 1);
        }
      }
    }

    // Process each remaining address
    for (let i = 0; i < addressesToProcess.length; i++) {
      const address = addressesToProcess[i];
      const originalIndex = addresses.indexOf(address);
      const result = await scrapeAddressData(driver, address, originalIndex, false);
      results.push(result);
      processedCount++;

      // Save progress periodically (every 10 addresses)
      if (processedCount % 10 === 0) {
        fs.writeFileSync(progressFile, JSON.stringify(results, null, 2));
        console.log(`\n💾 Progress saved (${processedCount}/${totalAddresses} processed)\n`);
      }

      // Delay between searches to avoid overwhelming the server
      if (i < addressesToProcess.length - 1) {
        await delay(DELAY_BETWEEN_SEARCHES);
      }
    }

    // Save final results
    const outputFile = path.join(__dirname, 'scrapedData.json');
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    fs.writeFileSync(progressFile, JSON.stringify(results, null, 2));
    console.log(`\n✅ Scraping complete! Results saved to ${outputFile}`);
    console.log(`Total processed: ${processedCount}/${totalAddresses}`);

    // Print summary
    const successful = results.filter(r => r.rank || r.volume).length;
    const failed = results.filter(r => r.error).length;
    console.log(`\nSummary:`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  No data: ${totalAddresses - successful - failed}`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    
    // Save progress even on error
    if (results.length > 0) {
      fs.writeFileSync(progressFile, JSON.stringify(results, null, 2));
      const errorFile = path.join(__dirname, 'scrapedData_error.json');
      fs.writeFileSync(errorFile, JSON.stringify(results, null, 2));
      console.log(`\n⚠️ Partial results saved to ${progressFile} and ${errorFile}`);
    }
  } finally {
    if (driver) {
      console.log('\nClosing browser...');
      await driver.quit();
    }
  }
}

// Run the script
main().catch(console.error);

