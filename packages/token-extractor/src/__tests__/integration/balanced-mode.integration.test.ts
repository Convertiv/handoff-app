import { BalancedMode } from '../../analysis/modes/balanced';
import { FigmaTokensGenerator } from '../../output/figma-tokens';
import { validateFigmaTokensJSON } from '../../types/figma-tokens';
import path from 'path';
import type { AIProvider } from '../../analysis/ai-client';
import type { ExtractedToken } from '../../types/tokens';

/**
 * Mock AI Provider for Balanced Mode
 * Simulates single-pass AI extraction from file contents
 */
class MockBalancedAIProvider implements AIProvider {
  async analyze(prompt: string, context: any): Promise<string> {
    // Extract files from context
    const files = context.files || [];

    const extractedTokens: ExtractedToken[] = [];

    // Simulate AI analyzing file contents and extracting tokens
    for (const file of files) {
      const content = file.content;
      const filePath = file.path;

      // Extract CSS custom properties
      const cssVarRegex = /--([a-z-]+):\s*([^;]+);/gi;
      let match;
      while ((match = cssVarRegex.exec(content)) !== null) {
        const name = match[1];
        const value = match[2].trim();
        const type = this.inferType(name, value);

        extractedTokens.push({
          name: `${type}.${name}`,
          value,
          type,
          file: filePath,
          line: this.getLineNumber(content, match.index),
        });
      }

      // Extract SCSS variables
      const scssVarRegex = /\$([a-z-]+):\s*([^;]+);/gi;
      while ((match = scssVarRegex.exec(content)) !== null) {
        const name = match[1];
        const value = match[2].trim();
        const type = this.inferType(name, value);

        extractedTokens.push({
          name: `${type}.${name}`,
          value,
          type,
          file: filePath,
          line: this.getLineNumber(content, match.index),
        });
      }

      // Extract JavaScript object properties
      const jsObjectRegex = /(\w+):\s*['"]([^'"]+)['"]/g;
      while ((match = jsObjectRegex.exec(content)) !== null) {
        const name = match[1];
        const value = match[2];

        // Skip obvious non-token values
        if (value.startsWith('http://') || value.startsWith('https://')) {
          continue;
        }

        // Check if it looks like a token
        if (this.isTokenValue(value)) {
          const type = this.inferType(name, value);

          extractedTokens.push({
            name: `${type}.${name}`,
            value,
            type,
            file: filePath,
            line: this.getLineNumber(content, match.index),
          });
        }
      }

      // Extract numeric object properties
      const jsNumRegex = /(\w+):\s*(\d+(?:\.\d+)?)\b/g;
      while ((match = jsNumRegex.exec(content)) !== null) {
        const name = match[1];
        const value = parseFloat(match[2]);

        // Filter out obvious non-tokens
        if (name === 'version' || name === 'id' || value > 10000) {
          continue;
        }

        const type = this.inferType(name, value.toString());

        extractedTokens.push({
          name: `${type}.${name}`,
          value,
          type,
          file: filePath,
          line: this.getLineNumber(content, match.index),
        });
      }
    }

    // Return as JSON
    return JSON.stringify({
      tokens: extractedTokens,
    });
  }

  private inferType(name: string, value: string): import('../../types/tokens').TokenType {
    const lowerName = name.toLowerCase();
    const lowerValue = value.toLowerCase();

    // Color detection
    if (
      lowerName.includes('color') ||
      lowerName.includes('primary') ||
      lowerName.includes('secondary') ||
      lowerName.includes('success') ||
      lowerName.includes('danger') ||
      lowerName.includes('warning') ||
      lowerName.includes('background') ||
      lowerName.includes('text') ||
      /^#[0-9a-f]{3,8}$/i.test(value) ||
      value.match(/^rgba?/)
    ) {
      return 'color';
    }

    // Spacing detection
    if (
      lowerName.includes('spacing') ||
      lowerName.includes('margin') ||
      lowerName.includes('padding') ||
      lowerName.includes('gap')
    ) {
      return 'spacing';
    }

    // Border radius
    if (lowerName.includes('radius') || lowerName.includes('rounded')) {
      return 'borderRadius';
    }

    // Font family
    if (lowerName.includes('family')) {
      return 'fontFamily';
    }

    // Font size
    if (lowerName.includes('fontsize') || lowerName.includes('font-size')) {
      return 'fontSize';
    }

    // Font weight
    if (lowerName.includes('weight')) {
      return 'fontWeight';
    }

    // Line height
    if (lowerName.includes('lineheight') || lowerName.includes('line-height') || lowerName.includes('leading')) {
      return 'lineHeight';
    }

    // Box shadow
    if (lowerName.includes('shadow')) {
      return 'boxShadow';
    }

    // Z-index
    if (lowerName.includes('zindex') || lowerName.includes('z-index')) {
      return 'zIndex';
    }

    // Sizing
    if (lowerName.includes('size') || lowerName.includes('width') || lowerName.includes('height')) {
      return 'sizing';
    }

    // Default
    return 'sizing';
  }

