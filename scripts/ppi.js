import { writeToExcel } from './utils/excel-writer.js';

async function fetchPPI() {
  try {
    console.log('Fetching PPI data from BLS API...');
    const currentYear = new Date().getFullYear();
    const resp = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: ['WPSFD49104'],
        startyear: String(currentYear - 1),
        endyear: String(currentYear)
      })
    });

    const data = await resp.json();
    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API error: ${data.message}`);
    }

    const series = data.Results.series[0];
    const sorted = series.data
      .filter(d => d.value !== '-')
      .sort((a, b) => (a.year + a.period).localeCompare(b.year + b.period));

    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    const momChange = ((parseFloat(latest.value) - parseFloat(previous.value)) / parseFloat(previous.value) * 100).toFixed(1);
    const sign = parseFloat(momChange) >= 0 ? '+' : '';
    const ppiValue = `${sign}${momChange}%`;

    console.log(`✓ PPI MoM: ${ppiValue} (${latest.periodName} ${latest.year})`);
    await writeToExcel('PPI MoM', ppiValue);
  } catch (error) {
    console.error('Error fetching PPI:', error.message);
  }
}

fetchPPI();
