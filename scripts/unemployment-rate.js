import { writeToExcel } from './utils/excel-writer.js';

async function fetchUnemploymentRate() {
  try {
    console.log('Fetching Unemployment Rate from BLS API...');
    const resp = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: ['LNS14000000'],
        latest: true
      })
    });

    const data = await resp.json();
    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API error: ${data.message}`);
    }

    const series = data.Results.series[0];
    const latest = series.data[0];
    const rate = parseFloat(latest.value);

    console.log(`\n✓ Unemployment Rate: ${rate}% (${latest.periodName} ${latest.year})`);
    await writeToExcel('Unemployment Rate', `${rate}%`);

    return { rate, date: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching unemployment rate:', error.message);
  }
}

fetchUnemploymentRate();
