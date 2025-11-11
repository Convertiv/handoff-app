# Token Extractor CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone CLI tool that analyzes any codebase using AI to extract design tokens and outputs Figma Tokens plugin JSON.

**Architecture:** Three-mode adaptive system (Quick/Balanced/Thorough) with discovery pass, AI-powered extraction, interactive refinement, and design system health auditing. Uses Commander.js for CLI, Anthropic/OpenAI SDKs for AI, PostCSS/Babel for parsing.

**Tech Stack:** TypeScript, Commander.js, Inquirer.js, Anthropic SDK, OpenAI SDK, PostCSS, Babel, fast-glob, chalk, ora

---

## Task 1: Project Structure & Package Setup

**Files:**
- Create: `packages/token-extractor/package.json`
- Create: `packages/token-extractor/tsconfig.json`
- Create: `packages/token-extractor/src/index.ts`
- Create: `packages/token-extractor/.gitignore`

**Step 1: Create package directory structure**

```bash
mkdir -p packages/token-extractor/src
cd packages/token-extractor
```

**Step 2: Initialize package.json**

Create `packages/token-extractor/package.json`:
```json
{
  "name": "@handoff/token-extractor",
  "version": "0.1.0",
  "description": "Extract design tokens from code and generate Figma Tokens JSON",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "token-extractor": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "keywords": ["design-tokens", "figma", "code-to-design", "handoff"],
  "author": "Convertiv",
  "license": "MIT",
  "dependencies": {
    "commander": "^11.1.0",
    "inquirer": "^9.2.12",
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.28.0",
    "fast-glob": "^3.3.2",
    "postcss": "^8.4.35",
    "postcss-scss": "^4.0.9",
    "@babel/parser": "^7.23.9",
    "chalk": "^5.3.0",
    "ora": "^7.0.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.16",
    "@types/inquirer": "^9.0.7",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.2",
    "eslint": "^8.57.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0"
  }
}
```

**Step 3: Create TypeScript config**

Create `packages/token-extractor/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 4: Create .gitignore**

Create `packages/token-extractor/.gitignore`:
```
node_modules/
dist/
*.tsbuildinfo
.env
.env.local
coverage/
.DS_Store
```

**Step 5: Create placeholder index**

Create `packages/token-extractor/src/index.ts`:
```typescript
export { TokenExtractor } from './extractor';
```

**Step 6: Install dependencies**

Run: `cd packages/token-extractor && npm install`
Expected: Dependencies installed successfully

**Step 7: Verify TypeScript compiles**

Run: `npm run build`
Expected: Build completes (may have errors about missing files, that's OK)

**Step 8: Commit**

```bash
git add packages/token-extractor/
git commit -m "feat: initialize token-extractor package structure

- Add package.json with dependencies
- Configure TypeScript
- Set up basic project structure

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `packages/token-extractor/src/types/tokens.ts`
- Create: `packages/token-extractor/src/types/figma-tokens.ts`
- Create: `packages/token-extractor/src/types/config.ts`

**Step 1: Write token type tests**

Create `packages/token-extractor/src/types/tokens.test.ts`:
```typescript
import { TokenValue, TokenType, TokenSet } from './tokens';

describe('Token Types', () => {
  test('TokenValue should accept valid color hex', () => {
    const value: TokenValue = '#FF5733';
    expect(typeof value).toBe('string');
  });

  test('TokenType should include all design token categories', () => {
    const types: TokenType[] = ['color', 'spacing', 'typography', 'effect', 'sizing', 'borderRadius'];
    expect(types.length).toBeGreaterThan(0);
  });

  test('TokenSet should have metadata', () => {
    const tokenSet: TokenSet = {
      tokens: [],
      metadata: {
        extractedAt: new Date().toISOString(),
        framework: 'react',
        fileCount: 10
      }
    };
    expect(tokenSet.metadata).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - "Cannot find module './tokens'"

**Step 3: Implement token types**

Create `packages/token-extractor/src/types/tokens.ts`:
```typescript
export type TokenType =
  | 'color'
  | 'spacing'
  | 'sizing'
  | 'borderRadius'
  | 'typography'
  | 'fontFamily'
  | 'fontSize'
  | 'lineHeight'
  | 'fontWeight'
  | 'letterSpacing'
  | 'effect'
  | 'boxShadow'
  | 'opacity'
  | 'breakpoint'
  | 'zIndex';

export type TokenValue = string | number;

export interface ExtractedToken {
  name: string;
  value: TokenValue;
  type: TokenType;
  file: string;
  line?: number;
  context?: string;
}

export interface TokenSet {
  tokens: ExtractedToken[];
  metadata: {
    extractedAt: string;
    framework?: string;
    fileCount: number;
    lineCount?: number;
    mode?: 'quick' | 'balanced' | 'thorough';
  };
}

export interface TokenGroup {
  category: string;
  tokens: ExtractedToken[];
}
```

**Step 4: Write Figma Tokens schema tests**

Create `packages/token-extractor/src/types/figma-tokens.test.ts`:
```typescript
import { FigmaToken, FigmaTokensJSON, validateFigmaTokensJSON } from './figma-tokens';

