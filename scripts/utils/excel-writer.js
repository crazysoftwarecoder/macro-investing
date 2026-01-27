import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_FILE = path.join(__dirname, '..', '..', 'data', 'macro-indicators.xlsx');

export function getMonthSheetName() {
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

// Parse numeric value from various formats
function parseNumericValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove %, +, k, K and commas
    const cleaned = value.replace(/[%+,kK]/g, '').trim();
    return parseFloat(cleaned);
  }
  return NaN;
}

// Economic impact and Fed action rules based on the indicator
function getEconomicAnalysis(indicator, value) {
  const numValue = parseNumericValue(value);

  const rules = {
    'Unemployment Rate': {
      thresholds: [
        { max: 4, impact: 'Strong economy', fed: 'Contractionary' },
        { max: 5.5, impact: 'OK economy', fed: 'Neutral' },
        { max: Infinity, impact: 'Weak economy', fed: 'Expansionary' }
      ]
    },
    'Initial Jobless Claims': {
      // Value is in thousands (e.g., 220 means 220,000)
      thresholds: [
        { max: 250, impact: 'Strong economy', fed: 'Contractionary' },
        { max: 350, impact: 'OK economy', fed: 'Neutral' },
        { max: Infinity, impact: 'Weak economy', fed: 'Expansionary' }
      ]
    },
    'Nonfarm Payrolls': {
      // Value is in thousands (e.g., +256 means 256,000 jobs added)
      thresholds: [
        { max: 50, impact: 'Weak economy', fed: 'Expansionary' },
        { max: 250, impact: 'OK economy', fed: 'Neutral' },
        { max: Infinity, impact: 'Strong economy', fed: 'Contractionary' }
      ]
    },
    'CPI YoY': {
      thresholds: [
        { max: 2, impact: 'Low inflation', fed: 'Expansionary' },
        { max: 2.5, impact: 'OK inflation', fed: 'Neutral' },
        { max: Infinity, impact: 'High inflation', fed: 'Contractionary' }
      ]
    },
    'Core CPI YoY': {
      thresholds: [
        { max: 2, impact: 'Low inflation', fed: 'Expansionary' },
        { max: 2.5, impact: 'OK inflation', fed: 'Neutral' },
        { max: Infinity, impact: 'High inflation', fed: 'Contractionary' }
      ]
    },
    'PPI MoM': {
      thresholds: [
        { max: 0, impact: 'Low inflation', fed: 'Expansionary' },
        { max: 0.2, impact: 'OK inflation', fed: 'Neutral' },
        { max: Infinity, impact: 'High inflation', fed: 'Contractionary' }
      ]
    },
    'ISM Manufacturing PMI': {
      thresholds: [
        { max: 50, impact: 'Contraction', fed: 'Expansionary' },
        { max: 55, impact: 'OK expansion', fed: 'Neutral' },
        { max: Infinity, impact: 'Strong expansion', fed: 'Contractionary' }
      ]
    },
    'ISM Non-Manufacturing PMI': {
      thresholds: [
        { max: 50, impact: 'Contraction', fed: 'Expansionary' },
        { max: 55, impact: 'OK expansion', fed: 'Neutral' },
        { max: Infinity, impact: 'Strong expansion', fed: 'Contractionary' }
      ]
    },
    'Chicago PMI': {
      thresholds: [
        { max: 50, impact: 'Contraction', fed: 'Expansionary' },
        { max: 55, impact: 'OK expansion', fed: 'Neutral' },
        { max: Infinity, impact: 'Strong expansion', fed: 'Contractionary' }
      ]
    },
    'Consumer Confidence': {
      thresholds: [
        { max: 100, impact: 'Negative sentiment', fed: 'Expansionary' },
        { max: 120, impact: 'OK sentiment', fed: 'Neutral' },
        { max: Infinity, impact: 'Strong sentiment', fed: 'Contractionary' }
      ]
    }
  };

  const rule = rules[indicator];
  if (!rule || isNaN(numValue)) {
    return { impact: 'N/A', fed: 'N/A' };
  }

  for (const threshold of rule.thresholds) {
    if (numValue < threshold.max || (threshold.max === Infinity && numValue >= rule.thresholds[rule.thresholds.length - 2]?.max)) {
      return { impact: threshold.impact, fed: threshold.fed };
    }
  }

  // Default to last threshold
  const lastThreshold = rule.thresholds[rule.thresholds.length - 1];
  return { impact: lastThreshold.impact, fed: lastThreshold.fed };
}

