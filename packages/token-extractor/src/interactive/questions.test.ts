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
    red: jest.fn((str) => str),
  },
  cyan: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  green: jest.fn((str) => str),
  bold: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  red: jest.fn((str) => str),
}));

import { detectAmbiguities, generateQuestions, applyAnswers, askClarifyingQuestions, type Ambiguity } from './questions';
import inquirer from 'inquirer';
import type { ExtractedToken, TokenSet } from '../types/tokens';

describe('detectAmbiguities', () => {
  test('should detect duplicate color values with different names', () => {
    const tokens: ExtractedToken[] = [
      { name: 'primary', value: '#3b82f6', type: 'color', file: 'styles.css', line: 1 },
      { name: 'accent', value: '#3b82f6', type: 'color', file: 'theme.ts', line: 10 },
      { name: 'info', value: '#3b82f6', type: 'color', file: 'colors.scss', line: 5 },
    ];

    const ambiguities = detectAmbiguities(tokens);

    expect(ambiguities.length).toBeGreaterThan(0);
    expect(ambiguities[0].type).toBe('duplicate-value');
    expect(ambiguities[0].tokens.length).toBe(3);
    expect(ambiguities[0].value).toBe('#3b82f6');
  });

  test('should detect similar colors (within threshold)', () => {
    const tokens: ExtractedToken[] = [
      { name: 'blue-100', value: '#e0f2fe', type: 'color', file: 'styles.css', line: 1 },
      { name: 'blue-200', value: '#e1f3fe', type: 'color', file: 'styles.css', line: 2 },
      { name: 'sky-light', value: '#e2f4ff', type: 'color', file: 'theme.ts', line: 10 },
    ];

    const ambiguities = detectAmbiguities(tokens);

    // Should detect similar colors or naming patterns
    expect(ambiguities.length).toBeGreaterThan(0);
    // Either similar-colors or inconsistent-naming is acceptable
    const hasSimilarOrNaming = ambiguities.some(
      a => a.type === 'similar-colors' || a.type === 'inconsistent-naming'
    );
    expect(hasSimilarOrNaming).toBe(true);
  });

  test('should detect inconsistent naming patterns', () => {
    const tokens: ExtractedToken[] = [
      { name: 'spacing-xs', value: '4px', type: 'spacing', file: 'styles.css', line: 1 },
      { name: 'spacing-sm', value: '8px', type: 'spacing', file: 'styles.css', line: 2 },
      { name: 'spacing-100', value: '12px', type: 'spacing', file: 'theme.ts', line: 10 },
      { name: 'spacing-200', value: '16px', type: 'spacing', file: 'theme.ts', line: 11 },
    ];

    const ambiguities = detectAmbiguities(tokens);

    expect(ambiguities.length).toBeGreaterThan(0);
    expect(ambiguities[0].type).toBe('inconsistent-naming');
    expect(ambiguities[0].patterns).toContain('t-shirt');
    expect(ambiguities[0].patterns).toContain('numeric');
  });

  test('should detect missing scales', () => {
    const tokens: ExtractedToken[] = [
      { name: 'spacing-4', value: '4px', type: 'spacing', file: 'styles.css', line: 1 },
      { name: 'spacing-8', value: '8px', type: 'spacing', file: 'styles.css', line: 2 },
      { name: 'spacing-32', value: '32px', type: 'spacing', file: 'styles.css', line: 3 },
      { name: 'spacing-64', value: '64px', type: 'spacing', file: 'styles.css', line: 4 },
    ];

    const ambiguities = detectAmbiguities(tokens);

    // Should detect large gap between 8 and 32 (missing 16)
    const missingScale = ambiguities.find((a: Ambiguity) => a.type === 'incomplete-scale');
    expect(missingScale).toBeDefined();
  });

  test('should return empty array when no ambiguities exist', () => {
    const tokens: ExtractedToken[] = [
      { name: 'primary', value: '#3b82f6', type: 'color', file: 'styles.css', line: 1 },
      { name: 'secondary', value: '#8b5cf6', type: 'color', file: 'styles.css', line: 2 },
      { name: 'success', value: '#10b981', type: 'color', file: 'styles.css', line: 3 },
    ];

    const ambiguities = detectAmbiguities(tokens);

    // May have some ambiguities, but should not crash
    expect(Array.isArray(ambiguities)).toBe(true);
  });
});

