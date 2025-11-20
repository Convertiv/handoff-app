import { BabelParser } from './babel-parser';
import * as path from 'path';
import * as fs from 'fs';

describe('BabelParser', () => {
  const fixturesDir = path.join(__dirname, '../../../test-fixtures/babel-parser');

  beforeAll(() => {
    // Create test fixtures directory
    fs.mkdirSync(fixturesDir, { recursive: true });

    // Fixture 1: Simple theme object (JS)
    fs.writeFileSync(
      path.join(fixturesDir, 'simple-theme.js'),
      `const theme = {
  colors: {
    primary: '#0ea5e9',
    secondary: '#8b5cf6',
    success: '#10b981',
    error: '#ef4444'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px'
  }
};

export default theme;`
    );

    // Fixture 2: styled-components ThemeProvider (TypeScript)
    fs.writeFileSync(
      path.join(fixturesDir, 'styled-theme.ts'),
      `import { DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  colors: {
    background: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  },
  fontSizes: {
    base: '16px',
    lg: '18px',
    xl: '20px'
  }
};`
    );

    // Fixture 3: Nested color palette
    fs.writeFileSync(
      path.join(fixturesDir, 'color-palette.js'),
      `export const colors = {
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    900: '#111827'
  },
  blue: {
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a'
  }
};`
    );

    // Fixture 4: Multiple export patterns
    fs.writeFileSync(
      path.join(fixturesDir, 'multiple-exports.ts'),
      `export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px'
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'Menlo, Monaco, monospace'
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
};`
    );

    // Fixture 5: Object with non-token properties
    fs.writeFileSync(
      path.join(fixturesDir, 'mixed-object.js'),
      `const config = {
  colors: {
    primary: '#0ea5e9',
    secondary: '#8b5cf6'
  },
  apiUrl: 'https://api.example.com', // Not a token
  debug: true, // Not a token
  spacing: {
    base: '16px'
  }
};`
    );
  });

  afterAll(() => {
    // Clean up test fixtures
    fs.rmSync(fixturesDir, { recursive: true, force: true });
  });

  test('should parse simple theme object', async () => {
    const parser = new BabelParser();
    const filePath = path.join(fixturesDir, 'simple-theme.js');
    const tokens = await parser.parse(filePath);

    expect(tokens.length).toBeGreaterThan(0);

    // Check for color tokens
    const primaryToken = tokens.find(t => t.name.includes('primary') && t.type === 'color');
    expect(primaryToken).toBeDefined();
    expect(primaryToken?.value).toBe('#0ea5e9');
    expect(primaryToken?.file).toBe(filePath);
    expect(primaryToken?.line).toBeGreaterThan(0);

    // Check for spacing tokens
    const spacingToken = tokens.find(t => t.name.includes('medium') && t.type === 'spacing');
    expect(spacingToken).toBeDefined();
    expect(spacingToken?.value).toBe('16px');
  });

  test('should parse styled-components theme', async () => {
    const parser = new BabelParser();
    const filePath = path.join(fixturesDir, 'styled-theme.ts');
    const tokens = await parser.parse(filePath);

    expect(tokens.length).toBeGreaterThan(0);

    // Check for border radius tokens
    const borderToken = tokens.find(t => t.name.includes('borderRadius') && t.name.includes('md'));
    expect(borderToken).toBeDefined();
    expect(borderToken?.value).toBe('8px');
    expect(borderToken?.type).toBe('borderRadius');

    // Check for font size tokens
    const fontSizeToken = tokens.find(t => t.name.includes('fontSize') && t.name.includes('xl'));
    expect(fontSizeToken).toBeDefined();
    expect(fontSizeToken?.value).toBe('20px');
    expect(fontSizeToken?.type).toBe('fontSize');
  });

  test('should handle nested color palettes', async () => {
    const parser = new BabelParser();
    const filePath = path.join(fixturesDir, 'color-palette.js');
    const tokens = await parser.parse(filePath);

    expect(tokens.length).toBeGreaterThan(0);

    // Check for nested color tokens
    const gray500 = tokens.find(t => t.name.includes('gray') && t.name.includes('500'));
    expect(gray500).toBeDefined();
    expect(gray500?.value).toBe('#6b7280');
    expect(gray500?.type).toBe('color');

    const blue50 = tokens.find(t => t.name.includes('blue') && t.name.includes('50'));
    expect(blue50).toBeDefined();
    expect(blue50?.value).toBe('#eff6ff');
  });

  test('should handle multiple exports', async () => {
    const parser = new BabelParser();
    const filePath = path.join(fixturesDir, 'multiple-exports.ts');
    const tokens = await parser.parse(filePath);

    expect(tokens.length).toBeGreaterThan(0);

    // Check for spacing from first export
    const spacingToken = tokens.find(t => t.name.includes('spacing') && t.name.includes('md'));
    expect(spacingToken).toBeDefined();
    expect(spacingToken?.value).toBe('16px');

    // Check for typography from second export
    const lineHeightToken = tokens.find(t => t.name.includes('lineHeight') && t.name.includes('normal'));
    expect(lineHeightToken).toBeDefined();
    expect(lineHeightToken?.value).toBe(1.5);
    expect(lineHeightToken?.type).toBe('lineHeight');
  });

  test('should filter out non-token properties', async () => {
    const parser = new BabelParser();
    const filePath = path.join(fixturesDir, 'mixed-object.js');
    const tokens = await parser.parse(filePath);

    // Should extract color and spacing tokens
    expect(tokens.some(t => t.name.includes('primary'))).toBe(true);
    expect(tokens.some(t => t.name.includes('spacing'))).toBe(true);

    // Should not extract apiUrl or debug as tokens
    expect(tokens.some(t => t.name.includes('apiUrl'))).toBe(false);
    expect(tokens.some(t => t.name.includes('debug'))).toBe(false);
  });

  test('should handle files with no tokens', async () => {
    const parser = new BabelParser();
    const emptyFile = path.join(fixturesDir, 'empty.js');

    fs.writeFileSync(emptyFile, 'const x = 123; console.log("hello");');

    const tokens = await parser.parse(emptyFile);
    expect(tokens).toEqual([]);

    fs.unlinkSync(emptyFile);
  });

  test('should handle syntax errors gracefully', async () => {
    const parser = new BabelParser();
    const invalidFile = path.join(fixturesDir, 'invalid.js');

    fs.writeFileSync(invalidFile, 'const theme = { colors: {'); // Invalid syntax

    await expect(parser.parse(invalidFile)).rejects.toThrow();

    fs.unlinkSync(invalidFile);
  });

  test('should include context information', async () => {
    const parser = new BabelParser();
    const filePath = path.join(fixturesDir, 'simple-theme.js');
    const tokens = await parser.parse(filePath);

    const tokenWithContext = tokens.find(t => t.context);
    expect(tokenWithContext).toBeDefined();
    expect(tokenWithContext?.context).toContain('theme');
  });

  test('should detect token type from property name', async () => {
    const parser = new BabelParser();
    const filePath = path.join(fixturesDir, 'styled-theme.ts');
    const tokens = await parser.parse(filePath);

    // Should infer 'color' type from 'colors' property
    const colorTokens = tokens.filter(t => t.type === 'color');
    expect(colorTokens.length).toBeGreaterThan(0);

    // Should infer 'borderRadius' type
    const borderRadiusTokens = tokens.filter(t => t.type === 'borderRadius');
    expect(borderRadiusTokens.length).toBeGreaterThan(0);

    // Should infer 'fontSize' type
    const fontSizeTokens = tokens.filter(t => t.type === 'fontSize');
    expect(fontSizeTokens.length).toBeGreaterThan(0);
  });
});