describe('Figma Tokens Types', () => {
  test('FigmaToken should have value and type', () => {
    const token: FigmaToken = {
      value: '#FF5733',
      type: 'color'
    };
    expect(token.value).toBeDefined();
    expect(token.type).toBeDefined();
  });

  test('validateFigmaTokensJSON should accept valid structure', () => {
    const json: FigmaTokensJSON = {
      colors: {
        primary: {
          value: '#0ea5e9',
          type: 'color'
        }
      }
    };
    expect(() => validateFigmaTokensJSON(json)).not.toThrow();
  });
});
```

**Step 5: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - "Cannot find module './figma-tokens'"

**Step 6: Implement Figma Tokens types**

Create `packages/token-extractor/src/types/figma-tokens.ts`:
```typescript
import { z } from 'zod';

// Figma Tokens Plugin JSON v2 format
export interface FigmaToken {
  value: string | number | Record<string, any>;
  type: string;
  description?: string;
}

export type FigmaTokenCategory = Record<string, FigmaToken | Record<string, FigmaToken>>;

export interface FigmaTokensJSON {
  $themes?: Array<{
    id: string;
    name: string;
    selectedTokenSets: Record<string, string>;
  }>;
  $metadata?: {
    tokenSetOrder?: string[];
  };
  [category: string]: FigmaTokenCategory | any;
}

// Zod schema for validation
const FigmaTokenSchema = z.object({
  value: z.union([z.string(), z.number(), z.record(z.any())]),
  type: z.string(),
  description: z.string().optional()
});

const FigmaTokensJSONSchema = z.record(
  z.union([
    FigmaTokenSchema,
    z.record(FigmaTokenSchema),
    z.any()
  ])
);

export function validateFigmaTokensJSON(json: unknown): FigmaTokensJSON {
  return FigmaTokensJSONSchema.parse(json) as FigmaTokensJSON;
}
```

**Step 7: Write config types test**

Create `packages/token-extractor/src/types/config.test.ts`:
```typescript
import { ExtractorConfig, AnalysisMode } from './config';

describe('Config Types', () => {
  test('AnalysisMode should have three options', () => {
    const modes: AnalysisMode[] = ['quick', 'balanced', 'thorough'];
    expect(modes.length).toBe(3);
  });

  test('ExtractorConfig should have apiKey', () => {
    const config: Partial<ExtractorConfig> = {
      apiKey: 'test-key',
      provider: 'anthropic'
    };
    expect(config.apiKey).toBeDefined();
  });
});
```

**Step 8: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - "Cannot find module './config'"

**Step 9: Implement config types**

Create `packages/token-extractor/src/types/config.ts`:
```typescript
export type AnalysisMode = 'quick' | 'balanced' | 'thorough';
export type AIProvider = 'anthropic' | 'openai';

export interface ExtractorConfig {
  // AI Configuration
  apiKey?: string;
  provider: AIProvider;
  model?: string;

  // Analysis Configuration
  mode?: AnalysisMode;
  interactive?: boolean;

  // File Configuration
  include?: string[];
  exclude?: string[];

  // Output Configuration
  outputPath?: string;
  generateReport?: boolean;
  generateAudit?: boolean;
}

export interface DiscoveryResult {
  fileCount: number;
  lineCount: number;
  frameworks: string[];
  hasExistingTokens: boolean;
  directories: {
    styles: string[];
    components: string[];
  };
}

export interface ModeRecommendation {
  mode: AnalysisMode;
  reasoning: string;
  estimatedCost: number;
  estimatedTime: number;
  expectedAccuracy: number;
}
```

**Step 10: Run all tests to verify they pass**

Run: `npm test`
Expected: All tests PASS

**Step 11: Build to verify compilation**

Run: `npm run build`
Expected: Build succeeds, dist/ contains compiled JS

**Step 12: Commit**

```bash
git add packages/token-extractor/src/types/
git commit -m "feat: add type definitions for tokens and config

- Define ExtractedToken and TokenSet types
- Add Figma Tokens JSON v2 schema with validation
- Create config types for modes and AI providers
- Include comprehensive tests for all types

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: CLI Entry Point & Command Structure

**Files:**
- Create: `packages/token-extractor/src/cli.ts`
- Create: `packages/token-extractor/src/commands/extract.ts`
- Test: `packages/token-extractor/src/cli.test.ts`

**Step 1: Write CLI entry point test**

Create `packages/token-extractor/src/cli.test.ts`:
```typescript
import { Command } from 'commander';
import { createCLI } from './cli';

describe('CLI', () => {
  test('should create CLI program with correct name', () => {
    const program = createCLI();
    expect(program.name()).toBe('token-extractor');
  });

  test('should have extract command', () => {
    const program = createCLI();
    const commands = program.commands.map(cmd => cmd.name());
    expect(commands).toContain('extract');
  });

  test('should have version option', () => {
    const program = createCLI();
    expect(program.version()).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- cli.test.ts`
Expected: FAIL - "Cannot find module './cli'"

**Step 3: Implement CLI entry point**

