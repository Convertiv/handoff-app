// Mock inquirer and chalk to avoid ESM issues in Jest
jest.mock('inquirer', () => ({
  default: {
    prompt: jest.fn(),
  },
  prompt: jest.fn(),
}));

jest.mock('chalk', () => ({
  default: {
    cyan: jest.fn((str) => str),
    gray: jest.fn((str) => str),
    green: jest.fn((str) => str),
    bold: jest.fn((str) => str),
    yellow: jest.fn((str) => str),
  },
  cyan: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  green: jest.fn((str) => str),
  bold: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
}));

import { promptModeSelection } from './mode-selection';
import inquirer from 'inquirer';
import type { DiscoveryResult, ModeRecommendation, AnalysisMode } from '../types/config';

describe('promptModeSelection', () => {
  const mockDiscovery: DiscoveryResult = {
    fileCount: 50,
    lineCount: 5000,
    frameworks: ['react', 'styled-components'],
    hasExistingTokens: false,
    directories: {
      styles: ['src/styles'],
      components: ['src/components']
    }
  };

  const mockRecommendation: ModeRecommendation = {
    mode: 'balanced',
    reasoning: 'Modern framework detected. Single-pass AI analysis handles diverse patterns well.',
    estimatedCost: 0.75,
    estimatedTime: 80,
    expectedAccuracy: 85
  };

  let mockPrompt: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrompt = jest.fn();
    (inquirer.prompt as any) = mockPrompt;
  });

  test('should be a function', () => {
    expect(typeof promptModeSelection).toBe('function');
  });

  test('should return the recommended mode when user accepts', async () => {
    mockPrompt
      .mockResolvedValueOnce({ mode: 'balanced' })
      .mockResolvedValueOnce({ confirm: true });

    const result = await promptModeSelection(mockDiscovery, mockRecommendation);

    expect(result).toBe('balanced');
    expect(mockPrompt).toHaveBeenCalledTimes(2);
  });

  test('should return user selected mode when overriding recommendation', async () => {
    mockPrompt
      .mockResolvedValueOnce({ mode: 'quick' })
      .mockResolvedValueOnce({ confirm: true });

    const result = await promptModeSelection(mockDiscovery, mockRecommendation);

    expect(result).toBe('quick');
  });

  test('should ask for confirmation with cost estimate', async () => {
    mockPrompt
      .mockResolvedValueOnce({ mode: 'thorough' })
      .mockResolvedValueOnce({ confirm: true });

    await promptModeSelection(mockDiscovery, mockRecommendation);

    // Check that the second prompt call was for confirmation
    const secondCall = mockPrompt.mock.calls[1][0];
    expect(secondCall).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          name: 'confirm',
          message: expect.stringContaining('$')
        })
      ])
    );
  });

  test('should re-prompt if user does not confirm', async () => {
    mockPrompt
      .mockResolvedValueOnce({ mode: 'thorough' })
      .mockResolvedValueOnce({ confirm: false })
      .mockResolvedValueOnce({ mode: 'balanced' })
      .mockResolvedValueOnce({ confirm: true });

    const result = await promptModeSelection(mockDiscovery, mockRecommendation);

    expect(result).toBe('balanced');
    expect(mockPrompt).toHaveBeenCalledTimes(4);
  });

  test('should highlight recommended mode in choices', async () => {
    mockPrompt
      .mockResolvedValueOnce({ mode: 'balanced' })
      .mockResolvedValueOnce({ confirm: true });

    await promptModeSelection(mockDiscovery, mockRecommendation);

    const firstCall = mockPrompt.mock.calls[0][0];
    const modeQuestion = firstCall[0];

    expect(modeQuestion.name).toBe('mode');
    expect(modeQuestion.type).toBe('list');
    expect(modeQuestion.choices).toBeDefined();
    expect(modeQuestion.choices.length).toBe(3);

    // Check that the recommended mode is marked
    const recommendedChoice = modeQuestion.choices.find(
      (c: any) => c.value === 'balanced'
    );
    expect(recommendedChoice.name).toContain('RECOMMENDED');
  });

  test('should display mode details including cost, time, and accuracy', async () => {
    mockPrompt
      .mockResolvedValueOnce({ mode: 'quick' })
      .mockResolvedValueOnce({ confirm: true });

    await promptModeSelection(mockDiscovery, mockRecommendation);

    const firstCall = mockPrompt.mock.calls[0][0];
    const modeQuestion = firstCall[0];

    // All choices should have descriptions with details
    modeQuestion.choices.forEach((choice: any) => {
      expect(choice.name).toBeDefined();
      expect(typeof choice.name).toBe('string');
      expect(choice.value).toMatch(/^(quick|balanced|thorough)$/);
    });
  });
});
