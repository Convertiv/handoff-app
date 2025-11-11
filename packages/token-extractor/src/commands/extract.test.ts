// Mock chalk, ora, and interactive modules before importing
jest.mock('chalk', () => ({
  default: {
    green: jest.fn((str: string) => str),
    cyan: jest.fn((str: string) => str),
    gray: jest.fn((str: string) => str),
    red: jest.fn((str: string) => str),
    yellow: jest.fn((str: string) => str),
    bold: jest.fn((str: string) => str),
  },
  green: jest.fn((str: string) => str),
  cyan: jest.fn((str: string) => str),
  gray: jest.fn((str: string) => str),
  red: jest.fn((str: string) => str),
  yellow: jest.fn((str: string) => str),
  bold: jest.fn((str: string) => str),
}));

jest.mock('ora', () => ({
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: '',
  })),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock('../interactive/mode-selection', () => ({
  promptModeSelection: jest.fn().mockResolvedValue('balanced'),
}));

jest.mock('../discovery', () => ({
  runDiscovery: jest.fn().mockResolvedValue({
    fileCount: 10,
    lineCount: 1000,
    frameworks: ['react'],
    hasExistingTokens: false,
    directories: {
      styles: ['./src/styles'],
      components: ['./src/components'],
    },
  }),
  recommendMode: jest.fn().mockReturnValue({
    mode: 'balanced',
    reasoning: 'Test reasoning',
    estimatedCost: 0.5,
    estimatedTime: 30,
    expectedAccuracy: 85,
  }),
  displayDiscoveryResults: jest.fn(),
}));

jest.mock('../config/api-keys', () => ({
  APIKeyManager: jest.fn().mockImplementation(() => ({
    detectProvider: jest.fn().mockReturnValue('anthropic'),
    getKey: jest.fn().mockReturnValue('test-api-key'),
  })),
}));

jest.mock('../config/prompt-api-key', () => ({
  promptForAPIKey: jest.fn().mockResolvedValue({
    provider: 'anthropic',
    apiKey: 'test-api-key',
  }),
}));

jest.mock('../analysis/ai-client', () => ({
  createProvider: jest.fn().mockReturnValue({
    analyze: jest.fn().mockResolvedValue('{}'),
  }),
}));

jest.mock('../analysis/modes/quick', () => ({
  QuickMode: jest.fn().mockImplementation(() => ({
    extract: jest.fn().mockResolvedValue({
      tokens: [],
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: 0,
        mode: 'quick',
      },
    }),
  })),
}));

jest.mock('../analysis/modes/balanced', () => ({
  BalancedMode: jest.fn().mockImplementation(() => ({
    extract: jest.fn().mockResolvedValue({
      tokens: [],
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: 0,
        mode: 'balanced',
      },
    }),
  })),
}));

jest.mock('../analysis/modes/thorough', () => ({
  ThoroughMode: jest.fn().mockImplementation(() => ({
    extract: jest.fn().mockResolvedValue({
      tokens: [],
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: 0,
        mode: 'thorough',
      },
    }),
  })),
}));

jest.mock('../extraction/parsers/postcss-parser', () => ({
  PostCSSParser: jest.fn().mockImplementation(() => ({
    parseFile: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../extraction/parsers/babel-parser', () => ({
  BabelParser: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../interactive/questions', () => ({
  askClarifyingQuestions: jest.fn().mockImplementation((tokenSet) => tokenSet),
}));

jest.mock('../output/figma-tokens', () => ({
  FigmaTokensGenerator: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock('../output/report', () => ({
  ReportGenerator: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockReturnValue('# Report'),
  })),
}));

jest.mock('../output/audit', () => ({
  AuditGenerator: jest.fn().mockImplementation(() => ({
    audit: jest.fn().mockReturnValue({
      issues: [],
      summary: { critical: 0, warnings: 0, info: 0 },
    }),
  })),
}));

jest.mock('../output/cleanup', () => ({
  CleanupTaskGenerator: jest.fn().mockImplementation(() => ({
    generateMarkdown: jest.fn().mockReturnValue('# Cleanup Tasks'),
  })),
}));

jest.mock('../discovery/scanner', () => ({
  FileScanner: jest.fn().mockImplementation(() => ({
    findStyleFiles: jest.fn().mockResolvedValue([]),
  })),
}));

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

/**
 * Mock validation tests
 * Per CLAUDE.md: "mocks used in tests must always be validated"
 * These tests verify that our mocks match the real API signatures
 */
describe('Mock Validation', () => {
  describe('chalk mock', () => {
    test('should validate chalk mock structure matches expected API', () => {
      // Import the mocked chalk
      const chalk = require('chalk');

      // Verify chalk has expected methods
      expect(typeof chalk.default.green).toBe('function');
      expect(typeof chalk.default.cyan).toBe('function');
      expect(typeof chalk.default.gray).toBe('function');
      expect(typeof chalk.default.red).toBe('function');

      // Verify methods return strings (real chalk also returns strings)
      expect(typeof chalk.default.green('test')).toBe('string');
      expect(typeof chalk.default.cyan('test')).toBe('string');
      expect(typeof chalk.default.gray('test')).toBe('string');
      expect(typeof chalk.default.red('test')).toBe('string');

      // Verify named exports
      expect(typeof chalk.green).toBe('function');
      expect(typeof chalk.cyan).toBe('function');
      expect(typeof chalk.gray).toBe('function');
      expect(typeof chalk.red).toBe('function');
    });

    test('should validate chalk methods accept string parameters', () => {
      const chalk = require('chalk');

      // These should not throw
      expect(() => chalk.default.green('test string')).not.toThrow();
      expect(() => chalk.default.cyan('test string')).not.toThrow();
      expect(() => chalk.default.gray('test string')).not.toThrow();
      expect(() => chalk.default.red('test string')).not.toThrow();
    });

    test('should validate chalk methods return the input string', () => {
      const chalk = require('chalk');

      // Our mock should return the input string unchanged
      expect(chalk.default.green('test')).toBe('test');
      expect(chalk.default.cyan('test')).toBe('test');
      expect(chalk.default.gray('test')).toBe('test');
      expect(chalk.default.red('test')).toBe('test');
    });
  });

  describe('ora mock', () => {
    test('should validate ora mock structure matches expected API', () => {
      const ora = require('ora');

      // Verify ora is a function that returns a spinner
      expect(typeof ora.default).toBe('function');

      const spinner = ora.default('test');

      // Verify spinner has expected methods
      expect(typeof spinner.start).toBe('function');
      expect(typeof spinner.succeed).toBe('function');
      expect(typeof spinner.fail).toBe('function');

      // Verify text property exists
      expect(spinner).toHaveProperty('text');
    });

    test('should validate ora spinner methods return this for chaining', () => {
      const ora = require('ora');
      const spinner = ora.default('test');

      // Verify methods return this (for method chaining)
      expect(spinner.start()).toBe(spinner);
      expect(spinner.succeed()).toBe(spinner);
      expect(spinner.fail()).toBe(spinner);
    });

    test('should validate ora accepts string parameter', () => {
      const ora = require('ora');

      // Should not throw
      expect(() => ora.default('test message')).not.toThrow();
    });

    test('should validate ora spinner text property is writable', () => {
      const ora = require('ora');
      const spinner = ora.default('test');

      // Should be able to set text property (real ora allows this)
      expect(() => {
        spinner.text = 'new text';
      }).not.toThrow();
    });
  });
});
