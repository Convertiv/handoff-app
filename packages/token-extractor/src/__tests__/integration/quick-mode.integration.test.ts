import { QuickMode } from '../../analysis/modes/quick';
import { PostCSSParser } from '../../extraction/parsers/postcss-parser';
import { BabelParser } from '../../extraction/parsers/babel-parser';
import { FigmaTokensGenerator } from '../../output/figma-tokens';
import { validateFigmaTokensJSON } from '../../types/figma-tokens';
import path from 'path';
import type { AIProvider } from '../../analysis/ai-client';
import type { ExtractedToken, TokenSet } from '../../types/tokens';

/**
 * Mock AI Provider for deterministic testing
 * Returns realistic, predictable responses for token refinement
 */
class MockAIProvider implements AIProvider {
  async analyze(prompt: string, context: any): Promise<string> {
    // Extract raw tokens from context
    const rawTokens = context.tokens || [];

    // Simulate AI refinement by grouping tokens by type and creating semantic names
    const refinedTokens: ExtractedToken[] = [];

    for (const token of rawTokens) {
      // Clean up token names to follow Figma Tokens conventions
      let semanticName = token.name;

      // Convert CSS custom properties and SCSS variables to semantic names
      if (semanticName.startsWith('--') || semanticName.startsWith('$')) {
        semanticName = semanticName.replace(/^(--)|(^\$)/, '');
      }

      // Prefix with token type category if not already present
      const typePrefix = this.getTypePrefix(token.type);
      if (!semanticName.startsWith(typePrefix)) {
        semanticName = `${typePrefix}.${semanticName}`;
      }

      refinedTokens.push({
        name: semanticName,
        value: token.value,
        type: token.type,
        file: token.file,
        line: token.line,
        context: token.context,
      });
    }

    // Return as JSON (simulating AI response)
    return JSON.stringify({
      tokens: refinedTokens,
      duplicates: [],
    });
  }

  private getTypePrefix(type: string): string {
    const prefixMap: Record<string, string> = {
      color: 'colors',
      spacing: 'spacing',
      sizing: 'sizing',
      borderRadius: 'borderRadius',
      fontSize: 'fontSize',
      fontFamily: 'fontFamily',
      fontWeight: 'fontWeight',
      lineHeight: 'lineHeight',
      letterSpacing: 'letterSpacing',
      boxShadow: 'boxShadow',
      opacity: 'opacity',
      zIndex: 'zIndex',
      breakpoint: 'breakpoint',
    };

    return prefixMap[type] || type;
  }
}

