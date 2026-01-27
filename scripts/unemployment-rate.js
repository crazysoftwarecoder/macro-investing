import { chromium } from 'playwright';
import { writeToExcel } from './utils/excel-writer.js';

async function fetchUnemploymentRate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    console.log('Navigating to Employment Situation Summary...');
    await page.goto('https://www.bls.gov/news.release/empsit.nr0.htm', { timeout: 30000 });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const content = await page.locator('pre').first().textContent();

    // Look for unemployment rate pattern
    const rateMatch = content.match(/unemployment rate[,\s]+(?:at\s+)?(\d+\.?\d*)\s*percent/i) ||
                      content.match(/(\d+\.?\d*)\s*percent[,\s]+(?:and|while)/i);

    if (rateMatch) {
      const rate = parseFloat(rateMatch[1]);
      console.log(`\n✓ Unemployment Rate: ${rate}%`);

      await writeToExcel('Unemployment Rate', `${rate}%`);

      return { rate, date: new Date().toISOString() };
    } else {
      console.log('\nPage content preview:');
      console.log(content.substring(0, 500));
      console.log('\nCould not parse unemployment rate from content');
    }

  } catch (error) {
    console.error('Error fetching unemployment rate:', error.message);
  } finally {
    await browser.close();
  }
}

fetchUnemploymentRate();
