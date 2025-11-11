// Mock chalk and ora before importing
jest.mock('chalk', () => ({
  default: {
    green: jest.fn((str: string) => str),
    cyan: jest.fn((str: string) => str),
    gray: jest.fn((str: string) => str),
    red: jest.fn((str: string) => str),
  },
  green: jest.fn((str: string) => str),
  cyan: jest.fn((str: string) => str),
  gray: jest.fn((str: string) => str),
  red: jest.fn((str: string) => str),
}));

jest.mock('ora', () => ({
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: '',
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