describe('Quick Mode Integration Test', () => {
  let quickMode: QuickMode;
  let mockAIProvider: MockAIProvider;
  let postCSSParser: PostCSSParser;
  let babelParser: BabelParser;
  let figmaTokensGenerator: FigmaTokensGenerator;

  const fixturesDir = path.join(__dirname, '../fixtures');
  const cssFile = path.join(fixturesDir, 'sample.css');
  const scssFile = path.join(fixturesDir, 'sample.scss');
  const jsFile = path.join(fixturesDir, 'theme.js');
  const tsFile = path.join(fixturesDir, 'theme.ts');

  beforeEach(() => {
    mockAIProvider = new MockAIProvider();
    postCSSParser = new PostCSSParser();
    babelParser = new BabelParser();
    quickMode = new QuickMode(mockAIProvider, postCSSParser, babelParser);
    figmaTokensGenerator = new FigmaTokensGenerator();
  });

  describe('End-to-End Token Extraction', () => {
    it('should extract tokens from CSS files', async () => {
      const result = await quickMode.extract([cssFile], []);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.mode).toBe('quick');
      expect(result.metadata.fileCount).toBe(1);
    });

    it('should extract tokens from SCSS files', async () => {
      const result = await quickMode.extract([scssFile], []);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);

      // Verify SCSS variables are extracted
      const colorTokens = result.tokens.filter(t => t.type === 'color');
      expect(colorTokens.length).toBeGreaterThan(0);

      const spacingTokens = result.tokens.filter(t => t.type === 'spacing');
      expect(spacingTokens.length).toBeGreaterThan(0);
    });

    it('should extract tokens from JavaScript theme files', async () => {
      const result = await quickMode.extract([], [jsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);

      // Verify JS theme object tokens are extracted
      const colorTokens = result.tokens.filter(t => t.type === 'color');
      expect(colorTokens.length).toBeGreaterThan(0);

      // Verify hierarchical token names from JS objects
      const hasHierarchicalNames = result.tokens.some(t => t.name.includes('.'));
      expect(hasHierarchicalNames).toBe(true);
    });

    it('should extract tokens from TypeScript theme files', async () => {
      const result = await quickMode.extract([], [tsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);

      // Verify TypeScript theme tokens are extracted
      const colorTokens = result.tokens.filter(t => t.type === 'color');
      expect(colorTokens.length).toBeGreaterThan(0);

      const spacingTokens = result.tokens.filter(t => t.type === 'spacing');
      expect(spacingTokens.length).toBeGreaterThan(0);
    });

    it('should extract tokens from mixed CSS and JS files', async () => {
      const result = await quickMode.extract([cssFile, scssFile], [jsFile, tsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.metadata.fileCount).toBe(4);

      // Verify we have tokens from all file types
      const filesExtracted = new Set(result.tokens.map(t => path.basename(t.file)));
      expect(filesExtracted.size).toBeGreaterThan(0);
    });
  });

  describe('Token Structure Validation', () => {
    it('should produce valid TokenSet structure', async () => {
      const result = await quickMode.extract([cssFile], [jsFile]);

      // Validate TokenSet structure
      expect(result).toMatchObject({
        tokens: expect.any(Array),
        metadata: {
          extractedAt: expect.any(String),
          fileCount: expect.any(Number),
          mode: 'quick',
        },
      });

      // Validate each token structure
      result.tokens.forEach(token => {
        expect(token).toMatchObject({
          name: expect.any(String),
          value: expect.anything(),
          type: expect.any(String),
          file: expect.any(String),
        });

        // Optional fields
        if (token.line !== undefined) {
          expect(typeof token.line).toBe('number');
        }
        if (token.context !== undefined) {
          expect(typeof token.context).toBe('string');
        }
      });
    });

    it('should include metadata with correct timestamp format', async () => {
      const result = await quickMode.extract([cssFile], []);

      // Verify ISO 8601 timestamp
      const timestamp = new Date(result.metadata.extractedAt);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should preserve file path and line number information', async () => {
      const result = await quickMode.extract([cssFile], []);

      // Verify all tokens have file information
      result.tokens.forEach(token => {
        expect(token.file).toBeTruthy();
        expect(token.file).toContain('sample.css');
      });

      // Most tokens should have line numbers (some might not from inline extraction)
      const tokensWithLines = result.tokens.filter(t => t.line !== undefined);
      expect(tokensWithLines.length).toBeGreaterThan(0);
    });
  });

  describe('Figma Tokens JSON Output', () => {
    it('should generate valid Figma Tokens JSON', async () => {
      const tokenSet = await quickMode.extract([cssFile], [jsFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Validate against Figma Tokens schema
      expect(() => validateFigmaTokensJSON(figmaJSON)).not.toThrow();
    });

    it('should group tokens by category in Figma JSON', async () => {
      const tokenSet = await quickMode.extract([cssFile], [jsFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Verify we have category groups
      const categories = Object.keys(figmaJSON);
      expect(categories.length).toBeGreaterThan(0);

      // Common categories should exist if tokens were extracted
      const hasColors = tokenSet.tokens.some(t => t.type === 'color');
      const hasSpacing = tokenSet.tokens.some(t => t.type === 'spacing');

      if (hasColors) {
        expect(figmaJSON.colors).toBeDefined();
      }
      if (hasSpacing) {
        expect(figmaJSON.spacing).toBeDefined();
      }
    });

    it('should create hierarchical structure in Figma JSON', async () => {
      const tokenSet = await quickMode.extract([], [jsFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Verify hierarchical nesting (e.g., colors.primary.500)
      if (figmaJSON.colors) {
        expect(typeof figmaJSON.colors).toBe('object');

        // Check for nested structures
        const hasNestedTokens = Object.values(figmaJSON.colors).some(value => {
          return typeof value === 'object' && !('value' in (value as any));
        });
        expect(hasNestedTokens).toBe(true);
      }
    });

    it('should include token metadata in Figma JSON', async () => {
      const tokenSet = await quickMode.extract([cssFile], []);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Find a token value in the output
      const findTokenValue = (obj: any): any => {
        for (const key in obj) {
          const value = obj[key];
          if (value && typeof value === 'object') {
            if ('value' in value && 'type' in value) {
              return value;
            }
            const nested = findTokenValue(value);
            if (nested) return nested;
          }
        }
        return null;
      };

      const tokenValue = findTokenValue(figmaJSON);
      expect(tokenValue).toBeDefined();
      expect(tokenValue.value).toBeDefined();
      expect(tokenValue.type).toBeDefined();
    });
  });

  describe('Accuracy and Coverage', () => {
    it('should extract all expected color tokens from CSS', async () => {
      const result = await quickMode.extract([cssFile], []);
      const colorTokens = result.tokens.filter(t => t.type === 'color');

      // CSS file has: primary, secondary, success, danger, warning (from :root)
      // Plus inline colors from .button and .card
      expect(colorTokens.length).toBeGreaterThanOrEqual(5);

      // Verify specific colors are extracted
      const values = colorTokens.map(t => t.value);
      expect(values).toContain('#0ea5e9');
      expect(values).toContain('#8b5cf6');
      expect(values).toContain('#10b981');
    });

    it('should extract all expected spacing tokens from SCSS', async () => {
      const result = await quickMode.extract([scssFile], []);
      const spacingTokens = result.tokens.filter(t => t.type === 'spacing');

      // SCSS file has: sm, md, lg, xl
      expect(spacingTokens.length).toBeGreaterThanOrEqual(4);

      // Verify specific spacing values
      const values = spacingTokens.map(t => t.value);
      expect(values).toContain('8px');
      expect(values).toContain('16px');
      expect(values).toContain('24px');
    });

    it('should extract hierarchical tokens from JS theme objects', async () => {
      const result = await quickMode.extract([], [jsFile]);

      // Verify hierarchical color tokens (e.g., primary.500)
      const primaryColorTokens = result.tokens.filter(t =>
        t.type === 'color' && t.name.includes('primary')
      );
      expect(primaryColorTokens.length).toBeGreaterThan(0);

      // Verify numeric property names are preserved
      const hasNumericKeys = result.tokens.some(t => /\.\d+$/.test(t.name));
      expect(hasNumericKeys).toBe(true);
    });

    it('should handle empty input gracefully', async () => {
      const result = await quickMode.extract([], []);

      expect(result).toBeDefined();
      expect(result.tokens).toEqual([]);
      expect(result.metadata.fileCount).toBe(0);
      expect(result.metadata.mode).toBe('quick');
    });

    it('should extract diverse token types', async () => {
      const result = await quickMode.extract([cssFile, scssFile], [jsFile]);

      // Get unique token types
      const tokenTypes = new Set(result.tokens.map(t => t.type));

      // Should have multiple token types
      expect(tokenTypes.size).toBeGreaterThan(3);

      // Verify specific types are present
      expect(tokenTypes.has('color')).toBe(true);
      expect(tokenTypes.has('spacing')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const nonExistentFile = path.join(fixturesDir, 'does-not-exist.css');

      await expect(quickMode.extract([nonExistentFile], [])).rejects.toThrow();
    });

    it('should continue processing valid files when one file is empty', async () => {
      // Create a temporary empty file
      const emptyFile = path.join(fixturesDir, 'empty.css');
      const fs = require('fs');
      fs.writeFileSync(emptyFile, '');

      try {
        const result = await quickMode.extract([cssFile, emptyFile], []);

        expect(result).toBeDefined();
        expect(result.tokens.length).toBeGreaterThan(0);
      } finally {
        // Cleanup
        fs.unlinkSync(emptyFile);
      }
    });
  });
});
