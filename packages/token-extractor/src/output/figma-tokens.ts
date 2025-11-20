import type { TokenSet, ExtractedToken, TokenType } from '../types/tokens';
import type { FigmaTokensJSON, FigmaToken } from '../types/figma-tokens';
import { validateFigmaTokensJSON } from '../types/figma-tokens';

/**
 * Generates Figma Tokens Plugin JSON v2 format from extracted tokens
 */
export class FigmaTokensGenerator {
  /**
   * Transform TokenSet to Figma Tokens JSON v2 format
   */
  public generate(tokenSet: TokenSet): FigmaTokensJSON {
    if (tokenSet.tokens.length === 0) {
      return {};
    }

    const result: FigmaTokensJSON = {};

    // Group tokens by category
    const grouped = this.groupByCategory(tokenSet.tokens);

    // Transform each category
    for (const [category, tokens] of Object.entries(grouped)) {
      result[category] = this.buildHierarchy(tokens);
    }

    // Validate output against schema
    validateFigmaTokensJSON(result);

    return result;
  }

  /**
   * Group tokens by their type (category)
   */
  private groupByCategory(tokens: ExtractedToken[]): Record<string, ExtractedToken[]> {
    const grouped: Record<string, ExtractedToken[]> = {};

    for (const token of tokens) {
      const category = this.getCategoryFromType(token.type);

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push(token);
    }

    return grouped;
  }

  /**
   * Map token type to Figma Tokens category
   */
  private getCategoryFromType(type: TokenType): string {
    // Map composite types to their base category
    const typeMap: Record<TokenType, string> = {
      color: 'colors',
      spacing: 'spacing',
      sizing: 'sizing',
      borderRadius: 'borderRadius',
      typography: 'typography',
      fontFamily: 'fontFamily',
      fontSize: 'fontSize',
      lineHeight: 'lineHeight',
      fontWeight: 'fontWeight',
      letterSpacing: 'letterSpacing',
      effect: 'effect',
      boxShadow: 'boxShadow',
      opacity: 'opacity',
      breakpoint: 'breakpoint',
      zIndex: 'zIndex'
    };

    return typeMap[type] || type;
  }

  /**
   * Build hierarchical structure from token names
   */
  private buildHierarchy(tokens: ExtractedToken[]): any {
    const hierarchy: any = {};

    for (const token of tokens) {
      const parts = this.parseTokenName(token.name);
      this.setNestedValue(hierarchy, parts, this.createFigmaToken(token));
    }

    return hierarchy;
  }

  /**
   * Parse token name into hierarchical parts
   * Handles different naming conventions:
   * - "primary-500" -> ["primary", "500"]
   * - "spacing-md" -> ["md"]
   * - "colors.brand.primary" -> ["brand", "primary"]
   * - "color_primary_500" -> ["primary", "500"]
   */
  private parseTokenName(name: string): string[] {
    // If name contains dots, use dot notation
    if (name.includes('.')) {
      const parts = name.split('.');
      // Remove category prefix if present (e.g., "colors.brand.primary" -> ["brand", "primary"])
      const categoryPrefixes = ['colors', 'spacing', 'sizing', 'borderRadius',
        'typography', 'fontFamily', 'fontSize', 'lineHeight', 'fontWeight',
        'letterSpacing', 'effect', 'boxShadow', 'opacity', 'breakpoint', 'zIndex'];

      if (categoryPrefixes.includes(parts[0])) {
        return parts.slice(1);
      }
      return parts;
    }

    // Replace underscores with dashes for consistency
    const normalized = name.replace(/_/g, '-');

    // Split by dash
    const parts = normalized.split('-');

    // Remove category prefix if present
    // More comprehensive list to match category names
    const categoryPrefixes = ['color', 'colors', 'spacing', 'size', 'sizing',
      'radius', 'borderradius', 'border', 'font', 'fontfamily', 'fontsize',
      'lineheight', 'fontweight', 'letterSpacing', 'type', 'typography',
      'shadow', 'boxshadow', 'effect', 'opacity', 'breakpoint', 'z', 'zindex'];

    if (parts.length > 1 && categoryPrefixes.includes(parts[0].toLowerCase())) {
      return parts.slice(1);
    }

    return parts;
  }

  /**
   * Set value in nested object structure
   */
  private setNestedValue(obj: any, parts: string[], value: FigmaToken): void {
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!current[part]) {
        current[part] = {};
      }

      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }

  /**
   * Create Figma Token object from ExtractedToken
   */
  private createFigmaToken(token: ExtractedToken): FigmaToken {
    const figmaToken: FigmaToken = {
      value: token.value,
      type: this.mapTokenType(token.type)
    };

    // Add description from context if available
    if (token.context) {
      figmaToken.description = token.context;
    }

    return figmaToken;
  }

  /**
   * Map our token types to Figma Tokens types
   */
  private mapTokenType(type: TokenType): string {
    // Figma Tokens uses singular form for most types
    const typeMap: Record<TokenType, string> = {
      color: 'color',
      spacing: 'spacing',
      sizing: 'sizing',
      borderRadius: 'borderRadius',
      typography: 'typography',
      fontFamily: 'fontFamily',
      fontSize: 'fontSize',
      lineHeight: 'lineHeight',
      fontWeight: 'fontWeight',
      letterSpacing: 'letterSpacing',
      effect: 'effect',
      boxShadow: 'boxShadow',
      opacity: 'opacity',
      breakpoint: 'breakpoint',
      zIndex: 'number'  // zIndex is just a number in Figma Tokens
    };

    return typeMap[type] || type;
  }
}
