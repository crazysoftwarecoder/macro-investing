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

  try {
    await workbook.xlsx.readFile(EXCEL_FILE);
    console.log('Loaded existing Excel file');
  } catch {
    console.log('Creating new Excel file');
  }

  let sheet = workbook.getWorksheet(sheetName);
  const centerAlignment = { horizontal: 'center', vertical: 'middle' };

  if (!sheet) {
    sheet = workbook.addWorksheet(sheetName);
    sheet.columns = [
      { header: 'Indicator', key: 'indicator', width: 35 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Last Updated', key: 'updated', width: 25 }
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = centerAlignment;
    console.log(`Created new sheet: ${sheetName}`);
  }

  let rowIndex = null;
  sheet.eachRow((row, index) => {
    if (index > 1 && row.getCell(1).value === indicator) {
      rowIndex = index;
    }
  });

  const now = new Date().toLocaleString();

  if (rowIndex) {
    sheet.getCell(rowIndex, 2).value = value;
    sheet.getCell(rowIndex, 3).value = now;
    for (let col = 1; col <= 3; col++) {
      sheet.getCell(rowIndex, col).alignment = centerAlignment;
    }
    console.log(`Updated existing row for ${indicator}`);
  } else {
    const newRow = sheet.addRow([indicator, value, now]);
    newRow.eachCell((cell) => {
      cell.alignment = centerAlignment;
    });
    console.log(`Added new row for ${indicator}`);
  }

  const fs = await import('fs');
  const dataDir = path.dirname(EXCEL_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(EXCEL_FILE);
  console.log(`Saved to ${EXCEL_FILE}`);
}

async function fetchNonfarmPayrolls() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to Employment Situation Summary...');
    await page.goto('https://www.bls.gov/news.release/empsit.nr0.htm');

    await page.waitForLoadState('networkidle');

    // The content is in a <pre> tag
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
