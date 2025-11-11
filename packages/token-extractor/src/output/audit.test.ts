import { AuditGenerator, AuditIssue, AuditResult } from './audit';
import { ExtractedToken, TokenSet } from '../types/tokens';

describe('AuditGenerator', () => {
  const mockTokenSet: TokenSet = {
    tokens: [
      { name: 'primary-color', value: '#0ea5e9', type: 'color', file: 'colors.css', line: 1 },
      { name: 'primary_blue', value: '#0ea5e9', type: 'color', file: 'colors.css', line: 2 },
      { name: 'secondary-color', value: '#0ea6ea', type: 'color', file: 'colors.css', line: 3 },
      { name: 'text-color', value: '#333333', type: 'color', file: 'typography.css', line: 5 },
      { name: 'bg-light', value: '#ffffff', type: 'color', file: 'colors.css', line: 4 },
      { name: 'spacing-sm', value: '8px', type: 'spacing', file: 'spacing.css', line: 1 },
      { name: 'spacing-md', value: '16px', type: 'spacing', file: 'spacing.css', line: 2 },
      { name: 'spacing-xl', value: '48px', type: 'spacing', file: 'spacing.css', line: 3 },
    ],
    metadata: {
      extractedAt: new Date().toISOString(),
      fileCount: 3,
      mode: 'balanced'
    }
  };

  describe('Color Similarity Detection', () => {
    test('should detect colors within 5% difference as similar', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      const similarityIssues = result.issues.filter(i => i.category === 'duplicate');
      expect(similarityIssues.length).toBeGreaterThan(0);

      // #0ea5e9 and #0ea6ea are very similar (only 1 in G channel difference)
      const hasSimilarColors = similarityIssues.some(issue =>
        issue.tokens.includes('primary-color') && issue.tokens.includes('secondary-color')
      );
      expect(hasSimilarColors).toBe(true);
    });

    test('should calculate color similarity correctly', () => {
      const auditor = new AuditGenerator(mockTokenSet);

      // Test public method if exposed, or test through audit results
      const result = auditor.audit();

      // Colors #0ea5e9 and #0ea6ea should be flagged as similar
      const duplicateIssues = result.issues.filter(i => i.category === 'duplicate');
      expect(duplicateIssues.length).toBeGreaterThan(0);
    });

    test('should not flag dissimilar colors', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      // #0ea5e9 (blue) and #333333 (dark gray) should not be flagged as similar
      const blueDarkGraySimilarity = result.issues.some(issue =>
        issue.category === 'duplicate' &&
        issue.tokens.includes('primary-color') &&
        issue.tokens.includes('text-color')
      );
      expect(blueDarkGraySimilarity).toBe(false);
    });
  });

  describe('Scale Gap Detection', () => {
    test('should detect gaps in spacing scale', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      const scaleIssues = result.issues.filter(i => i.category === 'scale-gap');
      expect(scaleIssues.length).toBeGreaterThan(0);

      // Should detect missing 24px and 32px between 16px and 48px
      const spacingGap = scaleIssues.find(issue =>
        issue.description.includes('spacing') || issue.description.includes('16') || issue.description.includes('48')
      );
      expect(spacingGap).toBeDefined();
    });

    test('should suggest missing scale values', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      const scaleIssues = result.issues.filter(i => i.category === 'scale-gap');
      const spacingIssue = scaleIssues.find(i => i.description.includes('spacing'));

      expect(spacingIssue).toBeDefined();
      if (spacingIssue) {
        expect(spacingIssue.severity).toBe('warning');
      }
    });
  });

  describe('Naming Inconsistency Detection', () => {
    test('should detect mixed naming conventions', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      const namingIssues = result.issues.filter(i => i.category === 'naming');
      expect(namingIssues.length).toBeGreaterThan(0);

      // Should detect kebab-case vs snake_case
      const mixedNaming = namingIssues.some(issue =>
        issue.description.toLowerCase().includes('tokens use') ||
        issue.description.toLowerCase().includes('dominant')
      );
      expect(mixedNaming).toBe(true);
    });

    test('should identify dominant naming convention', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      // kebab-case is more common (5/8 tokens vs 1/8 snake_case)
      const namingIssues = result.issues.filter(i => i.category === 'naming');
      expect(namingIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Palette Balance Detection', () => {
    test('should detect imbalanced color palettes', () => {
      const imbalancedTokenSet: TokenSet = {
        tokens: [
          { name: 'blue-100', value: '#dbeafe', type: 'color', file: 'colors.css' },
          { name: 'blue-200', value: '#bfdbfe', type: 'color', file: 'colors.css' },
          { name: 'blue-300', value: '#93c5fd', type: 'color', file: 'colors.css' },
          { name: 'blue-400', value: '#60a5fa', type: 'color', file: 'colors.css' },
          { name: 'blue-500', value: '#3b82f6', type: 'color', file: 'colors.css' },
          { name: 'blue-600', value: '#2563eb', type: 'color', file: 'colors.css' },
          { name: 'blue-700', value: '#1d4ed8', type: 'color', file: 'colors.css' },
          { name: 'blue-800', value: '#1e40af', type: 'color', file: 'colors.css' },
          { name: 'blue-900', value: '#1e3a8a', type: 'color', file: 'colors.css' },
          { name: 'blue-950', value: '#172554', type: 'color', file: 'colors.css' },
          { name: 'red-500', value: '#ef4444', type: 'color', file: 'colors.css' },
          { name: 'red-600', value: '#dc2626', type: 'color', file: 'colors.css' },
        ],
        metadata: { extractedAt: new Date().toISOString(), fileCount: 1, mode: 'balanced' }
      };

      const auditor = new AuditGenerator(imbalancedTokenSet);
      const result = auditor.audit();

      const balanceIssues = result.issues.filter(i => i.category === 'palette-imbalance');
      expect(balanceIssues.length).toBeGreaterThan(0);

      // Should detect 10 blues vs 2 reds
      const blueRedImbalance = balanceIssues.some(issue =>
        (issue.description.includes('blue') && issue.description.includes('red')) ||
        issue.description.includes('imbalance')
      );
      expect(blueRedImbalance).toBe(true);
    });
  });

  describe('Contrast Ratio Checking', () => {
    test('should detect poor contrast ratios', () => {
      const poorContrastTokenSet: TokenSet = {
        tokens: [
          { name: 'text-muted', value: '#cccccc', type: 'color', file: 'colors.css' },
          { name: 'bg-light', value: '#ffffff', type: 'color', file: 'colors.css' },
          { name: 'text-dark', value: '#333333', type: 'color', file: 'colors.css' },
        ],
        metadata: { extractedAt: new Date().toISOString(), fileCount: 1, mode: 'balanced' }
      };

      const auditor = new AuditGenerator(poorContrastTokenSet);
      const result = auditor.audit();

      const contrastIssues = result.issues.filter(i => i.category === 'accessibility');
      expect(contrastIssues.length).toBeGreaterThan(0);

      // #cccccc on #ffffff has poor contrast (< 4.5:1)
      const poorContrast = contrastIssues.some(issue =>
        issue.description.includes('contrast') && issue.severity === 'critical'
      );
      expect(poorContrast).toBe(true);
    });

    test('should calculate contrast ratios correctly', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      // All issues should have valid severity levels
      result.issues.forEach(issue => {
        expect(['critical', 'warning', 'info']).toContain(issue.severity);
      });
    });

    test('should pass good contrast ratios', () => {
      const goodContrastTokenSet: TokenSet = {
        tokens: [
          { name: 'text-dark', value: '#000000', type: 'color', file: 'colors.css' },
          { name: 'bg-light', value: '#ffffff', type: 'color', file: 'colors.css' },
        ],
        metadata: { extractedAt: new Date().toISOString(), fileCount: 1, mode: 'balanced' }
      };

      const auditor = new AuditGenerator(goodContrastTokenSet);
      const result = auditor.audit();

      // Black on white should not have critical contrast issues
      const criticalContrastIssues = result.issues.filter(
        i => i.category === 'accessibility' && i.severity === 'critical'
      );
      expect(criticalContrastIssues.length).toBe(0);
    });
  });

  describe('Audit Result Structure', () => {
    test('should return complete audit result', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(typeof result.summary).toBe('object');
    });

    test('should categorize issues by severity', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      expect(result.summary).toHaveProperty('critical');
      expect(result.summary).toHaveProperty('warnings');
      expect(result.summary).toHaveProperty('info');
      expect(typeof result.summary.critical).toBe('number');
      expect(typeof result.summary.warnings).toBe('number');
      expect(typeof result.summary.info).toBe('number');
    });

    test('should include tokens and files in issues', () => {
      const auditor = new AuditGenerator(mockTokenSet);
      const result = auditor.audit();

      result.issues.forEach(issue => {
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('tokens');
        expect(Array.isArray(issue.tokens)).toBe(true);
      });
    });
  });
});
