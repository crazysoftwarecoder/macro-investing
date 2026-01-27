import { chromium } from 'playwright';
import { writeToExcel } from './utils/excel-writer.js';

async function fetchConsumerConfidence() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    console.log('Fetching Consumer Confidence from Conference Board (official source)...');
    // Conference Board official website
    await page.goto('https://www.conference-board.org/topics/consumer-confidence', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000); // Wait longer for JS to load

    const pageText = await page.locator('body').textContent();

    // Look for patterns from Conference Board press release:
    // "declined by X.X points in [month] to XX.X" or "increased by X.X points in [month] to XX.X"
    const ccMatch = pageText.match(/(?:declined|increased|rose|fell)\s+(?:by\s+\d+\.?\d*\s+points?\s+)?(?:in\s+\w+\s+)?to\s+(\d{2,3}\.?\d*)/i) ||
                    pageText.match(/Consumer\s+Confidence\s+Index[®]?\s+(?:declined|increased|rose|fell)[^0-9]*?to\s+(\d{2,3}\.?\d*)/i) ||
                    pageText.match(/Index[®]?\s+(?:stood\s+at|was|is|at)\s+(\d{2,3}\.?\d*)/i) ||
                    pageText.match(/(\d{2,3}\.\d)\s*\(1985=100\)/i);

    if (ccMatch) {
      const value = parseFloat(ccMatch[1]);
      if (value > 50 && value < 200) {
        console.log(`✓ Consumer Confidence: ${value}`);
        await writeToExcel('Consumer Confidence', value);
        return;
      }
    }

    console.log('Could not find Consumer Confidence value');
    console.log('Page text preview:', pageText.substring(0, 2000));

  } catch (error) {
    console.error('Error fetching Consumer Confidence:', error.message);
  } finally {
    await browser.close();
  }
}

fetchConsumerConfidence();
