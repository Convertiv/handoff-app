import { FigmaTokensGenerator } from './figma-tokens';
import type { TokenSet, ExtractedToken } from '../types/tokens';
import { validateFigmaTokensJSON } from '../types/figma-tokens';

describe('FigmaTokensGenerator', () => {
  let generator: FigmaTokensGenerator;

  beforeEach(() => {
    generator = new FigmaTokensGenerator();
  });

  describe('Color Token Transformation', () => {
    test('should transform simple color token to Figma format', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'primary-500',
            value: '#0ea5e9',
            type: 'color',
            file: 'src/colors.scss'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.colors).toBeDefined();
      expect(result.colors.primary).toBeDefined();
      expect(result.colors.primary['500']).toEqual({
        value: '#0ea5e9',
        type: 'color'
      });
    });

    test('should organize color tokens hierarchically', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'primary-500',
            value: '#0ea5e9',
            type: 'color',
            file: 'src/colors.scss'
          },
          {
            name: 'primary-600',
            value: '#0284c7',
            type: 'color',
            file: 'src/colors.scss'
          },
          {
            name: 'secondary-500',
            value: '#8b5cf6',
            type: 'color',
            file: 'src/colors.scss'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.colors.primary['500']).toBeDefined();
      expect(result.colors.primary['600']).toBeDefined();
      expect(result.colors.secondary['500']).toBeDefined();
    });
  });

  describe('Spacing Token Transformation', () => {
    test('should transform spacing tokens to Figma format', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'spacing-md',
            value: '16',
            type: 'spacing',
            file: 'src/spacing.scss'
          },
          {
            name: 'spacing-lg',
            value: '24',
            type: 'spacing',
            file: 'src/spacing.scss'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.spacing).toBeDefined();
      expect(result.spacing.md).toEqual({
        value: '16',
        type: 'spacing'
      });
      expect(result.spacing.lg).toEqual({
        value: '24',
        type: 'spacing'
      });
    });
  });

  describe('Typography Token Transformation', () => {
    test('should transform typography tokens to Figma format', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'fontSize-base',
            value: '16',
            type: 'fontSize',
            file: 'src/typography.scss'
          },
          {
            name: 'fontWeight-bold',
            value: '700',
            type: 'fontWeight',
            file: 'src/typography.scss'
          },
          {
            name: 'fontFamily-sans',
            value: 'Inter, system-ui, sans-serif',
            type: 'fontFamily',
            file: 'src/typography.scss'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.fontSize).toBeDefined();
      expect(result.fontSize.base).toEqual({
        value: '16',
        type: 'fontSize'
      });
      expect(result.fontWeight.bold).toEqual({
        value: '700',
        type: 'fontWeight'
      });
      expect(result.fontFamily.sans).toEqual({
        value: 'Inter, system-ui, sans-serif',
        type: 'fontFamily'
      });
    });
  });

  describe('Alias/Reference Handling', () => {
    test('should create references for aliased tokens', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'primary-500',
            value: '#0ea5e9',
            type: 'color',
            file: 'src/colors.scss'
          },
          {
            name: 'button-bg',
            value: '{colors.primary.500}',
            type: 'color',
            file: 'src/components.scss',
            context: 'References primary-500'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.colors.primary['500']).toEqual({
        value: '#0ea5e9',
        type: 'color'
      });
      expect(result.colors.button).toBeDefined();
      expect(result.colors.button.bg).toEqual({
        value: '{colors.primary.500}',
        type: 'color',
        description: 'References primary-500'
      });
    });
  });

  describe('Hierarchical Structure', () => {
    test('should handle dot notation in token names', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'colors.brand.primary',
            value: '#0ea5e9',
            type: 'color',
            file: 'src/tokens.js'
          },
          {
            name: 'colors.brand.secondary',
            value: '#8b5cf6',
            type: 'color',
            file: 'src/tokens.js'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.colors).toBeDefined();
      expect(result.colors.brand).toBeDefined();
      expect(result.colors.brand.primary).toEqual({
        value: '#0ea5e9',
        type: 'color'
      });
      expect(result.colors.brand.secondary).toEqual({
        value: '#8b5cf6',
        type: 'color'
      });
    });

    test('should handle multiple levels of hierarchy', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'colors.semantic.success.light',
            value: '#86efac',
            type: 'color',
            file: 'src/tokens.js'
          },
          {
            name: 'colors.semantic.success.dark',
            value: '#166534',
            type: 'color',
            file: 'src/tokens.js'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.colors.semantic.success.light).toEqual({
        value: '#86efac',
        type: 'color'
      });
      expect(result.colors.semantic.success.dark).toEqual({
        value: '#166534',
        type: 'color'
      });
    });
  });

  describe('Mixed Token Types', () => {
    test('should handle multiple token types in one set', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'primary-500',
            value: '#0ea5e9',
            type: 'color',
            file: 'src/tokens.scss'
          },
          {
            name: 'spacing-md',
            value: '16',
            type: 'spacing',
            file: 'src/tokens.scss'
          },
          {
            name: 'radius-lg',
            value: '12',
            type: 'borderRadius',
            file: 'src/tokens.scss'
          },
          {
            name: 'shadow-md',
            value: '0 4px 6px rgba(0,0,0,0.1)',
            type: 'boxShadow',
            file: 'src/tokens.scss'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.colors.primary['500']).toBeDefined();
      expect(result.spacing.md).toBeDefined();
      expect(result.borderRadius.lg).toBeDefined();
      expect(result.boxShadow.md).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    test('should produce output that passes Figma Tokens schema validation', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'primary-500',
            value: '#0ea5e9',
            type: 'color',
            file: 'src/colors.scss'
          },
          {
            name: 'spacing-md',
            value: '16',
            type: 'spacing',
            file: 'src/spacing.scss'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      // Should not throw validation error
      expect(() => validateFigmaTokensJSON(result)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty token set', () => {
      const tokenSet: TokenSet = {
        tokens: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 0
        }
      };

      const result = generator.generate(tokenSet);

      expect(result).toEqual({});
    });

    test('should handle tokens with special characters in names', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'color_primary_500',
            value: '#0ea5e9',
            type: 'color',
            file: 'src/colors.scss'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.colors.primary['500']).toEqual({
        value: '#0ea5e9',
        type: 'color'
      });
    });

    test('should handle numeric token values', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'zIndex-modal',
            value: 1000,
            type: 'zIndex',
            file: 'src/z-index.scss'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.zIndex.modal).toEqual({
        value: 1000,
        type: 'number'
      });
    });
  });

  describe('Token Context and Descriptions', () => {
    test('should include descriptions from token context', () => {
      const tokenSet: TokenSet = {
        tokens: [
          {
            name: 'primary-500',
            value: '#0ea5e9',
            type: 'color',
            file: 'src/colors.scss',
            context: 'Primary brand color for buttons and links'
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 1
        }
      };

      const result = generator.generate(tokenSet);

      expect(result.colors.primary['500'].description).toBe(
        'Primary brand color for buttons and links'
      );
    });
  });
});
