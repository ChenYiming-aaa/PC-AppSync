# Contributing to AppSync

Thank you for your interest in contributing to AppSync! We welcome contributions from the community.

## Code of Conduct

This project is governed by the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold this code. Report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before reporting a bug, please check the existing issues to see if it has already been reported. When filing a bug report, include:

- A clear, descriptive title
- Steps to reproduce (with screenshots if possible)
- Expected vs actual behavior
- Windows version and build number
- AppSync version

### Suggesting Enhancements

Feature requests are welcome. Please provide:

- A clear description of the feature
- Why it would be useful
- Any implementation ideas you have

### Submitting Download Links

AppSync includes a built-in download link library. To contribute new links:

1. Edit `backend/data/builtin-links.json`
2. Follow the existing JSON structure
3. Ensure the link points to the official download page
4. Submit a pull request, or use the in-app submission feature

## Pull Request Process

1. Fork the repository and create a feature branch from `master`
2. Make your changes following the project's code style
3. Run tests to ensure nothing is broken:
   ```bash
   ./run-tests.bat
   ```
4. Write or update tests as needed
5. Keep changes focused — one feature/fix per PR
6. Update documentation if your changes affect usage
7. Submit the PR with a clear description of the changes

## Development Setup

### Prerequisites

- **Node.js** 20+
- **Rust** 1.70+
- **Windows** 10/11 (scanning engine is Windows-specific)

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run seed-admin
npm start
```

### Desktop Client

```bash
cd desktop
npm install
npm run tauri dev
```

### Running Tests

```bash
.\run-tests.bat
```

## Code Style

- **JavaScript/TypeScript**: Follow existing patterns, use semicolons, 2-space indentation
- **Rust**: Follow `rustfmt` conventions
- **React**: Use functional components with hooks
- **CSS**: Use inline styles or the existing theme system

## Project Structure

```
app迁移工具/
  backend/          -- Node.js + Express REST API
  desktop/          -- Tauri 2 desktop client (Rust + React)
    src/            -- Frontend (React + TypeScript)
    src-tauri/src/  -- Rust scanning engine
  docs/             -- Documentation and plans
  scripts/          -- Helper scripts
```

## Questions?

If you have questions, feel free to open a discussion or ask in the issues section.