Create `packages/token-extractor/src/cli.ts`:
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { extractCommand } from './commands/extract';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('token-extractor')
    .description('Extract design tokens from code and generate Figma Tokens JSON')
    .version('0.1.0');

  program
    .command('extract')
    .description('Extract tokens from current directory')
    .option('-m, --mode <mode>', 'Analysis mode: quick, balanced, or thorough')
    .option('--no-interactive', 'Skip interactive questions')
    .option('-o, --output <path>', 'Output file path', './figma-tokens.json')
    .option('--no-report', 'Skip generating report')
    .option('--no-audit', 'Skip generating audit/cleanup tasks')
    .action(extractCommand);

  return program;
}

// Run CLI if executed directly
if (require.main === module) {
  createCLI().parse(process.argv);
}
```

**Step 4: Write extract command test**

Create `packages/token-extractor/src/commands/extract.test.ts`:
```typescript
import { extractCommand } from './extract';

describe('Extract Command', () => {
  test('should accept valid options', async () => {
    const options = {
      mode: 'balanced' as const,
      interactive: true,
      output: './test-tokens.json',
      report: true,
      audit: true
    };

    // Should not throw
    expect(typeof extractCommand).toBe('function');
  });
});
```

**Step 5: Run test to verify it fails**

Run: `npm test -- extract.test.ts`
Expected: FAIL - "Cannot find module './commands/extract'"

**Step 6: Implement extract command stub**

Create `packages/token-extractor/src/commands/extract.ts`:
```typescript
import chalk from 'chalk';
import ora from 'ora';
import type { ExtractorConfig } from '../types/config';

interface ExtractOptions {
  mode?: 'quick' | 'balanced' | 'thorough';
  interactive?: boolean;
  output?: string;
  report?: boolean;
  audit?: boolean;
}

export async function extractCommand(options: ExtractOptions): Promise<void> {
  const spinner = ora('Starting token extraction').start();

  try {
    spinner.text = 'Analyzing repository structure...';

    // Placeholder - will implement in later tasks
    spinner.succeed(chalk.green('Token extraction complete!'));

    console.log(chalk.cyan('\n📄 Files written:'));
    console.log(chalk.gray(`   • ${options.output || './figma-tokens.json'}`));

  } catch (error) {
    spinner.fail(chalk.red('Token extraction failed'));
    throw error;
  }
}
```

**Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: All tests PASS

**Step 8: Test CLI manually**

Run: `npm run build && node dist/cli.js extract --help`
Expected: Shows help text for extract command

**Step 9: Commit**

```bash
git add packages/token-extractor/src/cli.ts packages/token-extractor/src/commands/
git commit -m "feat: add CLI entry point and extract command

- Create Commander.js CLI structure
- Add extract command with options
- Include spinner and colored output
- Add comprehensive tests

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: API Key Configuration System

**Files:**
- Create: `packages/token-extractor/src/config/api-keys.ts`
- Test: `packages/token-extractor/src/config/api-keys.test.ts`

**Step 1: Write API key manager test**

Create `packages/token-extractor/src/config/api-keys.test.ts`:
```typescript
import { APIKeyManager } from './api-keys';
import * as fs from 'fs';

describe('APIKeyManager', () => {
  beforeEach(() => {
    // Clear environment
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  test('should detect API key from environment', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-123';
    const manager = new APIKeyManager();
    const key = manager.getKey('anthropic');
    expect(key).toBe('test-key-123');
  });

  test('should return null if no key found', () => {
    const manager = new APIKeyManager();
    const key = manager.getKey('anthropic');
    expect(key).toBeNull();
  });

  test('should detect provider from available keys', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const manager = new APIKeyManager();
    const provider = manager.detectProvider();
    expect(provider).toBe('anthropic');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- api-keys.test.ts`
Expected: FAIL - "Cannot find module './api-keys'"

**Step 3: Implement API key manager**

Create `packages/token-extractor/src/config/api-keys.ts`:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { AIProvider } from '../types/config';

