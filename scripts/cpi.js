import { chromium } from 'playwright';
import { writeToExcel } from './utils/excel-writer.js';

async function fetchCPI() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    console.log('Fetching CPI data from BLS (official source)...');

    // Go to BLS CPI news release
    await page.goto('https://www.bls.gov/news.release/cpi.nr0.htm', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const content = await page.locator('pre').first().textContent();

    // Look for 12-month CPI pattern
    // Example: "over the last 12 months, the all items index increased 2.9 percent"
    const cpiYoyMatch = content.match(/12[- ]months?[^0-9]*?(?:all items index)?[^0-9]*?(?:increased|rose|decreased|fell)\s+(\d+\.?\d*)\s*percent/i) ||
                        content.match(/all items index[^0-9]*?(?:increased|rose)\s+(\d+\.?\d*)\s*percent[^.]*12/i) ||
                        content.match(/(\d+\.?\d*)\s*percent[^.]*over the (?:last |past )?12/i);

    // Look for Core CPI (all items less food and energy) 12-month change
    const coreCpiMatch = content.match(/all items less food and energy[^0-9]*?(?:increased|rose)\s+(\d+\.?\d*)\s*percent/i) ||
                         content.match(/excluding food and energy[^0-9]*?(\d+\.?\d*)\s*percent/i);

    if (cpiYoyMatch) {
      const cpiValue = `${cpiYoyMatch[1]}%`;
      console.log(`✓ CPI YoY: ${cpiValue}`);
      await writeToExcel('CPI YoY', cpiValue);
    } else {
      console.log('Could not find CPI YoY value');
      console.log('Content preview:', content.substring(0, 1000));
    }

    if (coreCpiMatch) {
      const coreCpiValue = `${coreCpiMatch[1]}%`;
      console.log(`✓ Core CPI YoY: ${coreCpiValue}`);
      await writeToExcel('Core CPI YoY', coreCpiValue);
    } else {
      console.log('Could not find Core CPI YoY value');
    }

  } catch (error) {
    console.error('Error fetching CPI:', error.message);
  } finally {
    await browser.close();
  }
}

fetchCPI();
