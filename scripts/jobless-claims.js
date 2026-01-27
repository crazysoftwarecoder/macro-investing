import pdf from 'pdf-parse';
import { writeJoblessClaimsToExcel } from './utils/excel-writer.js';

const PDF_URL = 'https://www.dol.gov/ui/data.pdf';

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

async function fetchJoblessClaims() {
  try {
    const pdfBuffer = await fetchPDF(PDF_URL);
    const claims = await extractJoblessClaims(pdfBuffer);

    if (claims) {
      const weekNum = getWeekOfMonth();
      console.log(`\n✓ Initial Jobless Claims: ${claims.toLocaleString()}`);
      console.log(`  Week ${weekNum} of the month`);

      await writeJoblessClaimsToExcel('Initial Jobless Claims', claims, weekNum);

      return { claims, week: weekNum, date: new Date().toISOString() };
    } else {
      console.log('\nCould not extract jobless claims from PDF');
    }

  } catch (error) {
    console.error('Error fetching jobless claims:', error.message);
  }
}

fetchJoblessClaims();
