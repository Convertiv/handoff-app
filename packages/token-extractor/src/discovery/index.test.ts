import { runDiscovery, recommendMode } from './index';
import type { DiscoveryResult } from '../types/config';

// Mock chalk and ora to avoid ESM issues in Jest
jest.mock('chalk', () => ({
  default: {
    cyan: (str: string) => str,
    gray: (str: string) => str,
    bold: (str: string) => str,
    green: (str: string) => str,
    red: (str: string) => str,
    yellow: (str: string) => str
  },
  cyan: (str: string) => str,
  gray: (str: string) => str,
  bold: (str: string) => str,
  green: (str: string) => str,
  red: (str: string) => str,
  yellow: (str: string) => str
}));

jest.mock('ora', () => {
  const mockOra = jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: ''
  }));
  return {
    __esModule: true,
    default: mockOra
  };
});

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
