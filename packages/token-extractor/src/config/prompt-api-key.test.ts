// Mock chalk, inquirer, and ora to avoid ESM issues in Jest
jest.mock('chalk', () => ({
  default: {
    yellow: jest.fn((str) => str),
    gray: jest.fn((str) => str),
    green: jest.fn((str) => str),
  },
  yellow: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  green: jest.fn((str) => str),
}));

jest.mock('inquirer', () => ({
  default: {
    prompt: jest.fn(),
  },
  prompt: jest.fn(),
}));

import { promptForAPIKey } from './prompt-api-key';

describe('promptForAPIKey', () => {
  test('should be a function', () => {
    expect(typeof promptForAPIKey).toBe('function');
  });
});
