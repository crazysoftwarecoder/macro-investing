# Macro Investing

A data collection tool that fetches macroeconomic indicators using Playwright and stores them in Excel spreadsheets organized by month.

## Overview

This application automates the collection of macro investing indicators from various web sources. Data is stored in Excel files with each sheet representing a month.

## Architecture

```
macro-investing/
├── scripts/           # Playwright scripts for fetching data
├── data/              # Excel files with collected data
├── src/               # Core application logic
│   ├── excel/         # Excel read/write utilities
│   └── indicators/    # Indicator definitions
└── config/            # Configuration files
```

## How It Works

1. **Playwright Scripts** - Automated browser scripts navigate to data sources and extract macro indicators
2. **Data Processing** - Raw data is cleaned and formatted
3. **Excel Storage** - Data is written to Excel files, organized by month (one sheet per month)

## Excel Structure

Each Excel file contains:
- Sheets named by month (e.g., "January 2025", "February 2025")
- Rows for each macro indicator
- Columns for indicator name, value, date collected, and source

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running Data Collection

```bash
npm run collect
```

## Macro Indicators

### 1. Job Market
- 1.1 Unemployment Rate
- 1.2 Initial Jobless Claims
- 1.3 Nonfarm Payrolls

### 2. Inflation
- 2.1 CPI YoY
- 2.2 Core CPI (YoY)
- 2.3 PPI (MoM)

### 3. Economic Activities
- 3.1 ISM Manufacturing PMI
- 3.2 ISM Non-Manufacturing PMI
- 3.3 Chicago PMI
- 3.4 Consumer Confidence

## License

MIT
