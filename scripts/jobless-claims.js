import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_FILE = path.join(__dirname, '..', 'data', 'macro-indicators.xlsx');
const PDF_URL = 'https://www.dol.gov/ui/data.pdf';

function getMonthSheetName() {
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

function getWeekOfMonth() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  const firstDayOfWeek = firstDay.getDay();
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
}

async function fetchPDF(url) {
  console.log(`Fetching PDF from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function extractJoblessClaims(pdfBuffer) {
  const data = await pdf(pdfBuffer);
  const text = data.text;

  const initialClaimsMatch = text.match(/Initial\s+Claims[^\d]*?([\d,]+)/i) ||
                              text.match(/Advance[^\d]*?([\d,]+)/i) ||
                              text.match(/([\d]{3},[\d]{3})/);

  if (initialClaimsMatch) {
    const value = initialClaimsMatch[1].replace(/,/g, '');
    return parseInt(value, 10);
  }

  console.log('\nPDF content preview:');
  console.log(text.substring(0, 1000));

  return null;
}

async function writeToExcel(indicator, value, weekNum) {
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

  // Find the weekly header row or create it
  let weeklyHeaderRowIndex = null;
  let dataRowIndex = null;

  sheet.eachRow((row, index) => {
    if (row.getCell(1).value === '' && row.getCell(2).value === 'Week 1') {
      weeklyHeaderRowIndex = index;
    }
    if (row.getCell(1).value === indicator) {
      dataRowIndex = index;
    }
  });

  // If no weekly header exists, add it and the data row
  if (!weeklyHeaderRowIndex) {
    // Add weekly header row
    const headerRow = sheet.addRow(['', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.alignment = centerAlignment;
    });
    weeklyHeaderRowIndex = headerRow.number;
    console.log('Added weekly header row');

    // Add data row for Initial Jobless Claims
    const newDataRow = sheet.addRow([indicator, '', '', '', '', '']);
    newDataRow.eachCell((cell) => {
      cell.alignment = centerAlignment;
    });
    dataRowIndex = newDataRow.number;
    console.log(`Added row for ${indicator}`);
  }

  // Set the value in the correct week column (Week 1 = col 2, Week 2 = col 3, etc.)
  const weekCol = weekNum + 1; // Week 1 is column 2
  sheet.getCell(dataRowIndex, weekCol).value = value;
  sheet.getCell(dataRowIndex, weekCol).alignment = centerAlignment;
  console.log(`Set Week ${weekNum} value to ${value}`);

  // Ensure data directory exists
  const fs = await import('fs');
  const dataDir = path.dirname(EXCEL_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(EXCEL_FILE);
  console.log(`Saved to ${EXCEL_FILE}`);
}

async function fetchJoblessClaims() {
  try {
    const pdfBuffer = await fetchPDF(PDF_URL);
    const claims = await extractJoblessClaims(pdfBuffer);

    if (claims) {
      const weekNum = getWeekOfMonth();
      console.log(`\n✓ Initial Jobless Claims: ${claims.toLocaleString()}`);
      console.log(`  Week ${weekNum} of the month`);

      await writeToExcel('Initial Jobless Claims', claims, weekNum);

      return { claims, week: weekNum, date: new Date().toISOString() };
    } else {
      console.log('\nCould not extract jobless claims from PDF');
    }

  } catch (error) {
    console.error('Error fetching jobless claims:', error.message);
  }
}

fetchJoblessClaims();
