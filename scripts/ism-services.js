import { chromium } from 'playwright';
import { writeToExcel } from './utils/excel-writer.js';

async function fetchISMServices() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    console.log('Fetching ISM Services PMI from PR Newswire (official ISM press release)...');
    // Search PR Newswire for latest ISM Services PMI press release
    await page.goto('https://www.prnewswire.com/search/news/?keyword=ISM+Services+PMI&page=1&pagesize=10', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Find the latest Services PMI report link
    const links = await page.locator('a').all();
    let reportUrl = null;

    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text && href && text.includes('Services PMI') && text.includes('ISM') && text.includes('Report')) {
        reportUrl = href.startsWith('http') ? href : `https://www.prnewswire.com${href}`;
        break;
      }
    }

    if (reportUrl) {
      await page.goto(reportUrl, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const pageText = await page.locator('body').textContent();

      // Look for pattern: "Services PMI® at XX.X%" or "registered XX.X percent"
      const pmiMatch = pageText.match(/Services\s+PMI[®]?\s+(?:at|of)\s+(\d{2}\.?\d*)\s*%/i) ||
                       pageText.match(/Services\s+PMI[®]?\s+registered\s+(\d{2}\.?\d*)\s*percent/i) ||
                       pageText.match(/PMI[®]?\s+registered\s+at\s+(\d{2}\.?\d*)\s*percent/i);

      if (pmiMatch) {
        const value = parseFloat(pmiMatch[1]);
        if (value > 30 && value < 70) {
          console.log(`✓ ISM Non-Manufacturing PMI: ${value}`);
          await writeToExcel('ISM Non-Manufacturing PMI', value);
          return;
        }
      }
    }

    console.log('Could not find ISM Non-Manufacturing PMI value');

  } catch (error) {
    console.error('Error fetching ISM Non-Manufacturing PMI:', error.message);
  } finally {
    await browser.close();
  }
}

fetchISMServices();
