import { ExtractedToken, TokenSet } from '../types/tokens';

export type AuditIssueCategory =
  | 'duplicate'
  | 'scale-gap'
  | 'naming'
  | 'palette-imbalance'
  | 'accessibility';

export type AuditIssueSeverity = 'critical' | 'warning' | 'info';

export interface AuditIssue {
  category: AuditIssueCategory;
  severity: AuditIssueSeverity;
  description: string;
  tokens: string[];
  files?: string[];
  suggestion?: string;
}

export interface AuditResult {
  issues: AuditIssue[];
  summary: {
    critical: number;
    warnings: number;
    info: number;
  };
}

/**
 * Generates design system health audit
 */
export class AuditGenerator {
  private tokenSet: TokenSet;

  constructor(tokenSet: TokenSet) {
    this.tokenSet = tokenSet;
  }

  /**
   * Run complete audit on token set
   */
  public audit(): AuditResult {
    const issues: AuditIssue[] = [];

    // Run all audit checks
    issues.push(...this.detectColorSimilarity());
    issues.push(...this.detectScaleGaps());
    issues.push(...this.detectNamingInconsistencies());
    issues.push(...this.detectPaletteImbalances());
    issues.push(...this.detectContrastIssues());

    // Calculate summary
    const summary = {
      critical: issues.filter(i => i.severity === 'critical').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
    };

    return { issues, summary };
  }

  /**
   * Detect colors that are very similar (within 5% difference)
   */
  private detectColorSimilarity(): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const colorTokens = this.tokenSet.tokens.filter(t => t.type === 'color');

