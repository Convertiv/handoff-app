import { BalancedMode } from './balanced';
import type { AIProvider } from '../ai-client';
import type { ExtractedToken, TokenSet } from '../../types/tokens';
import * as fs from 'fs';

// Mock AI provider
const mockAIProvider: AIProvider = {
  analyze: jest.fn(),
};

// Mock file system
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn(),
  },
}));

const mockReadFile = fs.promises.readFile as jest.MockedFunction<typeof fs.promises.readFile>;

describe('BalancedMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Batching', () => {
    test('should batch files into reasonable sizes (~50 files per batch)', async () => {
      const files: string[] = [];
      for (let i = 1; i <= 120; i++) {
        files.push(`/project/src/file${i}.css`);
      }

      mockReadFile.mockResolvedValue('/* CSS content */');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      await balancedMode.extract(files);

      // Should process in multiple batches (120 files / ~50 = 3 batches)
      expect(mockAIProvider.analyze).toHaveBeenCalledTimes(3);
    });

    test('should handle single batch for small file counts', async () => {
      const files = ['/project/src/colors.css', '/project/src/spacing.scss'];

      mockReadFile.mockResolvedValue('$primary: #0ea5e9;');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            {
              name: 'colors.primary',
              value: '#0ea5e9',
              type: 'color',
              file: '/project/src/colors.css',
              line: 1,
            },
          ],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      await balancedMode.extract(files);

      // Should process in single batch
      expect(mockAIProvider.analyze).toHaveBeenCalledTimes(1);
    });

    test('should load file contents from disk', async () => {
      const files = ['/project/src/colors.css', '/project/src/theme.ts'];

      mockReadFile.mockResolvedValueOnce('$primary: #0ea5e9;');
      mockReadFile.mockResolvedValueOnce('export const colors = { primary: "#0ea5e9" };');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      await balancedMode.extract(files);

      expect(mockReadFile).toHaveBeenCalledWith('/project/src/colors.css', 'utf-8');
      expect(mockReadFile).toHaveBeenCalledWith('/project/src/theme.ts', 'utf-8');
    });
  });

  describe('Comprehensive AI Prompt', () => {
    test('should send comprehensive extraction prompt to AI', async () => {
      const files = ['/project/src/styles.css'];

      mockReadFile.mockResolvedValue(':root { --primary: #0ea5e9; }');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            {
              name: 'colors.primary',
              value: '#0ea5e9',
              type: 'color',
              file: '/project/src/styles.css',
              line: 1,
            },
          ],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      await balancedMode.extract(files);

      expect(mockAIProvider.analyze).toHaveBeenCalledTimes(1);
      const [prompt, context] = (mockAIProvider.analyze as jest.Mock).mock.calls[0];

      // Verify prompt mentions key requirements
      expect(prompt.toLowerCase()).toContain('analyze these files');
      expect(prompt).toContain('extract ALL design tokens');
      expect(prompt.toLowerCase()).toContain('group tokens by type');
      expect(prompt).toContain('Figma Tokens naming');

      // Verify context includes file contents
      expect(context.files).toBeDefined();
      expect(context.files).toHaveLength(1);
      expect(context.files[0].path).toBe('/project/src/styles.css');
      expect(context.files[0].content).toBe(':root { --primary: #0ea5e9; }');
    });

    test('should specify pattern types in prompt', async () => {
      const files = ['/project/src/theme.js'];

      mockReadFile.mockResolvedValue('const theme = { colors: { primary: "#0ea5e9" } };');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      await balancedMode.extract(files);

      const [prompt] = (mockAIProvider.analyze as jest.Mock).mock.calls[0];

      // Verify prompt mentions diverse pattern support
      expect(prompt).toContain('CSS');
      expect(prompt).toContain('SCSS');
      expect(prompt).toContain('styled-components');
      expect(prompt).toContain('theme objects');
    });
  });

  describe('Diverse Pattern Support', () => {
    test('should extract tokens from CSS custom properties', async () => {
      const files = ['/project/src/styles.css'];
      const cssContent = `
:root {
  --color-primary: #0ea5e9;
  --spacing-md: 16px;
  --border-radius: 8px;
}
`;

      mockReadFile.mockResolvedValue(cssContent);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            { name: 'colors.primary', value: '#0ea5e9', type: 'color', file: files[0], line: 3 },
            { name: 'spacing.md', value: '16px', type: 'spacing', file: files[0], line: 4 },
            { name: 'borderRadius.default', value: '8px', type: 'borderRadius', file: files[0], line: 5 },
          ],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.tokens).toHaveLength(3);
      expect(result.tokens[0].type).toBe('color');
      expect(result.tokens[1].type).toBe('spacing');
      expect(result.tokens[2].type).toBe('borderRadius');
    });

    test('should extract tokens from SCSS variables', async () => {
      const files = ['/project/src/styles.scss'];
      const scssContent = `
$primary-color: #0ea5e9;
$secondary-color: #f59e0b;
$spacing-base: 8px;
`;

      mockReadFile.mockResolvedValue(scssContent);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            { name: 'colors.primary', value: '#0ea5e9', type: 'color', file: files[0], line: 2 },
            { name: 'colors.secondary', value: '#f59e0b', type: 'color', file: files[0], line: 3 },
            { name: 'spacing.base', value: '8px', type: 'spacing', file: files[0], line: 4 },
          ],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.tokens).toHaveLength(3);
    });

    test('should extract tokens from styled-components theme', async () => {
      const files = ['/project/src/theme.ts'];
      const themeContent = `
const theme = {
  colors: {
    primary: '#0ea5e9',
    secondary: '#f59e0b',
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
};
`;

      mockReadFile.mockResolvedValue(themeContent);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            { name: 'colors.primary', value: '#0ea5e9', type: 'color', file: files[0], line: 4 },
            { name: 'colors.secondary', value: '#f59e0b', type: 'color', file: files[0], line: 5 },
            { name: 'spacing.sm', value: '8px', type: 'spacing', file: files[0], line: 8 },
            { name: 'spacing.md', value: '16px', type: 'spacing', file: files[0], line: 9 },
            { name: 'spacing.lg', value: '24px', type: 'spacing', file: files[0], line: 10 },
          ],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.tokens).toHaveLength(5);
    });

    test('should extract tokens from CSS-in-JS', async () => {
      const files = ['/project/src/Button.tsx'];
      const jsContent = `
import styled from 'styled-components';

const Button = styled.button\`
  color: #0ea5e9;
  padding: 16px;
  border-radius: 8px;
\`;
`;

      mockReadFile.mockResolvedValue(jsContent);
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            { name: 'colors.primary', value: '#0ea5e9', type: 'color', file: files[0], line: 5 },
            { name: 'spacing.md', value: '16px', type: 'spacing', file: files[0], line: 6 },
            { name: 'borderRadius.default', value: '8px', type: 'borderRadius', file: files[0], line: 7 },
          ],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.tokens).toHaveLength(3);
    });
  });

  describe('AI Response Parsing', () => {
    test('should parse AI JSON response into TokenSet', async () => {
      const files = ['/project/src/styles.css'];

      mockReadFile.mockResolvedValue('/* CSS */');
      const aiResponse = {
        tokens: [
          {
            name: 'colors.primary.500',
            value: '#3b82f6',
            type: 'color',
            file: '/project/src/styles.css',
            line: 1,
          },
          {
            name: 'spacing.md',
            value: '16px',
            type: 'spacing',
            file: '/project/src/styles.css',
            line: 2,
          },
        ],
      };
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(JSON.stringify(aiResponse));

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].name).toBe('colors.primary.500');
      expect(result.tokens[0].value).toBe('#3b82f6');
      expect(result.tokens[1].name).toBe('spacing.md');
      expect(result.tokens[1].value).toBe('16px');
    });

    test('should handle AI response with markdown code fences', async () => {
      const files = ['/project/src/styles.css'];

      mockReadFile.mockResolvedValue('/* CSS */');
      const aiResponse = `\`\`\`json
{
  "tokens": [
    {
      "name": "colors.primary",
      "value": "#0ea5e9",
      "type": "color",
      "file": "/project/src/styles.css",
      "line": 1
    }
  ]
}
\`\`\``;
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(aiResponse);

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].name).toBe('colors.primary');
    });

    test('should throw error for invalid JSON response', async () => {
      const files = ['/project/src/styles.css'];

      mockReadFile.mockResolvedValue('/* CSS */');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue('invalid json');

      const balancedMode = new BalancedMode(mockAIProvider);

      await expect(balancedMode.extract(files)).rejects.toThrow();
    });

    test('should throw error if tokens array is missing', async () => {
      const files = ['/project/src/styles.css'];

      mockReadFile.mockResolvedValue('/* CSS */');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(JSON.stringify({ data: [] }));

      const balancedMode = new BalancedMode(mockAIProvider);

      await expect(balancedMode.extract(files)).rejects.toThrow('AI response missing tokens array');
    });
  });

  describe('Metadata', () => {
    test('should include correct metadata in TokenSet', async () => {
      const files = ['/project/src/file1.css', '/project/src/file2.scss', '/project/src/file3.ts'];

      mockReadFile.mockResolvedValue('/* content */');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [
            { name: 'colors.primary', value: '#0ea5e9', type: 'color', file: files[0], line: 1 },
          ],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.mode).toBe('balanced');
      expect(result.metadata.fileCount).toBe(3);
      expect(result.metadata.extractedAt).toBeDefined();
      expect(new Date(result.metadata.extractedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should include timestamp in ISO format', async () => {
      const files = ['/project/src/styles.css'];

      mockReadFile.mockResolvedValue('/* CSS */');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      const timestamp = new Date(result.metadata.extractedAt);
      expect(timestamp.toISOString()).toBe(result.metadata.extractedAt);
    });
  });

  describe('Empty Input', () => {
    test('should handle empty file list', async () => {
      const files: string[] = [];

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.tokens).toEqual([]);
      expect(result.metadata.fileCount).toBe(0);
      expect(mockReadFile).not.toHaveBeenCalled();
      expect(mockAIProvider.analyze).not.toHaveBeenCalled();
    });

    test('should handle files with no tokens', async () => {
      const files = ['/project/src/empty.css'];

      mockReadFile.mockResolvedValue('/* no tokens */');
      (mockAIProvider.analyze as jest.Mock).mockResolvedValue(
        JSON.stringify({
          tokens: [],
        })
      );

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      expect(result.tokens).toEqual([]);
      expect(result.metadata.fileCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle file read errors', async () => {
      const files = ['/project/src/missing.css'];

      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const balancedMode = new BalancedMode(mockAIProvider);

      await expect(balancedMode.extract(files)).rejects.toThrow('ENOENT');
    });

    test('should handle AI provider errors', async () => {
      const files = ['/project/src/styles.css'];

      mockReadFile.mockResolvedValue('/* CSS */');
      (mockAIProvider.analyze as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));

      const balancedMode = new BalancedMode(mockAIProvider);

      await expect(balancedMode.extract(files)).rejects.toThrow('AI service unavailable');
    });
  });

  describe('Batch Processing', () => {
    test('should merge tokens from multiple batches', async () => {
      const files: string[] = [];
      for (let i = 1; i <= 120; i++) {
        files.push(`/project/src/file${i}.css`);
      }

      mockReadFile.mockResolvedValue('/* CSS */');

      // Mock three different batch responses
      (mockAIProvider.analyze as jest.Mock)
        .mockResolvedValueOnce(
          JSON.stringify({
            tokens: [
              { name: 'colors.red', value: '#ef4444', type: 'color', file: files[0], line: 1 },
            ],
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            tokens: [
              { name: 'colors.blue', value: '#3b82f6', type: 'color', file: files[50], line: 1 },
            ],
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            tokens: [
              { name: 'colors.green', value: '#10b981', type: 'color', file: files[100], line: 1 },
            ],
          })
        );

      const balancedMode = new BalancedMode(mockAIProvider);
      const result = await balancedMode.extract(files);

      // Should combine tokens from all batches
      expect(result.tokens).toHaveLength(3);
      expect(result.tokens[0].name).toBe('colors.red');
      expect(result.tokens[1].name).toBe('colors.blue');
      expect(result.tokens[2].name).toBe('colors.green');
    });
  });
});
