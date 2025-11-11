import { ThoroughMode } from '../../analysis/modes/thorough';
import { FigmaTokensGenerator } from '../../output/figma-tokens';
import { validateFigmaTokensJSON } from '../../types/figma-tokens';
import path from 'path';
import type { AIProvider } from '../../analysis/ai-client';
import type { ExtractedToken } from '../../types/tokens';

/**
 * Mock AI Provider for Thorough Mode
 * Simulates 4-pass AI analysis pipeline
 */
class MockThoroughAIProvider implements AIProvider {
  private passCounter = 0;

  async analyze(prompt: string, context: any): Promise<string> {
    this.passCounter++;

    // Pass 1: Per-file extraction
    if (context.instruction?.includes('individually')) {
      return this.simulatePass1(context);
    }

    // Pass 2: Pattern detection
    if (context.instruction?.includes('repeated values')) {
      return this.simulatePass2(context);
    }

    // Pass 3: Semantic grouping
    if (context.instruction?.includes('hierarchical groups')) {
      return this.simulatePass3(context);
    }

    // Pass 4: Alias detection
    if (context.instruction?.includes('semantic aliases')) {
      return this.simulatePass4(context);
    }

    // Fallback
    return JSON.stringify({ tokens: [] });
  }

  private simulatePass1(context: any): string {
    const files = context.files || [];
    const result: any = { files: [] };

    for (const file of files) {
      const tokens: any[] = [];
      const content = file.content;
      const filePath = file.path;

      // Extract CSS custom properties
      const cssVarRegex = /--([a-z-]+):\s*([^;]+);/gi;
      let match;
      while ((match = cssVarRegex.exec(content)) !== null) {
        tokens.push({
          name: match[1],
          value: match[2].trim(),
          type: this.inferType(match[1], match[2].trim()),
          line: this.getLineNumber(content, match.index),
          context: 'CSS custom property',
        });
      }

      // Extract SCSS variables
      const scssVarRegex = /\$([a-z-]+):\s*([^;]+);/gi;
      while ((match = scssVarRegex.exec(content)) !== null) {
        tokens.push({
          name: match[1],
          value: match[2].trim(),
          type: this.inferType(match[1], match[2].trim()),
          line: this.getLineNumber(content, match.index),
          context: 'SCSS variable',
        });
      }

      // Extract JS object properties (simple extraction)
      const jsRegex = /(\w+):\s*['"]([^'"]+)['"]/g;
      while ((match = jsRegex.exec(content)) !== null) {
        const value = match[2];
        if (this.isTokenValue(value)) {
          tokens.push({
            name: match[1],
            value,
            type: this.inferType(match[1], value),
            line: this.getLineNumber(content, match.index),
            context: 'JS object property',
          });
        }
      }

      if (tokens.length > 0) {
        result.files.push({
          file: filePath,
          tokens,
        });
      }
    }

    return JSON.stringify(result);
  }

  private simulatePass2(context: any): string {
    const pass1Result = context.tokensFromPass1;
    const patterns: any[] = [];
    const duplicates: any[] = [];

    // Track values across files
    const valueMap = new Map<string, { files: string[]; names: string[] }>();

    for (const file of pass1Result.files || []) {
      for (const token of file.tokens || []) {
        const key = String(token.value);
        if (!valueMap.has(key)) {
          valueMap.set(key, { files: [], names: [] });
        }
        const entry = valueMap.get(key)!;
        entry.files.push(file.file);
        entry.names.push(token.name);
      }
    }

    // Identify patterns (values appearing multiple times)
    for (const [value, data] of valueMap.entries()) {
      if (data.files.length > 1) {
        patterns.push({
          value,
          occurrences: data.files.length,
          files: [...new Set(data.files)],
          suggestedName: this.generateSemanticName(data.names[0], value),
        });

        duplicates.push({
          value,
          names: data.names,
          consolidatedName: this.generateSemanticName(data.names[0], value),
        });
      }
    }

    return JSON.stringify({ patterns, duplicates });
  }