    for (let i = 0; i < colorTokens.length; i++) {
      for (let j = i + 1; j < colorTokens.length; j++) {
        const token1 = colorTokens[i];
        const token2 = colorTokens[j];

        if (typeof token1.value === 'string' && typeof token2.value === 'string') {
          const similarity = this.calculateColorSimilarity(token1.value, token2.value);

          if (similarity > 0.95) { // 95% similar = within 5% difference
            issues.push({
              category: 'duplicate',
              severity: 'warning',
              description: `Colors "${token1.name}" and "${token2.name}" are ${Math.round(similarity * 100)}% similar`,
              tokens: [token1.name, token2.name],
              files: [token1.file, token2.file],
              suggestion: 'Consider consolidating these near-duplicate colors into a single token'
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Calculate color similarity (0-1, where 1 is identical)
   */
  private calculateColorSimilarity(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );

    // Max distance in RGB space is sqrt(255^2 * 3) = 441.67
    const maxDistance = 441.67;
    const similarity = 1 - (distance / maxDistance);

    return similarity;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Detect gaps in spacing/sizing scales
   */
  private detectScaleGaps(): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const scaleTypes: Array<'spacing' | 'sizing'> = ['spacing', 'sizing'];

    scaleTypes.forEach(type => {
      const tokens = this.tokenSet.tokens.filter(t => t.type === type);
      const values = tokens
        .map(t => parseFloat(String(t.value)))
        .filter(v => !isNaN(v))
        .sort((a, b) => a - b);

      if (values.length < 3) return; // Need at least 3 values to detect gaps

      // Check for gaps in progression
      for (let i = 0; i < values.length - 1; i++) {
        const current = values[i];
        const next = values[i + 1];
        const gap = next - current;

        // If gap is more than 2x the previous step, flag it
        if (i > 0) {
          const previousGap = current - values[i - 1];
          if (gap > previousGap * 2 && gap > 8) {
            const expectedValues = this.suggestMissingScaleValues(current, next);
            issues.push({
              category: 'scale-gap',
              severity: 'warning',
              description: `${type} scale has a gap between ${current}px and ${next}px`,
              tokens: tokens.filter(t =>
                parseFloat(String(t.value)) === current ||
                parseFloat(String(t.value)) === next
              ).map(t => t.name),
              suggestion: `Consider adding intermediate values: ${expectedValues.join(', ')}`
            });
          }
        }
      }
    });

    return issues;
  }

  /**
   * Suggest missing scale values between two numbers
   */
  private suggestMissingScaleValues(start: number, end: number): string[] {
    const suggestions: string[] = [];
    const gap = end - start;

    // For 8px scale
    if (gap >= 16) {
      let value = start + 8;
      while (value < end) {
        suggestions.push(`${value}px`);
        value += 8;
      }
    }

    return suggestions;
  }

  /**
   * Detect mixed naming conventions
   */
  private detectNamingInconsistencies(): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // Count naming conventions
    const kebabCase = this.tokenSet.tokens.filter(t => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.name));
    const snakeCase = this.tokenSet.tokens.filter(t => /^[a-z0-9]+(_[a-z0-9]+)*$/.test(t.name));
    const camelCase = this.tokenSet.tokens.filter(t => /^[a-z][a-zA-Z0-9]*$/.test(t.name) && /[A-Z]/.test(t.name));

    const conventions = [
      { name: 'kebab-case', count: kebabCase.length, tokens: kebabCase },
      { name: 'snake_case', count: snakeCase.length, tokens: snakeCase },
      { name: 'camelCase', count: camelCase.length, tokens: camelCase },
    ].filter(c => c.count > 0);

    if (conventions.length > 1) {
      const dominant = conventions.reduce((a, b) => a.count > b.count ? a : b);
      const minorities = conventions.filter(c => c !== dominant);

      minorities.forEach(convention => {
        issues.push({
          category: 'naming',
          severity: 'warning',
          description: `${convention.count} tokens use ${convention.name}, but ${dominant.name} is dominant (${dominant.count} tokens)`,
          tokens: convention.tokens.slice(0, 5).map(t => t.name), // Show first 5 examples
          suggestion: `Consider renaming ${convention.name} tokens to ${dominant.name} for consistency`
        });
      });
    }

    return issues;
  }

  /**
   * Detect imbalanced color palettes
   */
  private detectPaletteImbalances(): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const colorTokens = this.tokenSet.tokens.filter(t => t.type === 'color');

    // Group colors by base name (e.g., blue, red, green)
    const colorFamilies = new Map<string, ExtractedToken[]>();

    colorTokens.forEach(token => {
      // Extract base color name (e.g., "blue" from "blue-500" or "primary-blue")
      const match = token.name.match(/\b(red|blue|green|yellow|purple|pink|gray|grey|orange|teal|cyan|indigo)\b/i);
      if (match) {
        const family = match[1].toLowerCase();
        if (!colorFamilies.has(family)) {
          colorFamilies.set(family, []);
        }
        colorFamilies.get(family)!.push(token);
      }
    });

    // Check for imbalances (one family has 3x+ more colors than another)
    const families = Array.from(colorFamilies.entries());
    if (families.length > 1) {
      const sorted = families.sort((a, b) => b[1].length - a[1].length);
      const largest = sorted[0];
      const smallest = sorted[sorted.length - 1];

      if (largest[1].length >= smallest[1].length * 3 && largest[1].length >= 5) {
        issues.push({
          category: 'palette-imbalance',
          severity: 'info',
          description: `Color palette is imbalanced: ${largest[1].length} ${largest[0]} tokens vs ${smallest[1].length} ${smallest[0]} tokens`,
          tokens: [...largest[1].slice(0, 3), ...smallest[1].slice(0, 3)].map(t => t.name),
          suggestion: `Consider expanding the ${smallest[0]} palette or reducing the ${largest[0]} palette for better balance`
        });
      }
    }

    return issues;
  }

  /**
   * Detect poor contrast ratios for accessibility
   */
  private detectContrastIssues(): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const colorTokens = this.tokenSet.tokens.filter(t => t.type === 'color');

    // Check for text/background color pairs
    const textColors = colorTokens.filter(t =>
      t.name.includes('text') || t.name.includes('fg') || t.name.includes('foreground')
    );
    const bgColors = colorTokens.filter(t =>
      t.name.includes('bg') || t.name.includes('background')
    );

    // Check common combinations
    textColors.forEach(textToken => {
      bgColors.forEach(bgToken => {
        if (typeof textToken.value === 'string' && typeof bgToken.value === 'string') {
          const contrast = this.calculateContrastRatio(textToken.value, bgToken.value);

          if (contrast < 4.5) {
            issues.push({
              category: 'accessibility',
              severity: 'critical',
              description: `Poor contrast between "${textToken.name}" and "${bgToken.name}": ${contrast.toFixed(2)}:1 (needs 4.5:1 for text)`,
              tokens: [textToken.name, bgToken.name],
              files: [textToken.file, bgToken.file],
              suggestion: 'Increase color contrast to meet WCAG AA standards'
            });
          }
        }
      });
    });

    return issues;
  }

  /**
   * Calculate WCAG contrast ratio between two colors
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   */
  private getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}
