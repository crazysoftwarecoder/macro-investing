import { chromium } from 'playwright';
import { writeToExcel } from './utils/excel-writer.js';

async function fetchPPI() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    console.log('Fetching PPI data from BLS (official source)...');
    await page.goto('https://www.bls.gov/news.release/ppi.nr0.htm', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const content = await page.locator('pre').first().textContent();

    // Look for PPI MoM pattern - final demand prices change
    // Example: "The Producer Price Index for final demand rose 0.2 percent in December"
    const ppiMatch = content.match(/final demand[^0-9]*?(rose|increased|fell|decreased|was unchanged)[^0-9]*?(\d+\.?\d*)?\s*percent/i);

    if (ppiMatch) {
      const direction = ppiMatch[1].toLowerCase();
      if (direction === 'was unchanged') {
        console.log(`✓ PPI MoM: 0.0%`);
        await writeToExcel('PPI MoM', '0.0%');
      } else {
        const value = ppiMatch[2] || '0';
        const sign = (direction === 'fell' || direction === 'decreased') ? '-' : '+';
        const ppiValue = `${sign}${value}%`;
        console.log(`✓ PPI MoM: ${ppiValue}`);
        await writeToExcel('PPI MoM', ppiValue);
      }
    } else {
      console.log('Could not find PPI MoM value');
      console.log('Content preview:', content.substring(0, 1000));
    }

  } catch (error) {
    console.error('Error fetching PPI:', error.message);
  } finally {
    await browser.close();
  }
}

fetchPPI();
