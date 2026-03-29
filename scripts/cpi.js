import { writeToExcel } from './utils/excel-writer.js';

async function fetchCPI() {
  try {
    const currentYear = new Date().getFullYear();
    const resp = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: ['CUUR0000SA0', 'CUUR0000SA0L1E'],
        startyear: String(currentYear - 1),
        endyear: String(currentYear)
      })
    });

    const data = await resp.json();
    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API error: ${data.message}`);
    }

    for (const series of data.Results.series) {
      const sorted = series.data
        .filter(d => d.value !== '-')
        .sort((a, b) => (a.year + a.period).localeCompare(b.year + b.period));

      const latest = sorted[sorted.length - 1];
      // Find same month previous year
      const latestMonth = latest.period;
      const yearAgo = sorted.find(
        d => d.period === latestMonth && d.year === String(parseInt(latest.year) - 1)
      );

      if (!yearAgo) {
        console.log(`Could not find year-ago data for ${series.seriesID}`);
        continue;
      }

      const yoyChange = ((parseFloat(latest.value) - parseFloat(yearAgo.value)) / parseFloat(yearAgo.value) * 100).toFixed(1);

      if (series.seriesID === 'CUUR0000SA0') {
        console.log(`✓ CPI YoY: ${yoyChange}% (${latest.periodName} ${latest.year})`);
        await writeToExcel('CPI YoY', `${yoyChange}%`);
      } else {
        console.log(`✓ Core CPI YoY: ${yoyChange}% (${latest.periodName} ${latest.year})`);
        await writeToExcel('Core CPI YoY', `${yoyChange}%`);
      }
    }
  } catch (error) {
    console.error('Error fetching CPI:', error.message);
  }
}

fetchCPI();