export async function writeToExcel(indicator, value) {
  const workbook = new ExcelJS.Workbook();
  const sheetName = getMonthSheetName();

  try {
    await workbook.xlsx.readFile(EXCEL_FILE);
  } catch {
    // File doesn't exist yet
  }

  let sheet = workbook.getWorksheet(sheetName);
  const centerAlignment = { horizontal: 'center', vertical: 'middle' };

  if (!sheet) {
    sheet = workbook.addWorksheet(sheetName);
    sheet.columns = [
      { header: 'Indicator', key: 'indicator', width: 30 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Economic Impact', key: 'impact', width: 20 },
      { header: 'Expected Fed Action', key: 'fed', width: 20 },
      { header: 'Last Updated', key: 'updated', width: 25 }
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = centerAlignment;
  }

  // Check if we need to add new columns to existing sheet
  const headerRow = sheet.getRow(1);
  if (!headerRow.getCell(3).value || headerRow.getCell(3).value === 'Last Updated') {
    // Need to migrate to new format with 5 columns
    headerRow.getCell(3).value = 'Economic Impact';
    headerRow.getCell(4).value = 'Expected Fed Action';
    headerRow.getCell(5).value = 'Last Updated';
    sheet.getColumn(3).width = 20;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 25;
    headerRow.font = { bold: true };
    headerRow.alignment = centerAlignment;
  }

  // Get economic analysis
  const analysis = getEconomicAnalysis(indicator, value);

  let rowIndex = null;
  sheet.eachRow((row, index) => {
    if (index > 1 && row.getCell(1).value === indicator) {
      rowIndex = index;
    }
  });

  const now = new Date().toLocaleString();

  if (rowIndex) {
    sheet.getCell(rowIndex, 2).value = value;
    sheet.getCell(rowIndex, 3).value = analysis.impact;
    sheet.getCell(rowIndex, 4).value = analysis.fed;
    sheet.getCell(rowIndex, 5).value = now;
    for (let col = 1; col <= 5; col++) {
      sheet.getCell(rowIndex, col).alignment = centerAlignment;
    }
    console.log(`Updated ${indicator}`);
  } else {
    const newRow = sheet.addRow([indicator, value, analysis.impact, analysis.fed, now]);
    newRow.eachCell((cell) => {
      cell.alignment = centerAlignment;
    });
    console.log(`Added ${indicator}`);
  }

  const dataDir = path.dirname(EXCEL_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(EXCEL_FILE);
}

// Special function for weekly jobless claims
export async function writeJoblessClaimsToExcel(indicator, value, weekNum) {
  const workbook = new ExcelJS.Workbook();
  const sheetName = getMonthSheetName();

  try {
    await workbook.xlsx.readFile(EXCEL_FILE);
  } catch {
    // File doesn't exist yet
  }

  let sheet = workbook.getWorksheet(sheetName);
  const centerAlignment = { horizontal: 'center', vertical: 'middle' };

  if (!sheet) {
    sheet = workbook.addWorksheet(sheetName);
    sheet.columns = [
      { header: 'Indicator', key: 'indicator', width: 30 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Economic Impact', key: 'impact', width: 20 },
      { header: 'Expected Fed Action', key: 'fed', width: 20 },
      { header: 'Last Updated', key: 'updated', width: 25 }
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = centerAlignment;
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

  // Get economic analysis for the value (convert to thousands for comparison)
  const valueInThousands = value / 1000;
  const analysis = getEconomicAnalysis(indicator, valueInThousands);

  // If no weekly header exists, add it and the data row
  if (!weeklyHeaderRowIndex) {
    // Add weekly header row
    const headerRow = sheet.addRow(['', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Economic Impact', 'Expected Fed Action']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.alignment = centerAlignment;
    });
    weeklyHeaderRowIndex = headerRow.number;

    // Add data row for Initial Jobless Claims
    const newDataRow = sheet.addRow([indicator, '', '', '', '', '', '', '']);
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

  // Update Economic Impact and Fed Action columns (cols 7 and 8)
  sheet.getCell(dataRowIndex, 7).value = analysis.impact;
  sheet.getCell(dataRowIndex, 7).alignment = centerAlignment;
  sheet.getCell(dataRowIndex, 8).value = analysis.fed;
  sheet.getCell(dataRowIndex, 8).alignment = centerAlignment;

  console.log(`Set Week ${weekNum} value to ${value}`);

  const dataDir = path.dirname(EXCEL_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(EXCEL_FILE);
}

export { EXCEL_FILE };