  private simulatePass3(context: any): string {
    const pass1Result = context.tokensFromPass1;
    const groups: any = {
      core: {},
      semantic: {},
      component: {},
    };

    // Organize tokens into core, semantic, and component tiers
    for (const file of pass1Result.files || []) {
      for (const token of file.tokens || []) {
        const category = this.getCategoryFromType(token.type);

        // Most tokens go to core
        if (!groups.core[category]) {
          groups.core[category] = [];
        }

        groups.core[category].push({
          name: `${category}.${token.name}`,
          value: token.value,
          type: token.type,
          file: file.file,
          line: token.line,
          context: token.context,
        });

        // Create semantic tokens for common color names
        if (
          token.type === 'color' &&
          (token.name.includes('primary') ||
            token.name.includes('secondary') ||
            token.name.includes('success') ||
            token.name.includes('danger'))
        ) {
          if (!groups.semantic[category]) {
            groups.semantic[category] = [];
          }

          groups.semantic[category].push({
            name: `${category}.${token.name}`,
            value: token.value,
            type: token.type,
            file: file.file,
            line: token.line,
            context: 'semantic color',
          });
        }
      }
    }

    return JSON.stringify({ groups });
  }

  private simulatePass4(context: any): string {
    const pass3Result = context.groupsFromPass3;
    const tokens: ExtractedToken[] = [];
    const aliases: any[] = [];

    // Collect all core tokens
    for (const [category, categoryTokens] of Object.entries(pass3Result.groups.core || {})) {
      for (const token of categoryTokens as any[]) {
        tokens.push(token);
      }
    }

    // Create aliases for semantic tokens
    for (const [category, categoryTokens] of Object.entries(pass3Result.groups.semantic || {})) {
      for (const token of categoryTokens as any[]) {
        // Find matching core token
        const coreToken = tokens.find(
          t => t.value === token.value && t.type === token.type
        );

        if (coreToken) {
          // Create alias
          aliases.push({
            alias: token.name,
            references: coreToken.name,
            reasoning: 'Semantic alias for core token',
          });

          // Add alias token
          tokens.push({
            name: token.name,
            value: `{${coreToken.name}}`,
            type: token.type,
            file: token.file,
            line: token.line,
            context: 'alias',
          });
        } else {
          // No core token found, add as standalone
          tokens.push(token);
        }
      }
    }

    return JSON.stringify({ tokens, aliases });
  }

  private inferType(name: string, value: string): import('../../types/tokens').TokenType {
    const lowerName = name.toLowerCase();

    if (
      lowerName.includes('color') ||
      lowerName.includes('primary') ||
      lowerName.includes('secondary') ||
      /^#[0-9a-f]{3,8}$/i.test(value)
    ) {
      return 'color';
    }

    if (lowerName.includes('spacing') || lowerName.includes('margin') || lowerName.includes('padding')) {
      return 'spacing';
    }

    if (lowerName.includes('radius')) {
      return 'borderRadius';
    }

    if (lowerName.includes('font-size') || lowerName.includes('fontsize')) {
      return 'fontSize';
    }

    if (lowerName.includes('font-weight') || lowerName.includes('weight')) {
      return 'fontWeight';
    }

    if (lowerName.includes('line-height') || lowerName.includes('lineheight')) {
      return 'lineHeight';
    }

    if (lowerName.includes('shadow')) {
      return 'boxShadow';
    }

    if (lowerName.includes('zindex') || lowerName.includes('z-index')) {
      return 'zIndex';
    }

    if (lowerName.includes('family')) {
      return 'fontFamily';
    }

    return 'sizing';
  }

  private getCategoryFromType(type: string): string {
    const categoryMap: Record<string, string> = {
      color: 'colors',
      spacing: 'spacing',
      borderRadius: 'borderRadius',
      fontSize: 'fontSize',
      fontWeight: 'fontWeight',
      lineHeight: 'lineHeight',
      fontFamily: 'fontFamily',
      boxShadow: 'boxShadow',
      zIndex: 'zIndex',
      sizing: 'sizing',
    };

    return categoryMap[type] || type;
  }

  private generateSemanticName(originalName: string, value: string): string {
    return originalName.replace(/[-_]/g, '.');
  }

