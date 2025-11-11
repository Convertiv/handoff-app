# Token Extractor

Extract design tokens from your codebase and generate Figma Tokens Plugin JSON automatically using AI-powered analysis.

Token Extractor analyzes your CSS, SCSS, JavaScript, and TypeScript files to identify design tokens (colors, spacing, typography, etc.) and converts them into a format compatible with the [Figma Tokens plugin](https://www.figma.com/community/plugin/843461159747178978/Figma-Tokens).

## Features

- **AI-Powered Extraction**: Uses Claude (Anthropic) or GPT-4 (OpenAI) to intelligently identify and organize design tokens
- **Multiple Analysis Modes**: Choose between Quick, Balanced, or Thorough analysis based on your needs
- **Framework Agnostic**: Supports CSS, SCSS, styled-components, CSS-in-JS, and JavaScript/TypeScript theme objects
- **Semantic Naming**: Automatically generates hierarchical token names following Figma Tokens conventions
- **Duplicate Detection**: Identifies and consolidates duplicate token values
- **Comprehensive Reports**: Generates detailed reports with recommendations and next steps
- **Interactive CLI**: Guides you through the extraction process with smart defaults

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Key Setup](#api-key-setup)
- [Usage](#usage)
  - [Extract Command](#extract-command)
  - [Command Options](#command-options)
- [Analysis Modes](#analysis-modes)
  - [Quick Mode](#quick-mode)
  - [Balanced Mode](#balanced-mode)
  - [Thorough Mode](#thorough-mode)
- [Configuration](#configuration)
- [Output Files](#output-files)
- [Figma Tokens Integration](#figma-tokens-integration)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Installation

### As a Package Dependency

```bash
npm install @handoff/token-extractor
```

### Global Installation

```bash
npm install -g @handoff/token-extractor
```

### Running with npx (No Installation)

```bash
npx @handoff/token-extractor extract
```

## Quick Start

Navigate to your project directory and run:

```bash
token-extractor extract
```

The CLI will:
1. Scan your codebase to understand its structure
2. Recommend an analysis mode based on project size
3. Prompt you to select a mode (or use `--mode` flag)
4. Extract tokens using AI analysis
5. Generate `figma-tokens.json` and optional reports

## API Key Setup

Token Extractor requires an API key from either Anthropic (recommended) or OpenAI.

### Option 1: Environment Variables (Recommended for CI/CD)

```bash
# For Anthropic (Claude)
export ANTHROPIC_API_KEY="sk-ant-..."

# For OpenAI (GPT-4)
export OPENAI_API_KEY="sk-..."
```

Add to your `.bashrc`, `.zshrc`, or `.env` file for persistence.

### Option 2: Interactive Prompt (Recommended for Local Development)

When you run the tool without an API key, it will prompt you to:
1. Choose your AI provider (Anthropic or OpenAI)
2. Enter your API key
3. Optionally save it to `~/.token-extractor.config.json`

### Option 3: Configuration File

Create `~/.token-extractor.config.json`:

```json
{
  "anthropicApiKey": "sk-ant-...",
  "openaiApiKey": "sk-..."
}
```

The tool will use the first available key it finds.

### Getting API Keys

**Anthropic (Claude) - Recommended**
- Visit: https://console.anthropic.com/
- Create an account or sign in
- Go to API Keys section
- Generate a new API key
- Cost: ~$0.50-$2.00 per codebase extraction

**OpenAI (GPT-4)**
- Visit: https://platform.openai.com/
- Create an account or sign in
- Go to API Keys section
- Generate a new API key
- Cost: Similar to Anthropic, varies by mode

## Usage

### Extract Command

Extract design tokens from your current directory:

```bash
token-extractor extract
```

### Command Options

```bash
token-extractor extract [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-m, --mode <mode>` | Analysis mode: `quick`, `balanced`, or `thorough` | Interactive prompt |
| `--no-interactive` | Skip interactive questions and use defaults | Interactive mode |
| `-o, --output <path>` | Output file path for tokens JSON | `./figma-tokens.json` |
| `--no-report` | Skip generating the extraction report | Report generated |
| `--no-audit` | Skip generating audit/cleanup tasks | Audit generated |
| `-h, --help` | Display help information | - |
| `-V, --version` | Display version number | - |

#### Examples

**Quick extraction with defaults:**
```bash
token-extractor extract
```

**Non-interactive with specific mode:**
```bash
token-extractor extract --mode balanced --no-interactive
```

**Custom output path:**
```bash
token-extractor extract -o ./design-system/tokens.json
```

**Skip reports and audits:**
```bash
token-extractor extract --no-report --no-audit
```

## Analysis Modes

Token Extractor offers three analysis modes, each balancing speed, cost, and accuracy.

### Quick Mode

**Best for:** Small projects, well-structured codebases, tight budgets

**How it works:**
1. Uses AST parsers (PostCSS, Babel) to quickly extract tokens from files
2. Sends extracted tokens to AI for semantic grouping and naming
3. Single AI call with minimal context

**Characteristics:**
- **Speed**: ~60 seconds
- **Cost**: $0.10-$0.50
- **Accuracy**: 75%
- **Best for**: Projects with clear token definitions in CSS variables or theme files

**Use when:**
- Your tokens are well-organized in dedicated files
- You have consistent naming conventions
- You want a quick first pass

### Balanced Mode (Recommended)

**Best for:** Most projects, diverse frameworks, general use

**How it works:**
1. Loads file contents directly from disk
2. Sends files in batches to AI for comprehensive analysis
3. Single-pass analysis handles all pattern types
4. Merges results from all batches

**Characteristics:**
- **Speed**: ~90 seconds
- **Cost**: $0.50-$1.50
- **Accuracy**: 85%
- **Best for**: React, Vue, or Angular projects with modern styling approaches

**Use when:**
- You have a mix of CSS, SCSS, and JS-based styling
- Your project uses styled-components or CSS-in-JS
- You want good results without high cost

### Thorough Mode

**Best for:** Large codebases, maximum accuracy, production design systems

**How it works:**
1. **Pass 1**: Analyzes each file individually to extract all potential tokens
2. **Pass 2**: Compares tokens across files to find patterns and duplicates
3. **Pass 3**: Organizes tokens into semantic hierarchy (core/semantic/component)
4. **Pass 4**: Creates aliases and references between related tokens

**Characteristics:**
- **Speed**: ~2-5 minutes
- **Cost**: $1.00-$5.00
- **Accuracy**: 95%
- **Best for**: Enterprise applications with complex design systems

**Use when:**
- You need the highest accuracy
- Your codebase has inconsistent token usage
- You're building a production design system
- Cost is not a primary concern

## Configuration

Token Extractor uses smart defaults but can be customized via command-line options.

### Project Discovery

The tool automatically discovers:
- **Frameworks**: React, Vue, Angular, Svelte, etc.
- **Style Files**: CSS, SCSS, LESS, Stylus
- **Component Files**: JS, JSX, TS, TSX
- **Token Files**: Dedicated theme/token files
- **Existing Tokens**: Figma Tokens JSON files

### File Inclusion/Exclusion

By default, the tool:
- **Includes**: `src/`, `styles/`, `components/`, `theme/`, `tokens/`
- **Excludes**: `node_modules/`, `dist/`, `build/`, `.git/`, `test/`, `tests/`

To customize, modify the discovery scanner in your code or use a configuration file (future feature).

## Output Files

### figma-tokens.json

The primary output file containing all extracted tokens in Figma Tokens Plugin v2 format.

```json
{
  "colors": {
    "primary": {
      "500": {
        "value": "#0ea5e9",
        "type": "color"
      }
    }
  },
  "spacing": {
    "md": {
      "value": "16px",
      "type": "spacing"
    }
  }
}
```

### token-extraction-report.md (optional)

A human-readable report with:
- Extraction summary and statistics
- Token breakdown by category
- Recommendations for improvement
- Next steps for Figma integration

See [examples/sample-report.md](./examples/sample-report.md) for a complete example.

### token-audit.json (optional)

A structured list of cleanup tasks and potential issues:
- Duplicate tokens to consolidate
- Inconsistent naming to fix
- Missing tokens to add
- Semantic organization suggestions

## Figma Tokens Integration

### Installing the Figma Tokens Plugin

1. Open Figma
2. Go to **Plugins** → **Browse plugins in Community**
3. Search for **"Figma Tokens"**
4. Click **Install**

### Importing Your Tokens

1. Open the Figma Tokens plugin in your design file
2. Click the **Settings** icon (gear icon)
3. Select **Import** → **Load from JSON**
4. Upload your generated `figma-tokens.json` file
5. Click **Import**

### Applying Tokens to Designs

1. Select any element in Figma
2. Open the Figma Tokens plugin
3. Click on a token to apply it (e.g., a color token to fill)
4. Tokens will update automatically when changed

### Syncing with Your Codebase

To keep tokens in sync between code and design:

1. **Version Control**: Commit `figma-tokens.json` to your repository
2. **Re-run Extraction**: When tokens change in code, run the extractor again
3. **Update Figma**: Import the updated JSON into Figma Tokens
4. **Two-Way Sync**: Consider using Figma Tokens' GitHub sync feature for automatic updates

## Examples

### Example 1: Basic Extraction

```bash
cd my-react-app
token-extractor extract
```

Output:
```
Scanning project...
Found 45 files (3,200 lines)
Frameworks: react, styled-components

Recommended mode: BALANCED
Cost: $0.85 | Time: ~90s | Accuracy: 85%

Select Analysis Mode:
> BALANCED [RECOMMENDED]
  QUICK
  THOROUGH

Extracting tokens...
✓ Pass 1 complete (45 files)
✓ Tokens refined

Files written:
  • ./figma-tokens.json
  • ./token-extraction-report.md
  • ./token-audit.json
```

### Example 2: Large Project (Thorough Mode)

```bash
token-extractor extract --mode thorough -o ./design-system/tokens.json
```

Output:
```
Scanning project...
Found 230 files (28,500 lines)
Frameworks: react, typescript, emotion

Using mode: THOROUGH
Cost: $3.20 | Time: ~240s | Accuracy: 95%

Extracting tokens...
✓ Pass 1: Per-file extraction (230 files)
✓ Pass 2: Pattern detection (45 patterns found)
✓ Pass 3: Semantic grouping (3 tiers)
✓ Pass 4: Alias detection (67 aliases created)

Files written:
  • ./design-system/tokens.json
  • ./token-extraction-report.md
  • ./token-audit.json
```

### Example 3: CI/CD Integration

```yaml
# .github/workflows/extract-tokens.yml
name: Extract Design Tokens

on:
  push:
    branches: [main]
    paths:
      - 'src/**/*.css'
      - 'src/**/*.scss'
      - 'src/theme/**'

jobs:
  extract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Extract Tokens
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx @handoff/token-extractor extract \
            --mode balanced \
            --no-interactive \
            -o ./design-system/figma-tokens.json

      - name: Commit Changes
        run: |
          git config --global user.name "Token Extractor Bot"
          git config --global user.email "bot@example.com"
          git add ./design-system/figma-tokens.json
          git commit -m "Update design tokens" || echo "No changes"
          git push
```

### Example 4: NPM Scripts

```json
{
  "scripts": {
    "tokens:extract": "token-extractor extract",
    "tokens:quick": "token-extractor extract --mode quick --no-interactive",
    "tokens:balanced": "token-extractor extract --mode balanced --no-interactive",
    "tokens:thorough": "token-extractor extract --mode thorough --no-interactive"
  }
}
```

## Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

**Quick Links:**
- [API Key Issues](./TROUBLESHOOTING.md#api-key-issues)
- [File Parsing Errors](./TROUBLESHOOTING.md#file-parsing-errors)
- [AI Timeout/Rate Limits](./TROUBLESHOOTING.md#ai-timeout-and-rate-limits)
- [Output Validation Errors](./TROUBLESHOOTING.md#output-validation-errors)
- [Common Questions](./TROUBLESHOOTING.md#common-questions)

## Contributing

We welcome contributions! This tool is part of the [Handoff](https://github.com/Convertiv/handoff) project.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Convertiv/handoff.git
cd handoff/packages/token-extractor

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Running Locally

```bash
# Build and link globally
npm run build
npm link

# Use the CLI
token-extractor extract
```

### Testing Changes

```bash
# Run test suite
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/commands/extract.test.ts
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Commit your changes: `git commit -m "Add my feature"`
7. Push to your fork: `git push origin feature/my-feature`
8. Open a Pull Request

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Related Projects

- [Handoff](https://github.com/Convertiv/handoff) - Design-to-code handoff automation
- [Figma Tokens Plugin](https://www.figma.com/community/plugin/843461159747178978/Figma-Tokens) - Manage design tokens in Figma
- [Style Dictionary](https://amzn.github.io/style-dictionary/) - Transform tokens to multiple platforms

## Support

- **Issues**: [GitHub Issues](https://github.com/Convertiv/handoff/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Convertiv/handoff/discussions)
- **Documentation**: [Handoff Docs](https://www.handoff.com/docs)

---

Made with ❤️ by [Convertiv](https://convertiv.com)
