import { chromium } from 'playwright';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_FILE = path.join(__dirname, '..', 'data', 'macro-indicators.xlsx');

function getMonthSheetName() {
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

async function writeToExcel(indicator, value) {
  const workbook = new ExcelJS.Workbook();
  const sheetName = getMonthSheetName();

  // Try to load existing file
  try {
    await workbook.xlsx.readFile(EXCEL_FILE);
    console.log('Loaded existing Excel file');
  } catch {
    console.log('Creating new Excel file');
  }

  // Get or create the sheet for current month
  let sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    sheet = workbook.addWorksheet(sheetName);
    // Set up headers
    sheet.columns = [
      { header: 'Indicator', key: 'indicator', width: 30 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Last Updated', key: 'updated', width: 25 }
    ];
    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    console.log(`Created new sheet: ${sheetName}`);
  }

  // Find existing row for this indicator or add new one
  let rowIndex = null;
  sheet.eachRow((row, index) => {
    if (index > 1 && row.getCell(1).value === indicator) {
      rowIndex = index;
    }
  });

  const now = new Date().toLocaleString();

  const centerAlignment = { horizontal: 'center', vertical: 'middle' };

  if (rowIndex) {
    // Update existing row
    sheet.getCell(rowIndex, 2).value = value;
    sheet.getCell(rowIndex, 3).value = now;
    // Apply center alignment
    for (let col = 1; col <= 3; col++) {
      sheet.getCell(rowIndex, col).alignment = centerAlignment;
    }
    console.log(`Updated existing row for ${indicator}`);
  } else {
    // Add new row
    const newRow = sheet.addRow({ indicator, value, updated: now });
    // Apply center alignment to new row
    newRow.eachCell((cell) => {
      cell.alignment = centerAlignment;
    });
    console.log(`Added new row for ${indicator}`);
  }

  // Ensure data directory exists
  const fs = await import('fs');
  const dataDir = path.dirname(EXCEL_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(EXCEL_FILE);
  console.log(`Saved to ${EXCEL_FILE}`);
}

async function fetchUnemploymentRate() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate directly to the Employment Situation Summary page
    console.log('Navigating to Employment Situation Summary...');
    await page.goto('https://www.bls.gov/news.release/empsit.nr0.htm');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Extract the unemployment rate from the summary
    const content = await page.locator('#bodytext, .normalnews, article').first().textContent();

    // Find unemployment rate pattern (e.g., "4.2 percent" or "unemployment rate was 4.2%")
    const unemploymentMatch = content.match(/unemployment rate[^0-9]*(\d+\.?\d*)\s*percent/i) ||
                              content.match(/(\d+\.?\d*)\s*percent[^.]*unemployment/i);

    if (unemploymentMatch) {
      const rate = parseFloat(unemploymentMatch[1]);
      console.log(`\n✓ Unemployment Rate: ${rate}%`);

      // Write to Excel
      await writeToExcel('Unemployment Rate', rate);

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

// Run the script
fetchUnemploymentRate();