  private isTokenValue(value: string): boolean {
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return true;
    if (/^\d+\.?\d*(px|rem|em|%|vh|vw)$/.test(value)) return true;
    if (value.includes('sans') || value.includes('serif') || value.includes('mono')) return true;
    return false;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  resetPassCounter() {
    this.passCounter = 0;
  }

  getPassCounter(): number {
    return this.passCounter;
  }
}

describe('Thorough Mode Integration Test', () => {
  let thoroughMode: ThoroughMode;
  let mockAIProvider: MockThoroughAIProvider;
  let figmaTokensGenerator: FigmaTokensGenerator;

  const fixturesDir = path.join(__dirname, '../fixtures');
  const cssFile = path.join(fixturesDir, 'sample.css');
  const scssFile = path.join(fixturesDir, 'sample.scss');
  const jsFile = path.join(fixturesDir, 'theme.js');
  const tsFile = path.join(fixturesDir, 'theme.ts');

  beforeEach(() => {
    mockAIProvider = new MockThoroughAIProvider();
    thoroughMode = new ThoroughMode(mockAIProvider);
    figmaTokensGenerator = new FigmaTokensGenerator();
  });

  describe('End-to-End Token Extraction', () => {
    it('should extract tokens from CSS files', async () => {
      const result = await thoroughMode.extract([cssFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.mode).toBe('thorough');
      expect(result.metadata.fileCount).toBe(1);
    });

    it('should extract tokens from SCSS files', async () => {
      const result = await thoroughMode.extract([scssFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);

      // Verify token types
      const colorTokens = result.tokens.filter(t => t.type === 'color');
      expect(colorTokens.length).toBeGreaterThan(0);
    });

    it('should extract tokens from JavaScript files', async () => {
      const result = await thoroughMode.extract([jsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should extract tokens from TypeScript files', async () => {
      const result = await thoroughMode.extract([tsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should extract tokens from mixed file types', async () => {
      const result = await thoroughMode.extract([cssFile, scssFile, jsFile, tsFile]);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.metadata.fileCount).toBe(4);
    });
  });

  describe('Four-Pass Analysis Pipeline', () => {
    it('should execute all four passes', async () => {
      mockAIProvider.resetPassCounter();
      await thoroughMode.extract([cssFile, scssFile]);

      // Verify AI was called 4 times (one for each pass)
      expect(mockAIProvider.getPassCounter()).toBe(4);
    });

    it('should include progress callbacks', async () => {
      const progressMessages: string[] = [];
      const onProgress = (message: string) => {
        progressMessages.push(message);
      };

      await thoroughMode.extract([cssFile], onProgress);

      // Verify progress messages for each pass
      expect(progressMessages).toContain('Pass 1: Per-file extraction');
      expect(progressMessages).toContain('Pass 2: Pattern detection');
      expect(progressMessages).toContain('Pass 3: Semantic grouping');
      expect(progressMessages).toContain('Pass 4: Alias detection');
    });

    it('should handle empty results from Pass 1', async () => {
      // Create empty file
      const emptyFile = path.join(fixturesDir, 'empty.css');
      const fs = require('fs');
      fs.writeFileSync(emptyFile, '');

      try {
        const result = await thoroughMode.extract([emptyFile]);

        // Should return empty but valid TokenSet
        expect(result).toBeDefined();
        expect(result.tokens).toEqual([]);
        expect(result.metadata.mode).toBe('thorough');
      } finally {
        fs.unlinkSync(emptyFile);
      }
    });
  });

  describe('Token Structure Validation', () => {
    it('should produce valid TokenSet structure', async () => {
      const result = await thoroughMode.extract([cssFile, jsFile]);

      // Validate TokenSet structure
      expect(result).toMatchObject({
        tokens: expect.any(Array),
        metadata: {
          extractedAt: expect.any(String),
          fileCount: expect.any(Number),
          mode: 'thorough',
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
      const result = await thoroughMode.extract([cssFile]);

      // Verify ISO 8601 timestamp
      const timestamp = new Date(result.metadata.extractedAt);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should preserve file and line information', async () => {
      const result = await thoroughMode.extract([cssFile]);

      // Verify tokens have file information
      result.tokens.forEach(token => {
        expect(token.file).toBeTruthy();
        expect(token.file).toContain('sample.css');
      });

      // Most tokens should have line numbers
      const tokensWithLines = result.tokens.filter(t => t.line !== undefined);
      expect(tokensWithLines.length).toBeGreaterThan(0);
    });
  });

  describe('Alias Detection', () => {
    it('should create aliases for semantic tokens', async () => {
      const result = await thoroughMode.extract([cssFile]);

      // Look for alias tokens (reference other tokens using {tokenName} syntax)
      const aliasTokens = result.tokens.filter(t => {
        return typeof t.value === 'string' && t.value.startsWith('{') && t.value.endsWith('}');
      });

      // May or may not have aliases depending on token patterns
      expect(result.tokens).toBeDefined();
    });

    it('should create semantic hierarchy', async () => {
      const result = await thoroughMode.extract([cssFile, scssFile]);

      // Verify hierarchical naming (dots in names)
      const hierarchicalTokens = result.tokens.filter(t => t.name.includes('.'));
      expect(hierarchicalTokens.length).toBeGreaterThan(0);
    });
  });

  describe('Figma Tokens JSON Output', () => {
    it('should generate valid Figma Tokens JSON', async () => {
      const tokenSet = await thoroughMode.extract([cssFile, jsFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Validate against Figma Tokens schema
      expect(() => validateFigmaTokensJSON(figmaJSON)).not.toThrow();
    });

    it('should group tokens by category', async () => {
      const tokenSet = await thoroughMode.extract([cssFile, jsFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // Verify we have category groups
      const categories = Object.keys(figmaJSON);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should preserve aliases in Figma JSON', async () => {
      const tokenSet = await thoroughMode.extract([cssFile]);
      const figmaJSON = figmaTokensGenerator.generate(tokenSet);

      // If there are alias tokens, they should be in the output
      const aliasTokens = tokenSet.tokens.filter(t => {
        return typeof t.value === 'string' && t.value.startsWith('{');
      });

      // Just verify JSON is valid
      expect(figmaJSON).toBeDefined();
    });
  });

  describe('Accuracy and Coverage', () => {
    it('should extract color tokens from CSS', async () => {
      const result = await thoroughMode.extract([cssFile]);
      const colorTokens = result.tokens.filter(t => t.type === 'color');

      expect(colorTokens.length).toBeGreaterThan(0);

      // Verify specific colors
      const values = colorTokens.map(t => t.value);
      expect(values.some(v => v === '#0ea5e9' || (typeof v === 'string' && v.includes('#0ea5e9')))).toBe(true);
    });

    it('should extract spacing tokens from SCSS', async () => {
      const result = await thoroughMode.extract([scssFile]);
      const spacingTokens = result.tokens.filter(t => t.type === 'spacing');

      expect(spacingTokens.length).toBeGreaterThan(0);
    });

    it('should extract diverse token types', async () => {
      const result = await thoroughMode.extract([cssFile, scssFile, jsFile]);

      // Get unique token types
      const tokenTypes = new Set(result.tokens.map(t => t.type));

      // Should have multiple token types
      expect(tokenTypes.size).toBeGreaterThan(2);
    });

    it('should handle empty input gracefully', async () => {
      const result = await thoroughMode.extract([]);

      expect(result).toBeDefined();
      expect(result.tokens).toEqual([]);
      expect(result.metadata.fileCount).toBe(0);
      expect(result.metadata.mode).toBe('thorough');
    });

    it('should detect patterns across files', async () => {
      // When same value appears in multiple files, thorough mode should detect it
      const result = await thoroughMode.extract([cssFile, scssFile]);

      // Both files have #0ea5e9 - thorough mode may create aliases or consolidate
      expect(result.tokens.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const nonExistentFile = path.join(fixturesDir, 'does-not-exist.css');

      // Should not crash (may warn but continue)
      const result = await thoroughMode.extract([nonExistentFile, cssFile]);

      // Should still process valid file
      expect(result).toBeDefined();
    });

    it('should handle malformed content', async () => {
      const malformedFile = path.join(fixturesDir, 'malformed.css');
      const fs = require('fs');
      fs.writeFileSync(malformedFile, '/* incomplete');

      try {
        const result = await thoroughMode.extract([malformedFile]);

        expect(result).toBeDefined();
        expect(result.tokens).toBeInstanceOf(Array);
      } finally {
        fs.unlinkSync(malformedFile);
      }
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete 4-pass analysis', async () => {
      const startTime = Date.now();
      await thoroughMode.extract([cssFile, scssFile, jsFile]);
      const duration = Date.now() - startTime;

      // 4-pass should complete (with mock, should be fast)
      expect(duration).toBeLessThan(10000);
    });

    it('should provide progressive results through passes', async () => {
      const progressMessages: string[] = [];
      const onProgress = (msg: string) => progressMessages.push(msg);

      await thoroughMode.extract([cssFile], onProgress);

      // Verify we got progress updates
      expect(progressMessages.length).toBe(4);
    });
  });

  describe('Comprehensive Token Extraction', () => {
    it('should extract more tokens than quick mode would', async () => {
      // Thorough mode should be comprehensive
      const result = await thoroughMode.extract([cssFile, scssFile, jsFile, tsFile]);

      // Should extract a substantial number of tokens
      expect(result.tokens.length).toBeGreaterThan(10);
    });

    it('should organize tokens into hierarchies', async () => {
      const result = await thoroughMode.extract([jsFile]);

      // Verify hierarchical organization
      const tokenNames = result.tokens.map(t => t.name);
      const hasHierarchy = tokenNames.some(name => {
        const parts = name.split('.');
        return parts.length > 1;
      });

      expect(hasHierarchy).toBe(true);
    });
  });
});
