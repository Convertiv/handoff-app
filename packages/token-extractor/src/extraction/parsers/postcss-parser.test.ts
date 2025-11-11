import { PostCSSParser } from './postcss-parser';
import type { ExtractedToken, TokenSet } from '../../types/tokens';
import * as path from 'path';
import * as fs from 'fs';

describe('PostCSSParser', () => {
  const testFixturesDir = path.join(__dirname, '../../../test-fixtures/postcss-parser');

  beforeAll(() => {
    // Create test fixtures directory
    fs.mkdirSync(testFixturesDir, { recursive: true });

    // Create CSS file with custom properties
    const cssContent = `
:root {
  /* Primary colors */
  --primary-color: #0ea5e9;
  --primary-dark: #0284c7;
  --primary-light: #38bdf8;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --line-height-normal: 1.5;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

.button {
  background: #10b981;
  padding: 16px;
  margin: 0.5rem;
}
`;
    fs.writeFileSync(path.join(testFixturesDir, 'variables.css'), cssContent);

    // Create SCSS file with SCSS variables
    const scssContent = `
// Color palette
$primary: #0ea5e9;
$secondary: #8b5cf6;
$success: #10b981;
$danger: #ef4444;
$warning: #f59e0b;

// Spacing scale
$spacing-base: 8px;
$spacing-sm: 4px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;

// Typography
$font-family-base: 'Inter', sans-serif;
$font-size-sm: 0.875rem;
$font-size-base: 1rem;
$font-size-lg: 1.125rem;
$font-weight-normal: 400;
$font-weight-bold: 700;

// Border radius
$border-radius-sm: 4px;
$border-radius-md: 8px;

// Z-index
$z-index-dropdown: 1000;
$z-index-modal: 2000;

.component {
  color: #1e293b;
  padding: 12px 24px;
  margin: 1.5em;
}
`;
    fs.writeFileSync(path.join(testFixturesDir, 'variables.scss'), scssContent);

    // Create mixed file with both CSS custom properties and inline values
    const mixedContent = `
:root {
  --color-primary: #3b82f6;
  --spacing-unit: 8px;
}

.card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  margin: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
`;
    fs.writeFileSync(path.join(testFixturesDir, 'mixed.css'), mixedContent);
  });

  afterAll(() => {
    // Clean up test fixtures
    if (fs.existsSync(testFixturesDir)) {
      fs.rmSync(testFixturesDir, { recursive: true, force: true });
    }
  });

  describe('parseFile', () => {
    test('should extract CSS custom properties from CSS file', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'variables.css');
      const tokens = await parser.parseFile(filePath);

      expect(tokens.length).toBeGreaterThan(0);

      // Check for specific CSS custom properties
      const primaryColor = tokens.find(t => t.name === '--primary-color');
      expect(primaryColor).toBeDefined();
      expect(primaryColor?.value).toBe('#0ea5e9');
      expect(primaryColor?.type).toBe('color');
      expect(primaryColor?.file).toBe(filePath);
      expect(primaryColor?.line).toBeGreaterThan(0);

      const spacingMd = tokens.find(t => t.name === '--spacing-md');
      expect(spacingMd).toBeDefined();
      expect(spacingMd?.value).toBe('16px');
      expect(spacingMd?.type).toBe('spacing');
    });

    test('should extract SCSS variables from SCSS file', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'variables.scss');
      const tokens = await parser.parseFile(filePath);

      expect(tokens.length).toBeGreaterThan(0);

      // Check for SCSS variables
      const primary = tokens.find(t => t.name === '$primary');
      expect(primary).toBeDefined();
      expect(primary?.value).toBe('#0ea5e9');
      expect(primary?.type).toBe('color');

      const spacingBase = tokens.find(t => t.name === '$spacing-base');
      expect(spacingBase).toBeDefined();
      expect(spacingBase?.value).toBe('8px');
      expect(spacingBase?.type).toBe('spacing');

      const fontWeight = tokens.find(t => t.name === '$font-weight-normal');
      expect(fontWeight).toBeDefined();
      expect(fontWeight?.value).toBe('400');
      expect(fontWeight?.type).toBe('fontWeight');

      const zIndex = tokens.find(t => t.name === '$z-index-modal');
      expect(zIndex).toBeDefined();
      expect(zIndex?.value).toBe('2000');
      expect(zIndex?.type).toBe('zIndex');
    });

    test('should extract inline color hex codes', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'mixed.css');
      const tokens = await parser.parseFile(filePath);

      // Should extract hex colors from inline values
      const inlineColors = tokens.filter(t => t.type === 'color' && !t.name.startsWith('--'));
      expect(inlineColors.length).toBeGreaterThan(0);

      // Check for specific inline colors
      const hasWhite = tokens.some(t => t.value === '#ffffff');
      const hasBorder = tokens.some(t => t.value === '#e5e7eb');
      expect(hasWhite || hasBorder).toBe(true);
    });

    test('should extract spacing values from inline styles', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'mixed.css');
      const tokens = await parser.parseFile(filePath);

      // Should extract spacing values
      const spacingTokens = tokens.filter(t => t.type === 'spacing');
      expect(spacingTokens.length).toBeGreaterThan(0);
    });

    test('should include file and line metadata', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'variables.css');
      const tokens = await parser.parseFile(filePath);

      tokens.forEach(token => {
        expect(token.file).toBe(filePath);
        expect(typeof token.line).toBe('number');
        expect(token.line).toBeGreaterThan(0);
      });
    });

    test('should properly classify token types', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'variables.scss');
      const tokens = await parser.parseFile(filePath);

      // Check type classifications
      const colorTokens = tokens.filter(t => t.type === 'color');
      const spacingTokens = tokens.filter(t => t.type === 'spacing');
      const typographyTokens = tokens.filter(t => t.type === 'fontSize' || t.type === 'fontWeight' || t.type === 'fontFamily');
      const radiusTokens = tokens.filter(t => t.type === 'borderRadius');
      const zIndexTokens = tokens.filter(t => t.type === 'zIndex');

      expect(colorTokens.length).toBeGreaterThan(0);
      expect(spacingTokens.length).toBeGreaterThan(0);
      expect(typographyTokens.length).toBeGreaterThan(0);
      expect(radiusTokens.length).toBeGreaterThan(0);
      expect(zIndexTokens.length).toBeGreaterThan(0);
    });

    test('should handle files that do not exist', async () => {
      const parser = new PostCSSParser();
      await expect(
        parser.parseFile('/nonexistent/file.css')
      ).rejects.toThrow();
    });
  });

  describe('parseFiles', () => {
    test('should parse multiple files and return TokenSet', async () => {
      const parser = new PostCSSParser();
      const filePaths = [
        path.join(testFixturesDir, 'variables.css'),
        path.join(testFixturesDir, 'variables.scss')
      ];
      const tokenSet = await parser.parseFiles(filePaths);

      expect(tokenSet.tokens.length).toBeGreaterThan(0);
      expect(tokenSet.metadata.extractedAt).toBeDefined();
      expect(tokenSet.metadata.fileCount).toBe(2);
      expect(typeof tokenSet.metadata.lineCount).toBe('number');
    });

    test('should combine tokens from multiple files', async () => {
      const parser = new PostCSSParser();
      const filePaths = [
        path.join(testFixturesDir, 'variables.css'),
        path.join(testFixturesDir, 'variables.scss'),
        path.join(testFixturesDir, 'mixed.css')
      ];
      const tokenSet = await parser.parseFiles(filePaths);

      // Should have tokens from all files
      const files = new Set(tokenSet.tokens.map(t => t.file));
      expect(files.size).toBe(3);
    });

    test('should handle empty file list', async () => {
      const parser = new PostCSSParser();
      const tokenSet = await parser.parseFiles([]);

      expect(tokenSet.tokens).toEqual([]);
      expect(tokenSet.metadata.fileCount).toBe(0);
    });
  });

  describe('type classification', () => {
    test('should identify color tokens correctly', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'variables.scss');
      const tokens = await parser.parseFile(filePath);

      const colorTokens = tokens.filter(t => t.type === 'color');

      // All color tokens should have hex values
      colorTokens.forEach(token => {
        expect(typeof token.value === 'string' && token.value.startsWith('#')).toBe(true);
      });
    });

    test('should identify spacing tokens correctly', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'variables.scss');
      const tokens = await parser.parseFile(filePath);

      const spacingTokens = tokens.filter(t => t.type === 'spacing');

      // Spacing tokens should have px, rem, or em values
      spacingTokens.forEach(token => {
        const value = token.value.toString();
        expect(
          value.endsWith('px') || value.endsWith('rem') || value.endsWith('em')
        ).toBe(true);
      });
    });

    test('should identify font tokens correctly', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'variables.scss');
      const tokens = await parser.parseFile(filePath);

      const fontSizeTokens = tokens.filter(t => t.type === 'fontSize');
      expect(fontSizeTokens.length).toBeGreaterThan(0);

      const fontWeightTokens = tokens.filter(t => t.type === 'fontWeight');
      expect(fontWeightTokens.length).toBeGreaterThan(0);
    });

    test('should identify border radius tokens correctly', async () => {
      const parser = new PostCSSParser();
      const filePath = path.join(testFixturesDir, 'variables.scss');
      const tokens = await parser.parseFile(filePath);

      const radiusTokens = tokens.filter(t => t.type === 'borderRadius');
      expect(radiusTokens.length).toBeGreaterThan(0);
    });
  });
});
