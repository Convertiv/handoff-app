import { ReportGenerator } from './report';
import type { TokenSet, ExtractedToken } from '../types/tokens';

describe('ReportGenerator', () => {
  const sampleTokenSet: TokenSet = {
    tokens: [
      {
        name: 'primary-500',
        value: '#0ea5e9',
        type: 'color',
        file: '/src/styles/colors.scss',
        line: 10
      },
      {
        name: 'primary-600',
        value: '#0284c7',
        type: 'color',
        file: '/src/styles/colors.scss',
        line: 11
      },
      {
        name: 'secondary-500',
        value: '#8b5cf6',
        type: 'color',
        file: '/src/styles/colors.scss',
        line: 12
      },
      {
        name: 'spacing-sm',
        value: '8px',
        type: 'spacing',
        file: '/src/styles/spacing.scss',
        line: 5
      },
      {
        name: 'spacing-md',
        value: '16px',
        type: 'spacing',
        file: '/src/styles/spacing.scss',
        line: 6
      },
      {
        name: 'spacing-lg',
        value: '24px',
        type: 'spacing',
        file: '/src/styles/spacing.scss',
        line: 7
      },
      {
        name: 'font-size-base',
        value: '16px',
        type: 'fontSize',
        file: '/src/styles/typography.scss',
        line: 3
      },
      {
        name: 'font-size-lg',
        value: '18px',
        type: 'fontSize',
        file: '/src/styles/typography.scss',
        line: 4
      },
      {
        name: 'border-radius-sm',
        value: '4px',
        type: 'borderRadius',
        file: '/src/styles/borders.scss',
        line: 2
      },
      {
        name: 'border-radius-md',
        value: '8px',
        type: 'borderRadius',
        file: '/src/styles/borders.scss',
        line: 3
      }
    ],
    metadata: {
      extractedAt: '2025-11-11T10:00:00.000Z',
      framework: 'scss',
      fileCount: 4,
      lineCount: 1500,
      mode: 'balanced'
    }
  };

  test('should generate markdown report with correct structure', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const report = generator.generate();

    expect(report).toContain('# Token Extraction Report');
    expect(report).toContain('## Summary');
    expect(report).toContain('## Breakdown');
    expect(report).toContain('## Recommendations');
    expect(report).toContain('## Next Steps');
  });

  test('should include token count in summary', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const report = generator.generate();

    expect(report).toContain('Extracted 10 tokens');
  });

  test('should show breakdown by category', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const report = generator.generate();

    expect(report).toContain('**Colors:** 3 tokens');
    expect(report).toContain('**Spacing:** 3 tokens');
    expect(report).toContain('**Font Size:** 2 tokens');
    expect(report).toContain('**Border Radius:** 2 tokens');
  });

  test('should include metadata in report', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const report = generator.generate();

    expect(report).toContain('**Mode:** balanced');
    expect(report).toContain('**Framework:** scss');
  });

  test('should detect duplicate values', () => {
    const tokensWithDuplicates: TokenSet = {
      tokens: [
        {
          name: 'spacing-md',
          value: '16px',
          type: 'spacing',
          file: '/src/styles/spacing.scss',
          line: 6
        },
        {
          name: 'font-size-base',
          value: '16px',
          type: 'fontSize',
          file: '/src/styles/typography.scss',
          line: 3
        }
      ],
      metadata: {
        extractedAt: '2025-11-11T10:00:00.000Z',
        fileCount: 2,
        lineCount: 100,
        mode: 'quick'
      }
    };

    const generator = new ReportGenerator(tokensWithDuplicates);
    const report = generator.generate();

    expect(report).toContain('Found 1 duplicate value');
  });

  test('should include recommendations section', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const report = generator.generate();

    expect(report).toContain('Recommendations');
    expect(report).toContain('-');
  });

  test('should include next steps for Figma Tokens plugin', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const report = generator.generate();

    expect(report).toContain('Next Steps');
    expect(report).toContain('Figma Tokens');
  });

  test('should handle empty token set', () => {
    const emptyTokenSet: TokenSet = {
      tokens: [],
      metadata: {
        extractedAt: '2025-11-11T10:00:00.000Z',
        fileCount: 0,
        lineCount: 0,
        mode: 'quick'
      }
    };

    const generator = new ReportGenerator(emptyTokenSet);
    const report = generator.generate();

    expect(report).toContain('Extracted 0 tokens');
  });

  test('should format date in summary', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const report = generator.generate();

    expect(report).toContain('Extracted at:');
  });

  test('should use checkmarks for success messages', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const report = generator.generate();

    // Check for visual indicators
    expect(report).toMatch(/[✓✅]/);
  });

  test('should categorize tokens correctly', () => {
    const generator = new ReportGenerator(sampleTokenSet);
    const breakdown = generator.getCategoryBreakdown();

    expect(breakdown).toHaveProperty('color');
    expect(breakdown.color).toBe(3);
    expect(breakdown).toHaveProperty('spacing');
    expect(breakdown.spacing).toBe(3);
    expect(breakdown).toHaveProperty('fontSize');
    expect(breakdown.fontSize).toBe(2);
    expect(breakdown).toHaveProperty('borderRadius');
    expect(breakdown.borderRadius).toBe(2);
  });

  test('should identify duplicate values correctly', () => {
    const tokensWithDuplicates: TokenSet = {
      tokens: [
        { name: 'color-1', value: '#ff0000', type: 'color', file: 'a.scss' },
        { name: 'color-2', value: '#ff0000', type: 'color', file: 'b.scss' },
        { name: 'color-3', value: '#00ff00', type: 'color', file: 'c.scss' },
        { name: 'spacing-1', value: '8px', type: 'spacing', file: 'd.scss' },
        { name: 'spacing-2', value: '8px', type: 'spacing', file: 'e.scss' }
      ],
      metadata: {
        extractedAt: '2025-11-11T10:00:00.000Z',
        fileCount: 5,
        lineCount: 100,
        mode: 'quick'
      }
    };

    const generator = new ReportGenerator(tokensWithDuplicates);
    const duplicates = generator.findDuplicateValues();

    expect(duplicates.size).toBe(2); // Two unique values have duplicates
    expect(duplicates.get('#ff0000')).toHaveLength(2);
    expect(duplicates.get('8px')).toHaveLength(2);
  });
});
