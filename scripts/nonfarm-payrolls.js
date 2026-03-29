import { writeToExcel } from './utils/excel-writer.js';

async function fetchNonfarmPayrolls() {
  try {
    console.log('Fetching Nonfarm Payrolls from BLS API...');
    const currentYear = new Date().getFullYear();
    const resp = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: ['CES0000000001'],
        startyear: String(currentYear - 1),
        endyear: String(currentYear)
      })
    });

    const data = await resp.json();
    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API error: ${data.message}`);
    }

    const series = data.Results.series[0];
    // Sort by year+period ascending
    const sorted = series.data.sort((a, b) =>
      (a.year + a.period).localeCompare(b.year + b.period)
    );

    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    const change = (parseFloat(latest.value) - parseFloat(previous.value)) * 1000;
    const sign = change >= 0 ? '+' : '';
    const displayValue = `${sign}${Math.round(change).toLocaleString()}`;

    console.log(`\n✓ Nonfarm Payrolls: ${displayValue} (${latest.periodName} ${latest.year})`);
    await writeToExcel('Nonfarm Payrolls', displayValue);

    return { value: displayValue, date: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching nonfarm payrolls:', error.message);
  }
}

fetchNonfarmPayrolls();
