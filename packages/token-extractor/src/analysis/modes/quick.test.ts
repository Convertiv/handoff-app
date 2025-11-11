import { QuickMode } from './quick';
import type { AIProvider } from '../ai-client';
import type { ExtractedToken, TokenSet } from '../../types/tokens';

// Mock parsers
const mockPostCSSParser = {
  parse: jest.fn(),
};

const mockBabelParser = {
  parse: jest.fn(),
};

// Mock AI provider
const mockAIProvider: AIProvider = {
  analyze: jest.fn(),
};

describe('QuickMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Extraction', () => {
    test('should call PostCSS parser on CSS/SCSS files', async () => {
      const cssFiles = ['/project/src/styles/colors.scss', '/project/src/styles/spacing.css'];
      const jsFiles: string[] = [];

      const cssTokens: ExtractedToken[] = [
        {
          name: '$primary-color',
          value: '#0ea5e9',
          type: 'color',
          file: '/project/src/styles/colors.scss',
          line: 1,
        },
      ];

      mockPostCSSParser.parse.mockResolvedValue(cssTokens);
      mockBabelParser.parse.mockResolvedValue([]);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            {
              name: 'colors.primary',
              value: '#0ea5e9',
              type: 'color',
              file: '/project/src/styles/colors.scss',
              line: 1,
            },
          ],
        })
      );

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      await quickMode.extract(cssFiles, jsFiles);

      expect(mockPostCSSParser.parse).toHaveBeenCalledWith('/project/src/styles/colors.scss');
      expect(mockPostCSSParser.parse).toHaveBeenCalledWith('/project/src/styles/spacing.css');
      expect(mockPostCSSParser.parse).toHaveBeenCalledTimes(2);
    });

    test('should call Babel parser on JS/TS files', async () => {
      const cssFiles: string[] = [];
      const jsFiles = ['/project/src/theme.ts', '/project/src/colors.js'];

      const jsTokens: ExtractedToken[] = [
        {
          name: 'theme.colors.primary',
          value: '#0ea5e9',
          type: 'color',
          file: '/project/src/theme.ts',
          line: 3,
        },
      ];

      mockPostCSSParser.parse.mockResolvedValue([]);
      mockBabelParser.parse.mockResolvedValue(jsTokens);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            {
              name: 'colors.primary',
              value: '#0ea5e9',
              type: 'color',
              file: '/project/src/theme.ts',
              line: 3,
            },
          ],
        })
      );

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      await quickMode.extract(cssFiles, jsFiles);

      expect(mockBabelParser.parse).toHaveBeenCalledWith('/project/src/theme.ts');
      expect(mockBabelParser.parse).toHaveBeenCalledWith('/project/src/colors.js');
      expect(mockBabelParser.parse).toHaveBeenCalledTimes(2);
    });

    test('should combine tokens from both parsers', async () => {
      const cssFiles = ['/project/src/styles.css'];
      const jsFiles = ['/project/src/theme.js'];

      const cssTokens: ExtractedToken[] = [
        {
          name: '--spacing-md',
          value: '16px',
          type: 'spacing',
          file: '/project/src/styles.css',
          line: 5,
        },
      ];

      const jsTokens: ExtractedToken[] = [
        {
          name: 'colors.primary',
          value: '#0ea5e9',
          type: 'color',
          file: '/project/src/theme.js',
          line: 2,
        },
      ];

      mockPostCSSParser.parse.mockResolvedValue(cssTokens);
      mockBabelParser.parse.mockResolvedValue(jsTokens);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            {
              name: 'colors.primary',
              value: '#0ea5e9',
              type: 'color',
              file: '/project/src/theme.js',
              line: 2,
            },
            {
              name: 'spacing.md',
              value: '16px',
              type: 'spacing',
              file: '/project/src/styles.css',
              line: 5,
            },
          ],
        })
      );

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      const result = await quickMode.extract(cssFiles, jsFiles);

      // AI should receive combined tokens
      expect(mockAIProvider.analyze).toHaveBeenCalledTimes(1);
      const [prompt, context] = (mockAIProvider.analyze as jest.Mock).mock.calls[0];
      expect(context.tokens).toHaveLength(2);
      expect(context.tokens).toEqual(expect.arrayContaining(cssTokens));
      expect(context.tokens).toEqual(expect.arrayContaining(jsTokens));
    });
  });

  describe('AI Refinement', () => {
    test('should send raw tokens to AI with correct prompt', async () => {
      const cssFiles = ['/project/src/styles.css'];
      const jsFiles: string[] = [];

      const rawTokens: ExtractedToken[] = [
        {
          name: '$color-blue-500',
          value: '#3b82f6',
          type: 'color',
          file: '/project/src/styles.css',
          line: 1,
        },
        {
          name: '--primary-color',
          value: '#3b82f6',
          type: 'color',
          file: '/project/src/styles.css',
          line: 2,
        },
      ];

      mockPostCSSParser.parse.mockResolvedValue(rawTokens);
      mockBabelParser.parse.mockResolvedValue([]);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            {
              name: 'colors.primary.500',
              value: '#3b82f6',
              type: 'color',
              file: '/project/src/styles.css',
              line: 1,
            },
          ],
          duplicates: [
            {
              tokens: ['$color-blue-500', '--primary-color'],
              suggestedName: 'colors.primary.500',
            },
          ],
        })
      );

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      await quickMode.extract(cssFiles, jsFiles);

      expect(mockAIProvider.analyze).toHaveBeenCalledTimes(1);
      const [prompt, context] = (mockAIProvider.analyze as jest.Mock).mock.calls[0];

      // Verify prompt mentions key requirements
      expect(prompt).toContain('Group these tokens');
      expect(prompt).toContain('semantic names');
      expect(prompt).toContain('Figma Tokens conventions');
      expect(prompt).toContain('duplicates');
      expect(context.tokens).toEqual(rawTokens);
    });

    test('should parse AI response into structured TokenSet', async () => {
      const cssFiles = ['/project/src/styles.css'];
      const jsFiles: string[] = [];

      const rawTokens: ExtractedToken[] = [
        {
          name: '$blue-500',
          value: '#3b82f6',
          type: 'color',
          file: '/project/src/styles.css',
          line: 1,
        },
      ];

      const aiResponse = {
        tokens: [
          {
            name: 'colors.primary.500',
            value: '#3b82f6',
            type: 'color',
            file: '/project/src/styles.css',
            line: 1,
            context: 'Grouped from $blue-500',
          },
          {
            name: 'colors.primary.600',
            value: '#2563eb',
            type: 'color',
            file: '/project/src/styles.css',
            line: 2,
          },
        ],
      };

      mockPostCSSParser.parse.mockResolvedValue(rawTokens);
      mockBabelParser.parse.mockResolvedValue([]);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(JSON.stringify(aiResponse));

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      const result = await quickMode.extract(cssFiles, jsFiles);

      expect(result).toBeDefined();
      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].name).toBe('colors.primary.500');
      expect(result.tokens[0].value).toBe('#3b82f6');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.mode).toBe('quick');
      expect(result.metadata.fileCount).toBe(1);
    });

    test('should handle AI response with duplicate detection', async () => {
      const cssFiles = ['/project/src/styles.css'];
      const jsFiles: string[] = [];

      const rawTokens: ExtractedToken[] = [
        {
          name: '$primary',
          value: '#0ea5e9',
          type: 'color',
          file: '/project/src/styles.css',
          line: 1,
        },
        {
          name: '--color-primary',
          value: '#0ea5e9',
          type: 'color',
          file: '/project/src/styles.css',
          line: 2,
        },
      ];

      const aiResponse = {
        tokens: [
          {
            name: 'colors.primary',
            value: '#0ea5e9',
            type: 'color',
            file: '/project/src/styles.css',
            line: 1,
          },
        ],
        duplicates: [
          {
            originalNames: ['$primary', '--color-primary'],
            consolidatedName: 'colors.primary',
            value: '#0ea5e9',
          },
        ],
      };

      mockPostCSSParser.parse.mockResolvedValue(rawTokens);
      mockBabelParser.parse.mockResolvedValue([]);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(JSON.stringify(aiResponse));

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      const result = await quickMode.extract(cssFiles, jsFiles);

      // Should consolidate duplicates
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].name).toBe('colors.primary');
      expect(result.tokens[0].value).toBe('#0ea5e9');
    });
  });

  describe('Token Grouping', () => {
    test('should group tokens by category', async () => {
      const cssFiles = ['/project/src/styles.css'];
      const jsFiles: string[] = [];

      const rawTokens: ExtractedToken[] = [
        { name: '$blue', value: '#3b82f6', type: 'color', file: '/project/src/styles.css', line: 1 },
        { name: '$red', value: '#ef4444', type: 'color', file: '/project/src/styles.css', line: 2 },
        { name: '$spacing-sm', value: '8px', type: 'spacing', file: '/project/src/styles.css', line: 3 },
        { name: '$spacing-md', value: '16px', type: 'spacing', file: '/project/src/styles.css', line: 4 },
      ];

      const aiResponse = {
        tokens: [
          { name: 'colors.blue.500', value: '#3b82f6', type: 'color', file: '/project/src/styles.css', line: 1 },
          { name: 'colors.red.500', value: '#ef4444', type: 'color', file: '/project/src/styles.css', line: 2 },
          { name: 'spacing.sm', value: '8px', type: 'spacing', file: '/project/src/styles.css', line: 3 },
          { name: 'spacing.md', value: '16px', type: 'spacing', file: '/project/src/styles.css', line: 4 },
        ],
      };

      mockPostCSSParser.parse.mockResolvedValue(rawTokens);
      mockBabelParser.parse.mockResolvedValue([]);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(JSON.stringify(aiResponse));

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      const result = await quickMode.extract(cssFiles, jsFiles);

      const colorTokens = result.tokens.filter((t: ExtractedToken) => t.type === 'color');
      const spacingTokens = result.tokens.filter((t: ExtractedToken) => t.type === 'spacing');

      expect(colorTokens).toHaveLength(2);
      expect(spacingTokens).toHaveLength(2);
      expect(colorTokens.every((t: ExtractedToken) => t.name.startsWith('colors.'))).toBe(true);
      expect(spacingTokens.every((t: ExtractedToken) => t.name.startsWith('spacing.'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle parser errors gracefully', async () => {
      const cssFiles = ['/project/src/invalid.css'];
      const jsFiles: string[] = [];

      mockPostCSSParser.parse.mockRejectedValue(new Error('Parse error'));
      mockBabelParser.parse.mockResolvedValue([]);

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);

      await expect(quickMode.extract(cssFiles, jsFiles)).rejects.toThrow('Parse error');
    });

    test('should handle AI errors gracefully', async () => {
      const cssFiles = ['/project/src/styles.css'];
      const jsFiles: string[] = [];

      mockPostCSSParser.parse.mockResolvedValue([
        { name: '$color', value: '#000', type: 'color', file: '/project/src/styles.css', line: 1 },
      ]);
      mockBabelParser.parse.mockResolvedValue([]);
      (mockAIProvider.analyze as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);

      await expect(quickMode.extract(cssFiles, jsFiles)).rejects.toThrow('AI service unavailable');
    });

    test('should handle invalid AI JSON response', async () => {
      const cssFiles = ['/project/src/styles.css'];
      const jsFiles: string[] = [];

      mockPostCSSParser.parse.mockResolvedValue([
        { name: '$color', value: '#000', type: 'color', file: '/project/src/styles.css', line: 1 },
      ]);
      mockBabelParser.parse.mockResolvedValue([]);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue('invalid json');

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);

      await expect(quickMode.extract(cssFiles, jsFiles)).rejects.toThrow();
    });
  });

  describe('Metadata', () => {
    test('should include correct metadata in TokenSet', async () => {
      const cssFiles = ['/project/src/styles1.css', '/project/src/styles2.css'];
      const jsFiles = ['/project/src/theme.js'];

      mockPostCSSParser.parse.mockResolvedValue([
        { name: '$color', value: '#000', type: 'color', file: '/project/src/styles1.css', line: 1 },
      ]);
      mockBabelParser.parse.mockResolvedValue([
        { name: 'spacing', value: '16px', type: 'spacing', file: '/project/src/theme.js', line: 1 },
      ]);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            { name: 'colors.text', value: '#000', type: 'color', file: '/project/src/styles1.css', line: 1 },
            { name: 'spacing.base', value: '16px', type: 'spacing', file: '/project/src/theme.js', line: 1 },
          ],
        })
      );

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      const result = await quickMode.extract(cssFiles, jsFiles);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.mode).toBe('quick');
      expect(result.metadata.fileCount).toBe(3); // 2 CSS + 1 JS
      expect(result.metadata.extractedAt).toBeDefined();
      expect(new Date(result.metadata.extractedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Empty Input', () => {
    test('should handle no files', async () => {
      const cssFiles: string[] = [];
      const jsFiles: string[] = [];

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      const result = await quickMode.extract(cssFiles, jsFiles);

      expect(result.tokens).toEqual([]);
      expect(result.metadata.fileCount).toBe(0);
      expect(mockPostCSSParser.parse).not.toHaveBeenCalled();
      expect(mockBabelParser.parse).not.toHaveBeenCalled();
      expect(mockAIProvider.analyze).not.toHaveBeenCalled();
    });

    test('should handle no tokens found', async () => {
      const cssFiles = ['/project/src/styles.css'];
      const jsFiles: string[] = [];

      mockPostCSSParser.parse.mockResolvedValue([]);
      mockBabelParser.parse.mockResolvedValue([]);

      const quickMode = new QuickMode(mockAIProvider, mockPostCSSParser as any, mockBabelParser as any);
      const result = await quickMode.extract(cssFiles, jsFiles);

      expect(result.tokens).toEqual([]);
      expect(result.metadata.fileCount).toBe(1);
      expect(mockAIProvider.analyze).not.toHaveBeenCalled();
    });
  });
});