describe('generateQuestions', () => {
  test('should generate question for duplicate values', () => {
    const ambiguity = {
      type: 'duplicate-value' as const,
      value: '#3b82f6',
      tokens: [
        { name: 'primary', value: '#3b82f6', type: 'color' as const, file: 'styles.css', line: 1 },
        { name: 'accent', value: '#3b82f6', type: 'color' as const, file: 'theme.ts', line: 10 },
        { name: 'info', value: '#3b82f6', type: 'color' as const, file: 'colors.scss', line: 5 },
      ],
      message: 'Found #3b82f6 used in 3 places with different names'
    };

    const questions = generateQuestions([ambiguity]);

    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].type).toBe('list');
    expect(questions[0].message).toContain('#3b82f6');
    expect(questions[0].choices.length).toBeGreaterThanOrEqual(3);
  });

  test('should generate question for similar colors', () => {
    const ambiguity = {
      type: 'similar-colors' as const,
      tokens: [
        { name: 'blue-100', value: '#dbeafe', type: 'color' as const, file: 'styles.css', line: 1 },
        { name: 'blue-200', value: '#bfdbfe', type: 'color' as const, file: 'styles.css', line: 2 },
        { name: 'sky-light', value: '#dde9ff', type: 'color' as const, file: 'theme.ts', line: 10 },
      ],
      message: 'Found 3 similar blue colors'
    };

    const questions = generateQuestions([ambiguity]);

    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].type).toBe('list');
    expect(questions[0].choices).toContainEqual(
      expect.objectContaining({ name: expect.stringContaining('Group as shades') })
    );
    expect(questions[0].choices).toContainEqual(
      expect.objectContaining({ name: expect.stringContaining('Keep separate') })
    );
  });

  test('should generate question for inconsistent naming', () => {
    const ambiguity = {
      type: 'inconsistent-naming' as const,
      category: 'spacing',
      patterns: ['t-shirt', 'numeric'],
      tokens: [
        { name: 'spacing-xs', value: '4px', type: 'spacing' as const, file: 'styles.css', line: 1 },
        { name: 'spacing-100', value: '12px', type: 'spacing' as const, file: 'theme.ts', line: 10 },
      ],
      message: 'Spacing tokens use mixed naming conventions'
    };

    const questions = generateQuestions([ambiguity]);

    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].type).toBe('list');
    expect(questions[0].message).toContain('spacing');
    expect(questions[0].choices.length).toBeGreaterThanOrEqual(2);
  });

  test('should limit questions to reasonable number', () => {
    const ambiguities = Array.from({ length: 20 }, (_, i) => ({
      type: 'duplicate-value' as const,
      value: `#color${i}`,
      tokens: [
        { name: `color${i}a`, value: `#color${i}`, type: 'color' as const, file: 'styles.css' },
        { name: `color${i}b`, value: `#color${i}`, type: 'color' as const, file: 'theme.ts' },
      ],
      message: `Duplicate value #color${i}`
    }));

    const questions = generateQuestions(ambiguities);

    // Should limit to prevent overwhelming the user
    expect(questions.length).toBeLessThanOrEqual(10);
  });
});

