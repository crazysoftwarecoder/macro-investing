# Contributing to Macro Investing Dashboard

First off, thank you for considering contributing! 🎉

## How Can I Contribute?

### Reporting Bugs

- Use the [bug report template](https://github.com/crazysoftwarecoder/macro-investing/issues/new?template=bug_report.md)
- Include your Node.js version and OS
- Paste any error messages

### Suggesting New Indicators

We'd love to add more macro indicators! When suggesting:

1. Provide the official data source URL
2. Explain the release frequency
3. Describe why it's useful for investors

### Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test with `npm run collect:all`
5. Commit with a clear message
6. Push and create a PR

### Code Style

- Use ES modules (`import`/`export`)
- Follow existing patterns in `scripts/` folder
- Add comments for complex regex patterns
- Use `writeToExcel()` from the shared utility

### Adding a New Indicator

1. Create `scripts/your-indicator.js`
2. Import shared utility: `import { writeToExcel } from './utils/excel-writer.js'`
3. Add analysis thresholds in `scripts/utils/excel-writer.js`
4. Add npm script to `package.json`
5. Update README with the new indicator

## Development Setup

```bash
git clone https://github.com/crazysoftwarecoder/macro-investing.git
cd macro-investing
npm install
npm run collect:all  # Test everything works
```

## Questions?

Open an issue with the `question` label!