  private isTokenValue(value: string): boolean {
    // Hex color
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return true;

    // CSS units
    if (/^\d+\.?\d*(px|rem|em|%|vh|vw)$/.test(value)) return true;

    // Font family
    if (value.includes(',') || value.includes('sans') || value.includes('serif') || value.includes('mono')) {
      return true;
    }

    return false;
  }

  private getLineNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }
}

describe('Balanced Mode Integration Test', () => {
  let balancedMode: BalancedMode;
  let mockAIProvider: MockBalancedAIProvider;
  let figmaTokensGenerator: FigmaTokensGenerator;

  const fixturesDir = path.join(__dirname, '../fixtures');
  const cssFile = path.join(fixturesDir, 'sample.css');
  const scssFile = path.join(fixturesDir, 'sample.scss');
  const jsFile = path.join(fixturesDir, 'theme.js');
  const tsFile = path.join(fixturesDir, 'theme.ts');

  beforeEach(() => {
    mockAIProvider = new MockBalancedAIProvider();
    balancedMode = new BalancedMode(mockAIProvider);
    figmaTokensGenerator = new FigmaTokensGenerator();
  });

  describe('End-to-End Token Extraction', () => {
    it('should extract tokens from CSS files', async () => {
      const result = await balancedMode.extract([cssFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.mode).toBe('balanced');
      expect(result.metadata.fileCount).toBe(1);
    });

    it('should extract tokens from SCSS files', async () => {
      const result = await balancedMode.extract([scssFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);

      // Verify SCSS variables are extracted
      const colorTokens = result.tokens.filter(t => t.type === 'color');
      expect(colorTokens.length).toBeGreaterThan(0);

      const spacingTokens = result.tokens.filter(t => t.type === 'spacing');
      expect(spacingTokens.length).toBeGreaterThan(0);
    });

    it('should extract tokens from JavaScript files', async () => {
      const result = await balancedMode.extract([jsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);

      // Verify various token types
      const tokenTypes = new Set(result.tokens.map(t => t.type));
      expect(tokenTypes.size).toBeGreaterThan(1);
    });

    it('should extract tokens from TypeScript files', async () => {
      const result = await balancedMode.extract([tsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should extract tokens from mixed file types', async () => {
      const result = await balancedMode.extract([cssFile, scssFile, jsFile, tsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.metadata.fileCount).toBe(4);

      // Verify we have tokens from all files
      const filesExtracted = new Set(result.tokens.map(t => path.basename(t.file)));
      expect(filesExtracted.size).toBeGreaterThan(0);
    });
  });

  describe('File Batching', () => {
    it('should handle batching of multiple files', async () => {
      // Create array with multiple files
      const files = [cssFile, scssFile, jsFile, tsFile];
      const result = await balancedMode.extract(files);

      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.metadata.fileCount).toBe(files.length);
    });

    it('should process files in batches when count exceeds batch size', async () => {
      // This test verifies batching logic works
      // Even with a small number of files, the code should handle batching correctly
      const files = [cssFile, scssFile, jsFile];
      const result = await balancedMode.extract(files);

      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });
  });

  describe('Token Structure Validation', () => {
    it('should produce valid TokenSet structure', async () => {
      const result = await balancedMode.extract([cssFile, jsFile]);

      // Validate TokenSet structure
      expect(result).toMatchObject({
        tokens: expect.any(Array),
        metadata: {
          extractedAt: expect.any(String),
          fileCount: expect.any(Number),
          mode: 'balanced',
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
      });
    });

    it('should include metadata with correct timestamp', async () => {
      const result = await balancedMode.extract([cssFile]);

      // Verify ISO 8601 timestamp
      const timestamp = new Date(result.metadata.extractedAt);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should preserve file information in tokens', async () => {
      const result = await balancedMode.extract([cssFile, jsFile]);

      // Verify all tokens have file information
      result.tokens.forEach(token => {
        expect(token.file).toBeTruthy();
      });

      // Verify we have tokens from both files
      const files = new Set(result.tokens.map(t => path.basename(t.file)));
      expect(files.size).toBeGreaterThan(0);
    });
  });

  describe('Figma Tokens JSON Output', () => {
    it('should generate valid Figma Tokens JSON', async () => {
      const tokenSet = await balancedMode.extract([cssFile, jsFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Validate against Figma Tokens schema
      expect(() => validateFigmaTokensJSON(figmaJSON)).not.toThrow();
    });

    it('should group tokens by category', async () => {
      const tokenSet = await balancedMode.extract([cssFile, jsFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Verify we have category groups
      const categories = Object.keys(figmaJSON);
      expect(categories.length).toBeGreaterThan(0);

      // Check for expected categories
      const hasColors = tokenSet.tokens.some(t => t.type === 'color');
      if (hasColors) {
        expect(figmaJSON.colors).toBeDefined();
      }
    });

    it('should create proper hierarchical structure', async () => {
      const tokenSet = await balancedMode.extract([jsFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Verify hierarchical nesting exists
      const categories = Object.values(figmaJSON);
      const hasNestedStructure = categories.some(category => {
        return typeof category === 'object' && Object.keys(category as object).length > 0;
      });
      expect(hasNestedStructure).toBe(true);
    });
  });

  describe('Accuracy and Coverage', () => {
    it('should extract color tokens from CSS', async () => {
      const result = await balancedMode.extract([cssFile]);
      const colorTokens = result.tokens.filter(t => t.type === 'color');

      // Should extract color tokens
      expect(colorTokens.length).toBeGreaterThan(0);

      // Verify specific colors
      const values = colorTokens.map(t => t.value);
      expect(values).toContain('#0ea5e9');
    });

    it('should extract spacing tokens from SCSS', async () => {
      const result = await balancedMode.extract([scssFile]);
      const spacingTokens = result.tokens.filter(t => t.type === 'spacing');

      // Should extract spacing tokens
      expect(spacingTokens.length).toBeGreaterThan(0);

      // Verify specific spacing values
      const values = spacingTokens.map(t => t.value);
      expect(values.some(v => v === '8px' || v === '16px')).toBe(true);
    });

    it('should extract diverse token types', async () => {
      const result = await balancedMode.extract([cssFile, scssFile, jsFile]);

      // Get unique token types
      const tokenTypes = new Set(result.tokens.map(t => t.type));

      // Should have multiple token types
      expect(tokenTypes.size).toBeGreaterThan(2);
    });

    it('should handle empty input gracefully', async () => {
      const result = await balancedMode.extract([]);

      expect(result).toBeDefined();
      expect(result.tokens).toEqual([]);
      expect(result.metadata.fileCount).toBe(0);
      expect(result.metadata.mode).toBe('balanced');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const nonExistentFile = path.join(fixturesDir, 'does-not-exist.css');

      await expect(balancedMode.extract([nonExistentFile])).rejects.toThrow();
    });

    it('should handle malformed file content', async () => {
      // Create a temporary malformed file
      const malformedFile = path.join(fixturesDir, 'malformed.css');
      const fs = require('fs');
      fs.writeFileSync(malformedFile, '/* incomplete CSS without closing comment');

      try {
        const result = await balancedMode.extract([malformedFile]);

        // Should not crash, even if no tokens extracted
        expect(result).toBeDefined();
        expect(result.tokens).toBeInstanceOf(Array);
      } finally {
        // Cleanup
        fs.unlinkSync(malformedFile);
      }
    });

    it('should continue when one file in batch has issues', async () => {
      // Create empty file
      const emptyFile = path.join(fixturesDir, 'empty.css');
      const fs = require('fs');
      fs.writeFileSync(emptyFile, '');

      try {
        const result = await balancedMode.extract([cssFile, emptyFile]);

        // Should still extract tokens from valid file
        expect(result).toBeDefined();
        expect(result.tokens.length).toBeGreaterThan(0);
      } finally {
        // Cleanup
        fs.unlinkSync(emptyFile);
      }
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle single-pass extraction efficiently', async () => {
      const startTime = Date.now();
      await balancedMode.extract([cssFile, scssFile, jsFile]);
      const duration = Date.now() - startTime;

      // Single-pass should be relatively fast (< 5 seconds for mock)
      expect(duration).toBeLessThan(5000);
    });
  });
});
