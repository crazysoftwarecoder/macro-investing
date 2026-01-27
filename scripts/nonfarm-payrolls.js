import { chromium } from 'playwright';
import { writeToExcel } from './utils/excel-writer.js';

async function fetchNonfarmPayrolls() {
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

    // Look for nonfarm payroll change pattern
    // Format: "nonfarm payroll employment (+50,000)" or "(+256,000)" or "(-50,000)"
    const payrollMatch = content.match(/nonfarm payroll employment\s*\(([+-]?[\d,]+)\)/i) ||
                         content.match(/payroll employment\s*\(([+-]?[\d,]+)\)/i);

    if (payrollMatch) {
      const rawValue = payrollMatch[1]; // e.g., "+50,000" or "-50,000"
      const numericValue = parseInt(rawValue.replace(/,/g, '').replace(/\+/g, ''), 10);
      const sign = rawValue.startsWith('-') ? '-' : '+';
      const displayValue = `${sign}${Math.abs(numericValue).toLocaleString()}`;
      console.log(`\n✓ Nonfarm Payrolls: ${displayValue}`);

      await writeToExcel('Nonfarm Payrolls', displayValue);

      return { value: displayValue, date: new Date().toISOString() };
    } else {
      console.log('\nPage content preview:');
      console.log(content.substring(0, 1000));
      console.log('\nCould not parse nonfarm payrolls from content');
    }

  } catch (error) {
    console.error('Error fetching nonfarm payrolls:', error.message);
  } finally {
    await browser.close();
  }
}

fetchNonfarmPayrolls();
