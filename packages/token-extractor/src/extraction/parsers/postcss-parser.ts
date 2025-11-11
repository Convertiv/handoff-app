import postcss, { Root, Declaration, Rule } from 'postcss';
import postcssScss from 'postcss-scss';
import * as fs from 'fs';
import type { ExtractedToken, TokenSet, TokenType } from '../../types/tokens';

export class PostCSSParser {
  /**
   * Parse a single CSS/SCSS file and extract tokens
   */
  async parseFile(filePath: string): Promise<ExtractedToken[]> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const isSCSS = filePath.endsWith('.scss') || filePath.endsWith('.sass');

    // Parse with appropriate syntax
    const root = isSCSS
      ? postcss().process(content, {
          from: filePath,
          syntax: postcssScss
        }).root
      : postcss.parse(content, { from: filePath });

    const tokens: ExtractedToken[] = [];

    // Extract tokens from the AST
    root.walkDecls((decl: Declaration) => {
      const prop = decl.prop;
      const value = decl.value.trim();
      const line = decl.source?.start?.line || 0;

      // Extract CSS custom properties (--variable-name)
      if (prop.startsWith('--')) {
        const token = this.createToken(prop, value, filePath, line);
        if (token) {
          tokens.push(token);
        }
      }
      // Extract SCSS variables ($variable-name)
      else if (prop.startsWith('$')) {
        const token = this.createToken(prop, value, filePath, line);
        if (token) {
          tokens.push(token);
        }
      }
      // Extract inline color and spacing values from regular properties
      else {
        const inlineTokens = this.extractInlineTokens(prop, value, filePath, line);
        tokens.push(...inlineTokens);
      }
    });

    return tokens;
  }

  /**
   * Parse multiple files and return a TokenSet
   */
  async parseFiles(filePaths: string[]): Promise<TokenSet> {
    const allTokens: ExtractedToken[] = [];
    let totalLines = 0;

    for (const filePath of filePaths) {
      const tokens = await this.parseFile(filePath);
      allTokens.push(...tokens);

      // Count lines in file
      const content = await fs.promises.readFile(filePath, 'utf-8');
      totalLines += content.split('\n').length;
    }

    return {
      tokens: allTokens,
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: filePaths.length,
        lineCount: totalLines
      }
    };
  }

  /**
   * Create a token from a CSS/SCSS variable declaration
   */
  private createToken(
    name: string,
    value: string,
    file: string,
    line: number
  ): ExtractedToken | null {
    const type = this.classifyTokenType(name, value);

    if (!type) {
      return null;
    }

    return {
      name,
      value,
      type,
      file,
      line
    };
  }

  /**
   * Extract inline color and spacing values from CSS properties
   */
  private extractInlineTokens(
    prop: string,
    value: string,
    file: string,
    line: number
  ): ExtractedToken[] {
    const tokens: ExtractedToken[] = [];

    // Extract hex colors
    const hexColors = value.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hexColors) {
      hexColors.forEach((color, index) => {
        tokens.push({
          name: `${prop}-color-${index}`,
          value: color.toLowerCase(),
          type: 'color',
          file,
          line,
          context: `Inline value from ${prop}`
        });
      });
    }

    // Extract spacing values (px, rem, em)
    const spacingPattern = /\b(\d+(?:\.\d+)?)(px|rem|em)\b/g;
    const spacingMatches = [...value.matchAll(spacingPattern)];

    if (spacingMatches.length > 0 && this.isSpacingProperty(prop)) {
      spacingMatches.forEach((match, index) => {
        const fullValue = match[0];
        tokens.push({
          name: `${prop}-spacing-${index}`,
          value: fullValue,
          type: 'spacing',
          file,
          line,
          context: `Inline value from ${prop}`
        });
      });
    }

    return tokens;
  }

  /**
   * Classify token type based on variable name and value
   */
  private classifyTokenType(name: string, value: string): TokenType | null {
    const lowerName = name.toLowerCase();
    const lowerValue = value.toLowerCase();

    // Color detection
    if (
      lowerName.includes('color') ||
      lowerName.includes('bg') ||
      lowerName.includes('background') ||
      lowerName.includes('border-color') ||
      lowerName.includes('text-color') ||
      lowerName.includes('primary') ||
      lowerName.includes('secondary') ||
      lowerName.includes('success') ||
      lowerName.includes('danger') ||
      lowerName.includes('warning') ||
      lowerName.includes('error') ||
      lowerName.includes('info') ||
      value.match(/^#[0-9a-fA-F]{3,8}$/) ||
      value.match(/^rgba?\(/)
    ) {
      return 'color';
    }

    // Spacing detection
    if (
      (lowerName.includes('spacing') ||
      lowerName.includes('margin') ||
      lowerName.includes('padding') ||
      lowerName.includes('gap') ||
      lowerName.includes('space')) &&
      (lowerValue.match(/\d+(px|rem|em)$/) || !isNaN(Number(value)))
    ) {
      return 'spacing';
    }

    // Font family
    if (lowerName.includes('font-family') || lowerName.includes('font') && value.includes(',')) {
      return 'fontFamily';
    }

    // Font size
    if (
      lowerName.includes('font-size') ||
      (lowerName.includes('font') && lowerName.includes('size')) ||
      (lowerName.includes('text') && lowerName.includes('size'))
    ) {
      return 'fontSize';
    }

    // Font weight
    if (
      lowerName.includes('font-weight') ||
      lowerName.includes('weight')
    ) {
      return 'fontWeight';
    }

    // Line height
    if (lowerName.includes('line-height') || lowerName.includes('leading')) {
      return 'lineHeight';
    }

    // Letter spacing
    if (lowerName.includes('letter-spacing') || lowerName.includes('tracking')) {
      return 'letterSpacing';
    }

    // Border radius
    if (
      lowerName.includes('radius') ||
      lowerName.includes('rounded')
    ) {
      return 'borderRadius';
    }

    // Box shadow
    if (lowerName.includes('shadow')) {
      return 'boxShadow';
    }

    // Opacity
    if (lowerName.includes('opacity') || lowerName.includes('alpha')) {
      return 'opacity';
    }

    // Z-index
    if (lowerName.includes('z-index') || lowerName.includes('zindex')) {
      return 'zIndex';
    }

    // Sizing
    if (
      lowerName.includes('width') ||
      lowerName.includes('height') ||
      lowerName.includes('size')
    ) {
      return 'sizing';
    }

    // Breakpoint
    if (lowerName.includes('breakpoint') || lowerName.includes('screen')) {
      return 'breakpoint';
    }

    // If we can't classify, return null
    return null;
  }

  /**
   * Check if a CSS property is spacing-related
   */
  private isSpacingProperty(prop: string): boolean {
    const spacingProps = [
      'margin',
      'padding',
      'gap',
      'row-gap',
      'column-gap',
      'top',
      'right',
      'bottom',
      'left',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left'
    ];

    return spacingProps.some(sp => prop.toLowerCase().includes(sp));
  }
}