export class APIKeyManager {
  private configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), '.token-extractor.config.json');
  }

  /**
   * Get API key for provider from environment or config file
   */
  public getKey(provider: AIProvider): string | null {
    // 1. Check environment variables
    const envKey = this.getKeyFromEnv(provider);
    if (envKey) return envKey;

    // 2. Check config file
    const configKey = this.getKeyFromConfig(provider);
    if (configKey) return configKey;

    return null;
  }

  /**
   * Detect which provider has an available API key
   */
  public detectProvider(): AIProvider | null {
    if (this.getKey('anthropic')) return 'anthropic';
    if (this.getKey('openai')) return 'openai';
    return null;
  }

  /**
   * Save API key to config file (gitignored)
   */
  public saveKey(provider: AIProvider, apiKey: string): void {
    let config: Record<string, any> = {};

    if (fs.existsSync(this.configPath)) {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      config = JSON.parse(content);
    }

    config[`${provider}ApiKey`] = apiKey;

    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    fs.chmodSync(this.configPath, 0o600); // Readable only by owner
  }

  private getKeyFromEnv(provider: AIProvider): string | null {
    const envVar = provider === 'anthropic'
      ? 'ANTHROPIC_API_KEY'
      : 'OPENAI_API_KEY';

    return process.env[envVar] || null;
  }

  private getKeyFromConfig(provider: AIProvider): string | null {
    if (!fs.existsSync(this.configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      return config[`${provider}ApiKey`] || null;
    } catch {
      return null;
    }
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- api-keys.test.ts`
Expected: All tests PASS

**Step 5: Write interactive prompt test**

Create `packages/token-extractor/src/config/prompt-api-key.test.ts`:
```typescript
import { promptForAPIKey } from './prompt-api-key';

describe('promptForAPIKey', () => {
  test('should be a function', () => {
    expect(typeof promptForAPIKey).toBe('function');
  });
});
```

**Step 6: Run test to verify it fails**

Run: `npm test -- prompt-api-key.test.ts`
Expected: FAIL - "Cannot find module './prompt-api-key'"

**Step 7: Implement interactive API key prompt**

Create `packages/token-extractor/src/config/prompt-api-key.ts`:
```typescript
import inquirer from 'inquirer';
import chalk from 'chalk';
import type { AIProvider } from '../types/config';
import { APIKeyManager } from './api-keys';

export async function promptForAPIKey(): Promise<{ provider: AIProvider; apiKey: string }> {
  console.log(chalk.yellow('\n⚠️  No API key found'));
  console.log(chalk.gray('You need an API key from Anthropic or OpenAI to use this tool.\n'));

  const { provider } = await inquirer.prompt<{ provider: AIProvider }>([
    {
      type: 'list',
      name: 'provider',
      message: 'Which AI provider would you like to use?',
      choices: [
        { name: 'Anthropic (Claude) - Recommended for code analysis', value: 'anthropic' },
        { name: 'OpenAI (GPT-4)', value: 'openai' }
      ]
    }
  ]);

  const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key:`,
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'API key cannot be empty';
        }
        return true;
      }
    }
  ]);

  const { save } = await inquirer.prompt<{ save: boolean }>([
    {
      type: 'confirm',
      name: 'save',
      message: 'Save this API key to ~/.token-extractor.config.json?',
      default: true
    }
  ]);

  if (save) {
    const manager = new APIKeyManager();
    manager.saveKey(provider, apiKey);
    console.log(chalk.green('✓ API key saved\n'));
  }

  return { provider, apiKey };
}
```

**Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: All tests PASS

**Step 9: Build to verify compilation**

Run: `npm run build`
Expected: Build succeeds

**Step 10: Commit**

```bash
git add packages/token-extractor/src/config/
git commit -m "feat: add API key configuration system

- Implement APIKeyManager for reading keys from env/config
- Add interactive prompt for missing API keys
- Support both Anthropic and OpenAI providers
- Secure config file with 0o600 permissions
- Add comprehensive tests

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Discovery Engine - File Scanner

**Files:**
- Create: `packages/token-extractor/src/discovery/scanner.ts`
- Test: `packages/token-extractor/src/discovery/scanner.test.ts`

**Step 1: Write file scanner test**

Create `packages/token-extractor/src/discovery/scanner.test.ts`:
```typescript
import { FileScanner } from './scanner';
import * as fs from 'fs';
import * as path from 'path';

describe('FileScanner', () => {
  const testDir = path.join(__dirname, '../../test-fixtures/sample-repo');

  beforeAll(() => {
    // Create test fixtures
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src/styles'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src/styles/colors.scss'), '$primary: #0ea5e9;');
    fs.writeFileSync(path.join(testDir, 'src/Button.tsx'), 'const Button = () => <button />;');
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should scan directory and find style files', async () => {
    const scanner = new FileScanner(testDir);
    const files = await scanner.findStyleFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.endsWith('.scss'))).toBe(true);
  });

  test('should count total lines', async () => {
    const scanner = new FileScanner(testDir);
    const lineCount = await scanner.countLines();
    expect(lineCount).toBeGreaterThan(0);
  });

  test('should respect exclude patterns', async () => {
    const scanner = new FileScanner(testDir, {
      exclude: ['**/*.tsx']
    });
    const files = await scanner.findStyleFiles();
    expect(files.every(f => !f.endsWith('.tsx'))).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- scanner.test.ts`
Expected: FAIL - "Cannot find module './scanner'"

**Step 3: Implement file scanner**

Create `packages/token-extractor/src/discovery/scanner.ts`:
```typescript
import glob from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';

export interface ScanOptions {
  include?: string[];
  exclude?: string[];
}

export class FileScanner {
  private rootDir: string;
  private options: ScanOptions;

  constructor(rootDir: string = process.cwd(), options: ScanOptions = {}) {
    this.rootDir = rootDir;
    this.options = {
      include: options.include || [
        '**/*.css',
        '**/*.scss',
        '**/*.less',
        '**/*.sass',
        '**/*.js',
        '**/*.jsx',
        '**/*.ts',
        '**/*.tsx',
        '**/*.vue'
      ],
      exclude: options.exclude || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**'
      ]
    };
  }

  /**
   * Find all style-related files
   */
  async findStyleFiles(): Promise<string[]> {
    const files = await glob(this.options.include!, {
      cwd: this.rootDir,
      ignore: this.options.exclude,
      absolute: true
    });

    return files;
  }

  /**
   * Count total lines across all files
   */
  async countLines(): Promise<number> {
    const files = await this.findStyleFiles();
    let totalLines = 0;

    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');
      totalLines += content.split('\n').length;
    }

    return totalLines;
  }

  /**
   * Get file count by type
   */
  async getFileStats(): Promise<Record<string, number>> {
    const files = await this.findStyleFiles();
    const stats: Record<string, number> = {};

    for (const file of files) {
      const ext = path.extname(file);
      stats[ext] = (stats[ext] || 0) + 1;
    }

    return stats;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- scanner.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/token-extractor/src/discovery/scanner.ts
git add packages/token-extractor/test-fixtures/
git commit -m "feat: add file scanner for discovery pass

- Implement FileScanner with glob-based file discovery
- Support include/exclude patterns
- Count lines and file statistics
- Add test fixtures for validation

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Discovery Engine - Framework Detector

**Files:**
- Create: `packages/token-extractor/src/discovery/framework-detector.ts`
- Test: `packages/token-extractor/src/discovery/framework-detector.test.ts`

**Step 1: Write framework detector test**

Create `packages/token-extractor/src/discovery/framework-detector.test.ts`:
```typescript
import { FrameworkDetector } from './framework-detector';
import * as fs from 'fs';
import * as path from 'path';

describe('FrameworkDetector', () => {
  const testDir = path.join(__dirname, '../../test-fixtures/framework-detection');

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should detect Tailwind from config', async () => {
    fs.writeFileSync(
      path.join(testDir, 'tailwind.config.js'),
      'module.exports = { content: ["./src/**/*.{js,jsx}"] }'
    );

    const detector = new FrameworkDetector(testDir);
    const frameworks = await detector.detect();

    expect(frameworks).toContain('tailwind');

    fs.unlinkSync(path.join(testDir, 'tailwind.config.js'));
  });

  test('should detect styled-components from package.json', async () => {
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({ dependencies: { 'styled-components': '^6.0.0' } })
    );

    const detector = new FrameworkDetector(testDir);
    const frameworks = await detector.detect();

    expect(frameworks).toContain('styled-components');

    fs.unlinkSync(path.join(testDir, 'package.json'));
  });

  test('should detect SCSS from file extensions', async () => {
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src/styles.scss'), '$color: red;');

    const detector = new FrameworkDetector(testDir);
    const frameworks = await detector.detect();

    expect(frameworks).toContain('scss');

    fs.rmSync(path.join(testDir, 'src'), { recursive: true, force: true });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- framework-detector.test.ts`
Expected: FAIL - "Cannot find module './framework-detector'"

**Step 3: Implement framework detector**

Create `packages/token-extractor/src/discovery/framework-detector.ts`:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import glob from 'fast-glob';

export type Framework =
  | 'tailwind'
  | 'styled-components'
  | 'emotion'
  | 'scss'
  | 'less'
  | 'css-modules'
  | 'chakra'
  | 'material-ui'
  | 'ant-design'
  | 'react'
  | 'vue'
  | 'angular';

export class FrameworkDetector {
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Detect all frameworks/libraries used in the project
   */
  async detect(): Promise<Framework[]> {
    const frameworks: Set<Framework> = new Set();

    // Check package.json dependencies
    const packageFrameworks = await this.detectFromPackageJson();
    packageFrameworks.forEach(f => frameworks.add(f));

    // Check config files
    const configFrameworks = await this.detectFromConfigFiles();
    configFrameworks.forEach(f => frameworks.add(f));

    // Check file extensions
    const fileFrameworks = await this.detectFromFiles();
    fileFrameworks.forEach(f => frameworks.add(f));

    return Array.from(frameworks);
  }

  private async detectFromPackageJson(): Promise<Framework[]> {
    const frameworks: Framework[] = [];
    const packageJsonPath = path.join(this.rootDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return frameworks;
    }

    try {
      const content = await fs.promises.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };

      if (allDeps['styled-components']) frameworks.push('styled-components');
      if (allDeps['@emotion/react'] || allDeps['@emotion/styled']) frameworks.push('emotion');
      if (allDeps['@chakra-ui/react']) frameworks.push('chakra');
      if (allDeps['@mui/material']) frameworks.push('material-ui');
      if (allDeps['antd']) frameworks.push('ant-design');
      if (allDeps['react']) frameworks.push('react');
      if (allDeps['vue']) frameworks.push('vue');
      if (allDeps['@angular/core']) frameworks.push('angular');
      if (allDeps['tailwindcss']) frameworks.push('tailwind');
    } catch (error) {
      // Invalid package.json
    }

    return frameworks;
  }

  private async detectFromConfigFiles(): Promise<Framework[]> {
    const frameworks: Framework[] = [];

    // Tailwind
    const tailwindConfigs = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs'];
    if (tailwindConfigs.some(f => fs.existsSync(path.join(this.rootDir, f)))) {
      frameworks.push('tailwind');
    }

    return frameworks;
  }

  private async detectFromFiles(): Promise<Framework[]> {
    const frameworks: Framework[] = [];

    const files = await glob(['**/*.{scss,sass,less,css}'], {
      cwd: this.rootDir,
      ignore: ['**/node_modules/**', '**/dist/**'],
      absolute: false
    });

    if (files.some(f => f.endsWith('.scss') || f.endsWith('.sass'))) {
      frameworks.push('scss');
    }

    if (files.some(f => f.endsWith('.less'))) {
      frameworks.push('less');
    }

    // Check for CSS Modules
    if (files.some(f => f.includes('.module.css'))) {
      frameworks.push('css-modules');
    }

    return frameworks;
  }

  /**
   * Check if project has existing token infrastructure
   */
  async hasExistingTokens(): Promise<boolean> {
    const tokenFiles = await glob(
      ['**/tokens.json', '**/design-tokens.json', '**/*tokens*.{js,ts}'],
      {
        cwd: this.rootDir,
        ignore: ['**/node_modules/**'],
        absolute: false
      }
    );

    if (tokenFiles.length > 0) return true;

    // Check for CSS custom properties
    const cssFiles = await glob(['**/*.css', '**/*.scss'], {
      cwd: this.rootDir,
      ignore: ['**/node_modules/**'],
      absolute: true
    });

    for (const file of cssFiles.slice(0, 10)) { // Sample first 10 files
      const content = await fs.promises.readFile(file, 'utf-8');
      if (content.includes('--') || content.includes('$')) {
        return true;
      }
    }

    return false;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- framework-detector.test.ts`
Expected: All tests PASS

**Step 5: Build to verify compilation**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add packages/token-extractor/src/discovery/framework-detector.ts
git commit -m "feat: add framework detection for discovery pass

- Detect frameworks from package.json dependencies
- Identify Tailwind, styled-components, Emotion, etc.
- Check for SCSS, LESS, CSS Modules from files
- Detect existing token infrastructure
- Add comprehensive tests

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Discovery Orchestrator & Mode Recommendation

**Files:**
- Create: `packages/token-extractor/src/discovery/index.ts`
- Test: `packages/token-extractor/src/discovery/index.test.ts`

**Step 1: Write discovery orchestrator test**

Create `packages/token-extractor/src/discovery/index.test.ts`:
```typescript
import { runDiscovery, recommendMode } from './index';
import type { DiscoveryResult } from '../types/config';

describe('Discovery Orchestrator', () => {
  test('runDiscovery should return complete results', async () => {
    const result = await runDiscovery(process.cwd());

    expect(result.fileCount).toBeGreaterThanOrEqual(0);
    expect(result.lineCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.frameworks)).toBe(true);
    expect(typeof result.hasExistingTokens).toBe('boolean');
  });

  test('recommendMode should suggest quick for standard CSS with tokens', () => {
    const discovery: DiscoveryResult = {
      fileCount: 20,
      lineCount: 1000,
      frameworks: ['scss'],
      hasExistingTokens: true,
      directories: { styles: ['src/styles'], components: [] }
    };

    const recommendation = recommendMode(discovery);
    expect(recommendation.mode).toBe('quick');
  });

  test('recommendMode should suggest balanced for medium repos', () => {
    const discovery: DiscoveryResult = {
      fileCount: 50,
      lineCount: 5000,
      frameworks: ['react', 'styled-components'],
      hasExistingTokens: false,
      directories: { styles: [], components: ['src/components'] }
    };

    const recommendation = recommendMode(discovery);
    expect(recommendation.mode).toBe('balanced');
  });

  test('recommendMode should suggest thorough for large repos', () => {
    const discovery: DiscoveryResult = {
      fileCount: 200,
      lineCount: 20000,
      frameworks: ['react', 'scss', 'css-modules'],
      hasExistingTokens: false,
      directories: { styles: ['src/styles'], components: ['src/components'] }
    };

    const recommendation = recommendMode(discovery);
    expect(recommendation.mode).toBe('thorough');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- discovery/index.test.ts`
Expected: FAIL - "Cannot find module './index'"

**Step 3: Implement discovery orchestrator**

Create `packages/token-extractor/src/discovery/index.ts`:
```typescript
import chalk from 'chalk';
import ora from 'ora';
import { FileScanner } from './scanner';
import { FrameworkDetector } from './framework-detector';
import type { DiscoveryResult, ModeRecommendation, AnalysisMode } from '../types/config';

/**
 * Run complete discovery pass on repository
 */
export async function runDiscovery(rootDir: string = process.cwd()): Promise<DiscoveryResult> {
  const spinner = ora('Analyzing repository structure...').start();

  try {
    const scanner = new FileScanner(rootDir);
    const detector = new FrameworkDetector(rootDir);

    spinner.text = 'Scanning files...';
    const files = await scanner.findStyleFiles();
    const fileCount = files.length;

    spinner.text = 'Counting lines...';
    const lineCount = await scanner.countLines();

    spinner.text = 'Detecting frameworks...';
    const frameworks = await detector.detect();

    spinner.text = 'Checking for existing tokens...';
    const hasExistingTokens = await detector.hasExistingTokens();

    // Categorize directories
    const stylesDirs = files
      .filter(f => /\.(css|scss|less|sass)$/.test(f))
      .map(f => f.substring(0, f.lastIndexOf('/')))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    const componentDirs = files
      .filter(f => /\.(jsx?|tsx?|vue)$/.test(f))
      .map(f => f.substring(0, f.lastIndexOf('/')))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    spinner.succeed('Discovery complete');

    return {
      fileCount,
      lineCount,
      frameworks,
      hasExistingTokens,
      directories: {
        styles: stylesDirs,
        components: componentDirs
      }
    };
  } catch (error) {
    spinner.fail('Discovery failed');
    throw error;
  }
}

/**
 * Recommend analysis mode based on discovery results
 */
export function recommendMode(discovery: DiscoveryResult): ModeRecommendation {
  const { fileCount, lineCount, hasExistingTokens, frameworks } = discovery;

  // Quick mode: Good existing structure
  if (hasExistingTokens && frameworks.some(f => ['scss', 'less', 'css'].includes(f))) {
    return {
      mode: 'quick',
      reasoning: 'Repository has existing tokens and standard CSS structure. AST parsing will be fast and accurate.',
      estimatedCost: Math.max(0.10, fileCount * 0.005),
      estimatedTime: 60,
      expectedAccuracy: 75
    };
  }

  // Thorough mode: Large/complex repos
  if (fileCount > 100 || lineCount > 15000) {
    return {
      mode: 'thorough',
      reasoning: 'Large codebase with complex patterns. Multi-pass analysis will ensure comprehensive extraction.',
      estimatedCost: Math.max(1.0, fileCount * 0.02),
      estimatedTime: Math.min(300, 120 + fileCount * 0.5),
      expectedAccuracy: 95
    };
  }

  // Balanced mode: Default for modern frameworks
  const modernFrameworks = ['react', 'vue', 'styled-components', 'emotion', 'tailwind'];
  const hasModern = frameworks.some(f => modernFrameworks.includes(f));

  const baseCost = lineCount / 1000 * 0.50;

  return {
    mode: 'balanced',
    reasoning: hasModern
      ? 'Modern framework detected. Single-pass AI analysis handles diverse patterns well.'
      : 'Medium-sized repository. Balanced approach offers good accuracy/cost ratio.',
    estimatedCost: Math.max(0.50, Math.min(baseCost, 1.50)),
    estimatedTime: Math.min(90, 30 + fileCount),
    expectedAccuracy: 85
  };
}

/**
 * Display discovery results to user
 */
export function displayDiscoveryResults(discovery: DiscoveryResult, recommendation: ModeRecommendation): void {
  console.log(chalk.cyan('\n📊 Discovery Results:'));
  console.log(chalk.gray(`   • ${discovery.fileCount} style files (${discovery.lineCount.toLocaleString()} lines)`));
  console.log(chalk.gray(`   • Frameworks: ${discovery.frameworks.join(', ') || 'none detected'}`));
  console.log(chalk.gray(`   • Existing tokens: ${discovery.hasExistingTokens ? 'Yes' : 'No'}`));

  console.log(chalk.cyan('\n💡 Recommended: ') + chalk.bold(recommendation.mode.toUpperCase()) + chalk.cyan(' Mode'));
  console.log(chalk.gray(`   ${recommendation.reasoning}`));
  console.log(chalk.gray(`   • Estimated cost: $${recommendation.estimatedCost.toFixed(2)}`));
  console.log(chalk.gray(`   • Estimated time: ~${recommendation.estimatedTime}s`));
  console.log(chalk.gray(`   • Expected accuracy: ${recommendation.expectedAccuracy}%`));
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- discovery/index.test.ts`
Expected: All tests PASS

**Step 5: Integrate discovery into extract command**

Modify `packages/token-extractor/src/commands/extract.ts`:
```typescript
import chalk from 'chalk';
import ora from 'ora';
import { runDiscovery, recommendMode, displayDiscoveryResults } from '../discovery';
import type { ExtractorConfig } from '../types/config';

interface ExtractOptions {
  mode?: 'quick' | 'balanced' | 'thorough';
  interactive?: boolean;
  output?: string;
  report?: boolean;
  audit?: boolean;
}

export async function extractCommand(options: ExtractOptions): Promise<void> {
  try {
    // Run discovery pass
    const discovery = await runDiscovery();
    const recommendation = recommendMode(discovery);

    displayDiscoveryResults(discovery, recommendation);

    // Placeholder - will implement mode selection in next task
    console.log(chalk.cyan('\n📄 Files written:'));
    console.log(chalk.gray(`   • ${options.output || './figma-tokens.json'}`));

  } catch (error) {
    console.error(chalk.red('Token extraction failed:'), error);
    throw error;
  }
}
```

**Step 6: Test manually**

Run: `npm run build && node dist/cli.js extract`
Expected: Shows discovery results and recommendation

**Step 7: Commit**

```bash
git add packages/token-extractor/src/discovery/index.ts
git add packages/token-extractor/src/commands/extract.ts
git commit -m "feat: add discovery orchestrator and mode recommendation

- Implement runDiscovery to analyze repository
- Create recommendMode algorithm based on discovery results
- Display formatted discovery results to user
- Integrate discovery into extract command
- Add comprehensive tests

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Remaining Tasks Overview

Due to space constraints, here's the outline for remaining tasks:

### Task 8: Mode Selection Interactive Prompt
- Create Inquirer prompts to present 3 modes to user
- Allow user to override recommendation
- Confirm cost estimate before proceeding
- Update extract command to capture selection

### Task 9: AI Client Abstraction Layer
- Create AIProvider interface
- Implement AnthropicProvider (Claude SDK)
- Implement OpenAIProvider (GPT-4 SDK)
- Add retry logic and error handling
- Test both providers

### Task 10: Quick Mode - AST Parser (PostCSS)
- Implement PostCSS parser for CSS/SCSS
- Extract CSS custom properties and SCSS variables
- Extract color hex codes, spacing values
- Create token objects with file/line metadata

### Task 11: Quick Mode - AST Parser (Babel)
- Implement Babel parser for JS/TS theme objects
- Extract styled-components theme definitions
- Handle various object patterns
- Merge with PostCSS results

### Task 12: Quick Mode - AI Refinement
- Send raw tokens to AI for grouping
- Generate semantic names following Figma Tokens conventions
- Identify duplicates
- Return structured token set

### Task 13: Balanced Mode - Single-Pass AI
- Implement file batching strategy
- Create comprehensive extraction prompt
- Process batch through AI in one conversation
- Parse AI response into TokenSet

### Task 14: Thorough Mode - Multi-Pass Pipeline (Pass 1)
- Implement per-file extraction
- Process each file individually with AI
- Store intermediate results

### Task 15: Thorough Mode - Passes 2-4
- Pass 2: Pattern detection across files
- Pass 3: Semantic grouping and hierarchy
- Pass 4: Alias detection and creation
- Combine all passes into final TokenSet

### Task 16: Interactive Question System
- Detect ambiguities in token extraction
- Generate clarifying questions with options
- Present using Inquirer
- Apply user answers to refine tokens

### Task 17: Figma Tokens JSON Generator
- Transform TokenSet to Figma Tokens JSON v2
- Organize into proper hierarchy (colors.primary.500)
- Create aliases/references
- Validate against schema

### Task 18: Report Generator
- Create markdown extraction report
- Show token breakdown by category
- List recommendations and warnings
- Include next steps

### Task 19: Audit System - Design System Health
- Detect inconsistencies (naming, scales, palettes)
- Find duplicate/near-duplicate values (color similarity)
- Identify hard-coded values needing tokens
- Flag missing token categories
- Check accessibility (contrast ratios)

### Task 20: Audit System - Cleanup Task Generator
- Prioritize issues (critical/inconsistencies/enhancements)
- Generate markdown checklist
- Include file references and suggested fixes

### Task 21: Integration Tests
- Test complete flow end-to-end
- Test against real repositories (React, Vue, vanilla CSS)
- Verify output validity
- Measure accuracy against known token sets

### Task 22: Documentation & Polish
- Write comprehensive README
- Add usage examples
- Create troubleshooting guide
- Improve error messages and user feedback

---

## Testing Strategy

### Unit Tests (Throughout)
- Test each module in isolation
- Mock external dependencies
- Verify edge cases

### Integration Tests (Task 21)
- Test complete extraction pipeline
- Use real sample repositories
- Validate Figma Tokens JSON output

### Manual Testing (Throughout)
- Run CLI commands manually after each task
- Verify user experience
- Test error scenarios

---

## Success Criteria

- ✅ CLI runs without errors
- ✅ Discovery accurately detects frameworks
- ✅ All three modes produce valid output
- ✅ Figma Tokens JSON passes schema validation
- ✅ Audit generates actionable cleanup tasks
- ✅ Cost estimates within 20% of actual
- ✅ 80%+ token extraction accuracy on test repos
- ✅ All tests pass
- ✅ Documentation complete

---

## Notes for Engineer

### Important Skills to Use
- **@superpowers:test-driven-development** - REQUIRED for all implementation
- **@superpowers:verification-before-completion** - REQUIRED before marking tasks complete
- **@superpowers:systematic-debugging** - Use when encountering bugs

### Project Context
This is a companion tool to Handoff, which converts Figma designs to code. Token Extractor does the reverse: code → Figma. The user wants to help teams that inherit codebases create design systems by extracting their existing tokens.

### DRY Principle
Avoid duplication. If similar logic exists (e.g., file parsing), extract to shared utility.

### YAGNI Principle
Don't add features not in this plan. No extra modes, no additional output formats, no bonus features.

### Commit Often
After every task step. Small, focused commits make debugging easier and provide clear progress.

### AI Costs
Real API calls during development. Use smaller test cases during unit tests. The user has budgeted for development costs.
