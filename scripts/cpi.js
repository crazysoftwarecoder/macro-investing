import { chromium } from 'playwright';
import { writeToExcel } from './utils/excel-writer.js';

async function fetchCPI() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  });

  try {
    // Fetch CPI YoY from BLS
    console.log('Fetching CPI YoY from BLS (official source)...');
    await page.goto('https://www.bls.gov/news.release/cpi.nr0.htm', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const content = await page.locator('pre').first().textContent();

    const cpiYoyMatch = content.match(/12[- ]months?[^0-9]*?(?:all items index)?[^0-9]*?(?:increased|rose|decreased|fell)\s+(\d+\.?\d*)\s*percent/i) ||
                        content.match(/all items index[^0-9]*?(?:increased|rose)\s+(\d+\.?\d*)\s*percent[^.]*12/i) ||
                        content.match(/(\d+\.?\d*)\s*percent[^.]*over the (?:last |past )?12/i);

    if (cpiYoyMatch) {
      const cpiValue = `${cpiYoyMatch[1]}%`;
      console.log(`✓ CPI YoY: ${cpiValue}`);
      await writeToExcel('CPI YoY', cpiValue);
    } else {
      console.log('Could not find CPI YoY value');
    }

    // Fetch Core CPI YoY from investing.com
    console.log('Fetching Core CPI YoY from investing.com...');
    await page.goto('https://www.investing.com/economic-calendar/core-cpi-736', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(5000);

    const pageText = await page.locator('body').textContent();

    const coreCpiMatch = pageText.match(/Actual[:\s]*(\d+\.?\d*)%/i) ||
                         pageText.match(/Release.*?Actual.*?(\d+\.?\d*)%/is);

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