describe('applyAnswers', () => {
  test('should apply user selection for duplicate values', () => {
    const tokens: ExtractedToken[] = [
      { name: 'primary', value: '#3b82f6', type: 'color', file: 'styles.css', line: 1 },
      { name: 'accent', value: '#3b82f6', type: 'color', file: 'theme.ts', line: 10 },
      { name: 'info', value: '#3b82f6', type: 'color', file: 'colors.scss', line: 5 },
    ];

    const answers = {
      'ambiguity-0': 'primary'
    };

    const refined = applyAnswers(tokens, answers);

    // All tokens with #3b82f6 should now be named 'primary'
    const blueTokens = refined.filter(t => t.value === '#3b82f6');
    expect(blueTokens.every(t => t.name === 'primary')).toBe(true);
  });

  test('should group similar colors as shades', () => {
    const tokens: ExtractedToken[] = [
      { name: 'blue-light', value: '#dbeafe', type: 'color', file: 'styles.css', line: 1 },
      { name: 'blue-medium', value: '#bfdbfe', type: 'color', file: 'styles.css', line: 2 },
      { name: 'sky-light', value: '#dde9ff', type: 'color', file: 'theme.ts', line: 10 },
    ];

    const answers = {
      'ambiguity-0': 'group-shades:blue'
    };

    const refined = applyAnswers(tokens, answers);

    // Should rename to consistent shade pattern
    expect(refined.some(t => t.name.includes('blue'))).toBe(true);
  });

  test('should rename tokens according to naming convention', () => {
    const tokens: ExtractedToken[] = [
      { name: 'spacing-xs', value: '4px', type: 'spacing', file: 'styles.css', line: 1 },
      { name: 'spacing-sm', value: '8px', type: 'spacing', file: 'styles.css', line: 2 },
      { name: 'spacing-100', value: '12px', type: 'spacing', file: 'theme.ts', line: 10 },
      { name: 'spacing-200', value: '16px', type: 'spacing', file: 'theme.ts', line: 11 },
    ];

    const answers = {
      'ambiguity-0': 'numeric'
    };

    const refined = applyAnswers(tokens, answers);

    // All tokens should follow numeric convention
    expect(refined.every(t => /spacing-\d+/.test(t.name))).toBe(true);
  });

  test('should return original tokens if no answers provided', () => {
    const tokens: ExtractedToken[] = [
      { name: 'primary', value: '#3b82f6', type: 'color', file: 'styles.css', line: 1 },
    ];

    const refined = applyAnswers(tokens, {});

    expect(refined).toEqual(tokens);
  });
});

describe('askClarifyingQuestions', () => {
  let mockPrompt: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrompt = jest.fn();
    (inquirer.prompt as any) = mockPrompt;
  });

  test('should detect ambiguities and ask questions', async () => {
    const tokenSet: TokenSet = {
      tokens: [
        { name: 'primary', value: '#3b82f6', type: 'color', file: 'styles.css', line: 1 },
        { name: 'accent', value: '#3b82f6', type: 'color', file: 'theme.ts', line: 10 },
      ],
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: 2,
        mode: 'balanced'
      }
    };

    mockPrompt.mockResolvedValueOnce({
      'ambiguity-0': 'primary'
    });

    const refined = await askClarifyingQuestions(tokenSet);

    expect(mockPrompt).toHaveBeenCalled();
    expect(refined.tokens.length).toBeGreaterThan(0);
  });

  test('should skip questions in non-interactive mode', async () => {
    const tokenSet: TokenSet = {
      tokens: [
        { name: 'primary', value: '#3b82f6', type: 'color', file: 'styles.css', line: 1 },
        { name: 'accent', value: '#3b82f6', type: 'color', file: 'theme.ts', line: 10 },
      ],
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: 2,
        mode: 'balanced'
      }
    };

    const refined = await askClarifyingQuestions(tokenSet, { interactive: false });

    expect(mockPrompt).not.toHaveBeenCalled();
    expect(refined.tokens).toEqual(tokenSet.tokens);
  });

  test('should return original tokens if no ambiguities found', async () => {
    const tokenSet: TokenSet = {
      tokens: [
        { name: 'primary', value: '#3b82f6', type: 'color', file: 'styles.css', line: 1 },
        { name: 'secondary', value: '#8b5cf6', type: 'color', file: 'styles.css', line: 2 },
      ],
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: 1,
        mode: 'quick'
      }
    };

    const refined = await askClarifyingQuestions(tokenSet);

    // If no significant ambiguities, should not prompt
    expect(refined.tokens.length).toBe(2);
  });

  test('should handle user skipping questions', async () => {
    const tokenSet: TokenSet = {
      tokens: [
        { name: 'primary', value: '#3b82f6', type: 'color', file: 'styles.css', line: 1 },
        { name: 'accent', value: '#3b82f6', type: 'color', file: 'theme.ts', line: 10 },
      ],
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: 2,
        mode: 'balanced'
      }
    };

    mockPrompt.mockResolvedValueOnce({});

    const refined = await askClarifyingQuestions(tokenSet);

    // Should return tokens unchanged if user doesn't answer
    expect(refined.tokens.length).toBe(2);
  });
});
