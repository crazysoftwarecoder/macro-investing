<div align="center">

# 📊 Macro Investing Dashboard

**Automated macroeconomic indicator collection with AI-powered market analysis**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Automation-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[Features](#-features) • [Quick Start](#-quick-start) • [Indicators](#-indicators) • [How It Works](#-how-it-works) • [Contributing](#-contributing)

</div>

---

## 🎯 What is this?

**Macro Investing Dashboard** automatically collects 10 key macroeconomic indicators from official sources (BLS, ISM, Conference Board) and provides **AI-powered analysis** of their economic impact and expected Federal Reserve actions.

Perfect for:
- 📈 **Investors** tracking macro trends
- 🏦 **Traders** monitoring Fed policy signals
- 📊 **Analysts** building economic dashboards
- 🎓 **Students** learning macro indicators

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Automated Collection** | One command fetches all 10 indicators from official sources |
| 🧠 **AI Analysis** | Auto-computes Economic Impact & Expected Fed Action |
| 📅 **Monthly Tracking** | Data organized by month in Excel sheets |
| 🏛️ **Official Sources** | BLS, ISM, Conference Board, DOL - no third-party data |
| ⚡ **Fast & Reliable** | Playwright-powered scraping with smart retry logic |

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/crazysoftwarecoder/macro-investing.git
cd macro-investing

# Install & run
npm install && npm run collect:all
```

That's it! Check `data/macro-indicators.xlsx` for your data.

---

## 📈 Indicators

### Economic Dashboard Overview

| Category | Indicator | Source | Auto Analysis |
|----------|-----------|--------|---------------|
| **Job Market** | Unemployment Rate | BLS | ✅ |
| | Nonfarm Payrolls | BLS | ✅ |
| | Initial Jobless Claims | DOL | ✅ |
| **Inflation** | CPI YoY | BLS | ✅ |
| | Core CPI YoY | Investing.com | ✅ |
| | PPI MoM | BLS | ✅ |
| **Economic Activity** | ISM Manufacturing PMI | ISM | ✅ |
| | ISM Services PMI | ISM | ✅ |
| | Consumer Confidence | Conference Board | ✅ |
| | Chicago PMI | MNI* | Manual |

*\*Chicago PMI requires MNI subscription*

### AI-Powered Analysis

Each indicator automatically gets:

```
┌─────────────────────┬─────────┬──────────────────┬────────────────────┐
│ Indicator           │ Value   │ Economic Impact  │ Expected Fed Action│
├─────────────────────┼─────────┼──────────────────┼────────────────────┤
│ Unemployment Rate   │ 4.4%    │ OK economy       │ Neutral            │
│ ISM Manufacturing   │ 47.9    │ Contraction      │ Expansionary       │
│ Consumer Confidence │ 89.1    │ Negative sentiment│ Expansionary       │
│ CPI YoY             │ 2.7%    │ High inflation   │ Contractionary     │
└─────────────────────┴─────────┴──────────────────┴────────────────────┘
```

---

## 🔧 How It Works

```mermaid
graph LR
    A[Official Sources] -->|Playwright| B[Data Extraction]
    B -->|Analysis| C[Economic Impact]
    C -->|Fed Rules| D[Policy Prediction]
    D -->|ExcelJS| E[Monthly Excel]
```

### Analysis Thresholds

| Indicator | Weak/Low | Normal/OK | Strong/High |
|-----------|----------|-----------|-------------|
| Unemployment | >5.5% → Expansionary | 4-5.5% → Neutral | <4% → Contractionary |
| Nonfarm Payrolls | <50K → Expansionary | 50-250K → Neutral | >250K → Contractionary |
| CPI YoY | <2% → Expansionary | 2-2.5% → Neutral | >2.5% → Contractionary |
| ISM PMI | <50 → Expansionary | 50-55 → Neutral | >55 → Contractionary |
| Consumer Confidence | <100 → Expansionary | 100-120 → Neutral | >120 → Contractionary |

---

## 📁 Project Structure

```
macro-investing/
├── scripts/
│   ├── utils/
│   │   └── excel-writer.js    # Shared Excel + Analysis logic
│   ├── unemployment-rate.js   # BLS unemployment
│   ├── nonfarm-payrolls.js    # BLS payrolls
│   ├── jobless-claims.js      # DOL weekly claims
│   ├── cpi.js                 # CPI & Core CPI
│   ├── ppi.js                 # Producer prices
│   ├── ism-manufacturing.js   # ISM Manufacturing
│   ├── ism-services.js        # ISM Services
│   └── consumer-confidence.js # Conference Board
├── data/
│   └── macro-indicators.xlsx  # Output file
└── package.json
```

---

## 🛠️ Commands

```bash
# Collect all indicators
npm run collect:all

# Individual collectors
npm run collect:unemployment      # Unemployment Rate
npm run collect:nonfarm           # Nonfarm Payrolls
npm run collect:jobless           # Initial Jobless Claims
npm run collect:cpi               # CPI & Core CPI
npm run collect:ppi               # PPI
npm run collect:ism-manufacturing # ISM Manufacturing PMI
npm run collect:ism-services      # ISM Services PMI
npm run collect:consumer-confidence # Consumer Confidence
```

---

## 📅 Release Schedule

| Indicator | Release Schedule |
|-----------|-----------------|
| Unemployment & Payrolls | First Friday of month |
| Jobless Claims | Weekly (Thursday) |
| CPI & Core CPI | Monthly (~10th-15th) |
| PPI | Monthly (~11th-14th) |
| ISM Manufacturing | First business day |
| ISM Services | Third business day |
| Consumer Confidence | Last Tuesday of month |

---

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- [ ] Add more indicators (GDP, Retail Sales, Housing Starts)
- [ ] Build a web dashboard UI
- [ ] Add email/Slack notifications
- [ ] Historical data charting
- [ ] API endpoint for data access

```bash
# Fork, clone, and create a branch
git checkout -b feature/amazing-feature

# Make your changes and commit
git commit -m "Add amazing feature"

# Push and create a PR
git push origin feature/amazing-feature
```

---

## ⭐ Star History

If this project helps you, please consider giving it a star! It helps others discover it.

[![Star History Chart](https://api.star-history.com/svg?repos=crazysoftwarecoder/macro-investing&type=Date)](https://star-history.com/#crazysoftwarecoder/macro-investing&Date)

---

## 📄 License

MIT © [crazysoftwarecoder](https://github.com/crazysoftwarecoder)

---

<div align="center">

**Built with ❤️ for the macro investing community**

[Report Bug](https://github.com/crazysoftwarecoder/macro-investing/issues) • [Request Feature](https://github.com/crazysoftwarecoder/macro-investing/issues)

</div>
