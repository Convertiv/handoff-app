import type { TokenSet, ExtractedToken, TokenType } from '../types/tokens';

export class ReportGenerator {
  private tokenSet: TokenSet;

  constructor(tokenSet: TokenSet) {
    this.tokenSet = tokenSet;
  }

  /**
   * Generate complete markdown report
   */
  public generate(): string {
    const sections = [
      this.generateHeader(),
      this.generateSummary(),
      this.generateBreakdown(),
      this.generateRecommendations(),
      this.generateNextSteps()
    ];

    return sections.join('\n\n');
  }

  /**
   * Get breakdown of tokens by category
   */
  public getCategoryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const token of this.tokenSet.tokens) {
      breakdown[token.type] = (breakdown[token.type] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Find duplicate values across tokens
   */
  public findDuplicateValues(): Map<string | number, ExtractedToken[]> {
    const valueMap = new Map<string | number, ExtractedToken[]>();

    for (const token of this.tokenSet.tokens) {
      const key = token.value;
      if (!valueMap.has(key)) {
        valueMap.set(key, []);
      }
      valueMap.get(key)!.push(token);
    }

    // Filter to only duplicates (more than 1 token with same value)
    const duplicates = new Map<string | number, ExtractedToken[]>();
    for (const [value, tokens] of valueMap.entries()) {
      if (tokens.length > 1) {
        duplicates.set(value, tokens);
      }
    }

    return duplicates;
  }

  private generateHeader(): string {
    return '# Token Extraction Report';
  }

  private generateSummary(): string {
    const { tokens, metadata } = this.tokenSet;
    const duplicates = this.findDuplicateValues();
    const categoryCount = Object.keys(this.getCategoryBreakdown()).length;

    const lines = [
      '## Summary',
      `✓ Extracted ${tokens.length} tokens across ${categoryCount} categories`,
    ];

    if (duplicates.size > 0) {
      const duplicateCount = duplicates.size;
      lines.push(`✓ Found ${duplicateCount} duplicate value${duplicateCount !== 1 ? 's' : ''} (can be consolidated)`);
    }

    lines.push('');
    lines.push(`**Extracted at:** ${new Date(metadata.extractedAt).toLocaleString()}`);

    if (metadata.mode) {
      lines.push(`**Mode:** ${metadata.mode}`);
    }

    if (metadata.framework) {
      lines.push(`**Framework:** ${metadata.framework}`);
    }

    lines.push(`**Files analyzed:** ${metadata.fileCount}`);

    if (metadata.lineCount) {
      lines.push(`**Lines of code:** ${metadata.lineCount.toLocaleString()}`);
    }

    return lines.join('\n');
  }

  private generateBreakdown(): string {
    const breakdown = this.getCategoryBreakdown();
    const lines = ['## Breakdown'];

    if (Object.keys(breakdown).length === 0) {
      lines.push('No tokens extracted.');
      return lines.join('\n');
    }

    // Sort categories by count (descending)
    const sortedCategories = Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a);

    for (const [category, count] of sortedCategories) {
      const displayName = this.formatCategoryName(category);
      lines.push(`- **${displayName}:** ${count} token${count !== 1 ? 's' : ''}`);
    }

    return lines.join('\n');
  }

  private generateRecommendations(): string {
    const lines = ['## Recommendations'];
    const duplicates = this.findDuplicateValues();
    const breakdown = this.getCategoryBreakdown();
    const recommendations: string[] = [];

    // Check for duplicate values
    if (duplicates.size > 0) {
      recommendations.push(
        `- **Consolidate duplicate values:** Found ${duplicates.size} unique value${duplicates.size !== 1 ? 's' : ''} used by multiple tokens. Consider using token aliases to reduce duplication.`
      );
    }

    // Check for small token sets
    if (this.tokenSet.tokens.length < 10) {
      recommendations.push(
        '- **Expand token coverage:** The token set is relatively small. Consider adding more tokens for consistency across your design system.'
      );
    }

    // Check for missing common categories
    const commonCategories: TokenType[] = ['color', 'spacing', 'fontSize', 'fontFamily'];
    const missingCategories = commonCategories.filter(cat => !breakdown[cat]);

    if (missingCategories.length > 0) {
      const missing = missingCategories.map(c => this.formatCategoryName(c)).join(', ');
      recommendations.push(
        `- **Add missing token categories:** Consider defining tokens for: ${missing}`
      );
    }

    // Check for color tokens
    if (breakdown.color && breakdown.color > 0) {
      recommendations.push(
        '- **Organize color palettes:** Group color tokens into semantic palettes (e.g., primary, secondary, neutral) for better maintainability.'
      );
    }

    // Check for spacing tokens
    if (breakdown.spacing && breakdown.spacing > 2) {
      recommendations.push(
        '- **Verify spacing scale:** Ensure your spacing tokens follow a consistent scale (e.g., 4px, 8px, 16px, 24px, 32px).'
      );
    }

    // Typography recommendations
    const typographyTypes: TokenType[] = ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing', 'fontFamily'];
    const hasTypography = typographyTypes.some(type => breakdown[type]);

    if (hasTypography) {
      recommendations.push(
        '- **Create typography compositions:** Consider grouping font size, line height, and letter spacing into typography scale tokens.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('- No immediate recommendations. Your token set looks good!');
    }

    lines.push(...recommendations);
    return lines.join('\n');
  }

  private generateNextSteps(): string {
    const lines = [
      '## Next Steps',
      '',
      '### Import into Figma Tokens Plugin',
      '',
      '1. **Install the plugin:**',
      '   - Open Figma',
      '   - Go to Plugins → Browse plugins in Community',
      '   - Search for "Figma Tokens" and install',
      '',
      '2. **Import your tokens:**',
      '   - Open the Figma Tokens plugin',
      '   - Click on the settings icon',
      '   - Select "Import" → "Load from JSON"',
      '   - Upload the generated `figma-tokens.json` file',
      '',
      '3. **Apply to your designs:**',
      '   - Select any element in Figma',
      '   - Use the plugin to apply tokens',
      '   - Tokens will update automatically when changed',
      '',
      '### Review and Refine',
      '',
      '- **Check token names:** Ensure names follow your naming convention',
      '- **Organize hierarchically:** Group related tokens (e.g., `color.primary.500`)',
      '- **Create aliases:** Use token references for related values',
      '- **Test thoroughly:** Apply tokens to various components to verify correctness',
      '',
      '### Maintain Your Tokens',
      '',
      '- **Version control:** Store `figma-tokens.json` in your repository',
      '- **Sync regularly:** Re-run extraction when design tokens change in code',
      '- **Document usage:** Add comments to describe token purposes and use cases'
    ];

    return lines.join('\n');
  }

  private formatCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
      color: 'Colors',
      spacing: 'Spacing',
      sizing: 'Sizing',
      borderRadius: 'Border Radius',
      typography: 'Typography',
      fontFamily: 'Font Family',
      fontSize: 'Font Size',
      lineHeight: 'Line Height',
      fontWeight: 'Font Weight',
      letterSpacing: 'Letter Spacing',
      effect: 'Effects',
      boxShadow: 'Box Shadow',
      opacity: 'Opacity',
      breakpoint: 'Breakpoints',
      zIndex: 'Z-Index'
    };

    return categoryNames[category] || category;
  }
}
