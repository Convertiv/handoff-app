import { parse } from '@babel/parser';
import * as fs from 'fs';
import type { ExtractedToken, TokenType } from '../../types/tokens';

interface ParsedNode {
  type: string;
  [key: string]: any;
}

interface PropertyNode {
  type: string;
  key: ParsedNode;
  value: ParsedNode;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

interface ObjectExpressionNode {
  type: 'ObjectExpression';
  properties: PropertyNode[];
}

/**
 * BabelParser - Extracts design tokens from JavaScript/TypeScript theme objects
 *
 * Handles:
 * - const theme = { colors: { primary: '#0ea5e9' } }
 * - styled-components ThemeProvider patterns
 * - Multiple export patterns
 * - Nested object properties for color palettes
 */
export class BabelParser {
  /**
   * Parse a JavaScript/TypeScript file and extract design tokens
   */
  async parse(filePath: string): Promise<ExtractedToken[]> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const tokens: ExtractedToken[] = [];

    try {
      // Parse with Babel (supports both JS and TS)
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      });

      // Traverse AST and extract tokens
      this.traverseNode(ast, [], filePath, tokens);

      return tokens;
    } catch (error) {
      throw new Error(`Failed to parse ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Recursively traverse AST nodes to find token definitions
   */
  private traverseNode(
    node: ParsedNode,
    path: string[],
    filePath: string,
    tokens: ExtractedToken[]
  ): void {
    if (!node || typeof node !== 'object') return;

    // Handle File node (root of Babel AST)
    if (node.type === 'File' && node.program) {
      this.traverseNode(node.program, path, filePath, tokens);
      return;
    }

    // Handle Program node
    if (node.type === 'Program' && node.body) {
      for (const child of node.body) {
        this.traverseNode(child, path, filePath, tokens);
      }
      return;
    }

    // Handle variable declarations: const theme = { ... }
    if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations || []) {
        if (declaration.id?.name && declaration.init?.type === 'ObjectExpression') {
          const varName = declaration.id.name;
          this.extractFromObject(
            declaration.init as ObjectExpressionNode,
            [varName],
            filePath,
            tokens,
            varName
          );
        }
      }
      return;
    }

    // Handle export declarations: export const theme = { ... }
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      this.traverseNode(node.declaration, path, filePath, tokens);
      return;
    }

    // Handle default exports: export default { ... }
    if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
      if (node.declaration.type === 'ObjectExpression') {
        this.extractFromObject(
          node.declaration as ObjectExpressionNode,
          ['theme'],
          filePath,
          tokens,
          'theme'
        );
      }
      return;
    }
  }

  /**
   * Extract tokens from an object expression
   */
  private extractFromObject(
    objectNode: ObjectExpressionNode,
    path: string[],
    filePath: string,
    tokens: ExtractedToken[],
    context: string
  ): void {
    for (const prop of objectNode.properties) {
      if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') continue;

      const keyName = this.getKeyName(prop.key);
      if (!keyName) continue;

      const currentPath = [...path, keyName];

      // If value is an object, recurse
      if (prop.value.type === 'ObjectExpression') {
        this.extractFromObject(prop.value as ObjectExpressionNode, currentPath, filePath, tokens, context);
      }
      // If value is a primitive, check if it's a token
      else {
        const value = this.extractValue(prop.value);
        if (value !== null && this.isTokenValue(value, currentPath)) {
          const tokenType = this.inferTokenType(currentPath, value);
          const line = prop.loc?.start.line;

          tokens.push({
            name: currentPath.join('.'),
            value,
            type: tokenType,
            file: filePath,
            line,
            context
          });
        }
      }
    }
  }

  /**
   * Get the key name from a node
   */
  private getKeyName(keyNode: ParsedNode): string | null {
    if (keyNode.type === 'Identifier') {
      return keyNode.name;
    }
    if (keyNode.type === 'StringLiteral') {
      return keyNode.value;
    }
    if (keyNode.type === 'NumericLiteral') {
      return String(keyNode.value);
    }
    return null;
  }

  /**
   * Extract primitive value from a node
   */
  private extractValue(valueNode: ParsedNode): string | number | null {
    if (valueNode.type === 'StringLiteral') {
      return valueNode.value;
    }
    if (valueNode.type === 'NumericLiteral') {
      return valueNode.value;
    }
    if (valueNode.type === 'TemplateLiteral' && valueNode.quasis?.length === 1) {
      return valueNode.quasis[0].value.cooked;
    }
    return null;
  }

  /**
   * Determine if a value is a design token (vs config/data)
   */
  private isTokenValue(value: string | number, path: string[]): boolean {
    // Filter out obvious non-token properties
    const nonTokenKeys = ['apiUrl', 'api', 'url', 'endpoint', 'debug', 'enabled', 'timeout', 'version'];
    const lastKey = path[path.length - 1]?.toLowerCase() || '';

    if (nonTokenKeys.some(key => lastKey.includes(key))) {
      return false;
    }

    // URL patterns
    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
      return false;
    }

    // Boolean values stored as strings
    if (value === 'true' || value === 'false') {
      return false;
    }

    // Check if it looks like a design token
    const valueStr = String(value);

    // Color hex codes
    if (/^#[0-9a-fA-F]{3,8}$/.test(valueStr)) return true;

    // CSS units (px, rem, em, %, etc.)
    if (/^\d+\.?\d*(px|rem|em|%|vh|vw|vmin|vmax)$/.test(valueStr)) return true;

    // Numbers that could be line heights, font weights, opacity
    if (typeof value === 'number' && value > 0 && value < 2000) {
      // Could be line height (1.5), font weight (400), opacity (0.5)
      return true;
    }

    // Font families
    if (typeof value === 'string' && /font/i.test(path.join('.'))) {
      return true;
    }

    return false;
  }

  /**
   * Infer token type from path and value
   */
  private inferTokenType(path: string[], value: string | number): TokenType {
    const pathStr = path.join('.').toLowerCase();
    const valueStr = String(value);

    // Border radius detection (check before color to avoid misidentification)
    if (pathStr.includes('radius') || pathStr.includes('rounded')) {
      return 'borderRadius';
    }

    // Spacing detection (check before color)
    if (
      pathStr.includes('spacing') ||
      pathStr.includes('margin') ||
      pathStr.includes('padding') ||
      pathStr.includes('gap')
    ) {
      return 'spacing';
    }

    // Color detection
    if (
      pathStr.includes('color') ||
      pathStr.includes('background') ||
      pathStr.includes('foreground') ||
      pathStr.includes('text') ||
      /^#[0-9a-fA-F]{3,8}$/.test(valueStr)
    ) {
      // But not if path contains border (unless it's borderColor specifically)
      if (pathStr.includes('border') && !pathStr.includes('bordercolor')) {
        return 'borderRadius'; // Likely border radius, not color
      }
      return 'color';
    }

    // Typography sub-types
    if (pathStr.includes('fontfamily') || pathStr.includes('font-family')) {
      return 'fontFamily';
    }
    if (pathStr.includes('fontsize') || pathStr.includes('font-size')) {
      return 'fontSize';
    }
    if (pathStr.includes('lineheight') || pathStr.includes('line-height')) {
      return 'lineHeight';
    }
    if (pathStr.includes('fontweight') || pathStr.includes('font-weight')) {
      return 'fontWeight';
    }
    if (pathStr.includes('letterspacing') || pathStr.includes('letter-spacing')) {
      return 'letterSpacing';
    }

    // Generic typography
    if (
      pathStr.includes('font') ||
      pathStr.includes('typography') ||
      pathStr.includes('text')
    ) {
      return 'typography';
    }

    // Sizing detection
    if (
      pathStr.includes('size') ||
      pathStr.includes('width') ||
      pathStr.includes('height')
    ) {
      return 'sizing';
    }

    // Shadow/effect detection
    if (pathStr.includes('shadow') || pathStr.includes('elevation')) {
      return 'boxShadow';
    }

    // Opacity detection
    if (pathStr.includes('opacity') || pathStr.includes('alpha')) {
      return 'opacity';
    }

    // Z-index detection
    if (pathStr.includes('zindex') || pathStr.includes('z-index') || pathStr.includes('layer')) {
      return 'zIndex';
    }

    // Breakpoint detection
    if (pathStr.includes('breakpoint') || pathStr.includes('screen')) {
      return 'breakpoint';
    }

    // Default fallback based on value pattern
    if (/^#[0-9a-fA-F]{3,8}$/.test(valueStr)) {
      return 'color';
    }

    return 'sizing'; // Generic fallback
  }
}
