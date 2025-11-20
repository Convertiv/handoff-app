import { ThoroughMode } from './thorough';
import type { AIProvider } from '../ai-client';
import type { ExtractedToken } from '../../types/tokens';

/**
 * Mock AI Provider for testing
 */
class MockAIProvider implements AIProvider {
  private responses: string[] = [];
  private callCount = 0;

  constructor(responses: string[]) {
    this.responses = responses;
  }

  async analyze(prompt: string, context: any): Promise<string> {
    if (this.callCount >= this.responses.length) {
      throw new Error('No more mock responses available');
    }
    const response = this.responses[this.callCount];
    this.callCount++;
    return response;
  }

  getCallCount(): number {
    return this.callCount;
  }
}

describe('ThoroughMode', () => {
  describe('4-pass pipeline', () => {
    it('should process all 4 passes with AI calls', async () => {
      // Mock responses for each pass
      const pass1Response = JSON.stringify({
        files: [
          {
            file: '/test/colors.scss',
            tokens: [
              { name: 'primary', value: '#0ea5e9', type: 'color', line: 1 },
              { name: 'secondary', value: '#6366f1', type: 'color', line: 2 },
            ],
          },
          {
            file: '/test/spacing.scss',
            tokens: [
              { name: 'spacing-md', value: '16px', type: 'spacing', line: 1 },
            ],
          },
        ],
      });

      const pass2Response = JSON.stringify({
        patterns: [
          {
            value: '#0ea5e9',
            occurrences: 1,
            files: ['/test/colors.scss'],
            suggestedName: 'colors.blue.500',
          },
        ],
        duplicates: [],
      });

      const pass3Response = JSON.stringify({
        groups: {
          core: {
            colors: [
              { name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/colors.scss', line: 1 },
              { name: 'colors.indigo.500', value: '#6366f1', type: 'color', file: '/test/colors.scss', line: 2 },
            ],
            spacing: [
              { name: 'spacing.md', value: '16px', type: 'spacing', file: '/test/spacing.scss', line: 1 },
            ],
          },
          semantic: {},
          component: {},
        },
      });

      const pass4Response = JSON.stringify({
        tokens: [
          { name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/colors.scss', line: 1 },
          { name: 'colors.indigo.500', value: '#6366f1', type: 'color', file: '/test/colors.scss', line: 2 },
          { name: 'spacing.md', value: '16px', type: 'spacing', file: '/test/spacing.scss', line: 1 },
          { name: 'colors.primary', value: '{colors.blue.500}', type: 'color', file: '/test/colors.scss', line: 1, context: 'alias' },
        ],
        aliases: [
          { alias: 'colors.primary', references: 'colors.blue.500' },
        ],
      });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      const files = ['/test/colors.scss', '/test/spacing.scss'];

      const result = await mode.extract(files);

      // Should make 4 AI calls
      expect(mockProvider.getCallCount()).toBe(4);

      // Should return tokens
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);

      // Should have metadata
      expect(result.metadata.mode).toBe('thorough');
      expect(result.metadata.fileCount).toBe(2);
      expect(result.metadata.extractedAt).toBeDefined();
    });

    it('should handle empty file list', async () => {
      const mockProvider = new MockAIProvider([]);
      const mode = new ThoroughMode(mockProvider);

      const result = await mode.extract([]);

      expect(result.tokens).toEqual([]);
      expect(result.metadata.fileCount).toBe(0);
      expect(result.metadata.mode).toBe('thorough');
      expect(mockProvider.getCallCount()).toBe(0);
    });

    it('should track progress through passes', async () => {
      const pass1Response = JSON.stringify({
        files: [
          {
            file: '/test/test.scss',
            tokens: [{ name: 'primary', value: '#000', type: 'color', line: 1 }],
          },
        ],
      });

      const pass2Response = JSON.stringify({
        patterns: [],
        duplicates: [],
      });

      const pass3Response = JSON.stringify({
        groups: {
          core: {
            colors: [{ name: 'colors.black', value: '#000', type: 'color', file: '/test/test.scss', line: 1 }],
          },
          semantic: {},
          component: {},
        },
      });

      const pass4Response = JSON.stringify({
        tokens: [
          { name: 'colors.black', value: '#000', type: 'color', file: '/test/test.scss', line: 1 },
        ],
        aliases: [],
      });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      const progressUpdates: string[] = [];

      const result = await mode.extract(['/test/test.scss'], (progress: string) => {
        progressUpdates.push(progress);
      });

      // Should receive progress updates for all passes
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates).toContain('Pass 1: Per-file extraction');
      expect(progressUpdates).toContain('Pass 2: Pattern detection');
      expect(progressUpdates).toContain('Pass 3: Semantic grouping');
      expect(progressUpdates).toContain('Pass 4: Alias detection');

      expect(result.tokens.length).toBe(1);
    });
  });

  describe('Pass 1: Per-file extraction', () => {
    it('should analyze each file individually', async () => {
      const pass1Response = JSON.stringify({
        files: [
          {
            file: '/test/file1.scss',
            tokens: [{ name: 'color1', value: '#fff', type: 'color', line: 1 }],
          },
          {
            file: '/test/file2.scss',
            tokens: [{ name: 'color2', value: '#000', type: 'color', line: 1 }],
          },
        ],
      });

      const pass2Response = JSON.stringify({ patterns: [], duplicates: [] });
      const pass3Response = JSON.stringify({ groups: { core: {}, semantic: {}, component: {} } });
      const pass4Response = JSON.stringify({ tokens: [], aliases: [] });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      const result = await mode.extract(['/test/file1.scss', '/test/file2.scss']);

      expect(mockProvider.getCallCount()).toBe(4);
    });

    it('should extract tokens with context', async () => {
      const pass1Response = JSON.stringify({
        files: [
          {
            file: '/test/theme.ts',
            tokens: [
              {
                name: 'primaryColor',
                value: '#0ea5e9',
                type: 'color',
                line: 5,
                context: 'theme object property',
              },
            ],
          },
        ],
      });

      const pass2Response = JSON.stringify({ patterns: [], duplicates: [] });
      const pass3Response = JSON.stringify({
        groups: {
          core: {
            colors: [
              {
                name: 'colors.primary',
                value: '#0ea5e9',
                type: 'color',
                file: '/test/theme.ts',
                line: 5,
                context: 'theme object property',
              },
            ],
          },
          semantic: {},
          component: {},
        },
      });
      const pass4Response = JSON.stringify({
        tokens: [
          {
            name: 'colors.primary',
            value: '#0ea5e9',
            type: 'color',
            file: '/test/theme.ts',
            line: 5,
            context: 'theme object property',
          },
        ],
        aliases: [],
      });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      const result = await mode.extract(['/test/theme.ts']);

      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.tokens[0].context).toBeDefined();
    });
  });

  describe('Pass 2: Pattern detection', () => {
    it('should find repeated values across files', async () => {
      const pass1Response = JSON.stringify({
        files: [
          {
            file: '/test/file1.scss',
            tokens: [{ name: 'primary', value: '#0ea5e9', type: 'color', line: 1 }],
          },
          {
            file: '/test/file2.scss',
            tokens: [{ name: 'blue', value: '#0ea5e9', type: 'color', line: 1 }],
          },
        ],
      });

      const pass2Response = JSON.stringify({
        patterns: [
          {
            value: '#0ea5e9',
            occurrences: 2,
            files: ['/test/file1.scss', '/test/file2.scss'],
            suggestedName: 'colors.blue.500',
          },
        ],
        duplicates: [
          {
            value: '#0ea5e9',
            names: ['primary', 'blue'],
            consolidatedName: 'colors.blue.500',
          },
        ],
      });

      const pass3Response = JSON.stringify({ groups: { core: {}, semantic: {}, component: {} } });
      const pass4Response = JSON.stringify({ tokens: [], aliases: [] });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      await mode.extract(['/test/file1.scss', '/test/file2.scss']);

      expect(mockProvider.getCallCount()).toBe(4);
    });
  });

  describe('Pass 3: Semantic grouping', () => {
    it('should organize tokens by hierarchy (core/semantic/component)', async () => {
      const pass1Response = JSON.stringify({
        files: [
          {
            file: '/test/tokens.scss',
            tokens: [
              { name: 'blue-500', value: '#0ea5e9', type: 'color', line: 1 },
              { name: 'primary', value: '#0ea5e9', type: 'color', line: 2 },
              { name: 'button-bg', value: '#0ea5e9', type: 'color', line: 3 },
            ],
          },
        ],
      });

      const pass2Response = JSON.stringify({ patterns: [], duplicates: [] });

      const pass3Response = JSON.stringify({
        groups: {
          core: {
            colors: [{ name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/tokens.scss', line: 1 }],
          },
          semantic: {
            colors: [{ name: 'colors.primary', value: '#0ea5e9', type: 'color', file: '/test/tokens.scss', line: 2 }],
          },
          component: {
            button: [{ name: 'button.background', value: '#0ea5e9', type: 'color', file: '/test/tokens.scss', line: 3 }],
          },
        },
      });

      const pass4Response = JSON.stringify({
        tokens: [
          { name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/tokens.scss', line: 1 },
        ],
        aliases: [],
      });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      await mode.extract(['/test/tokens.scss']);

      expect(mockProvider.getCallCount()).toBe(4);
    });
  });

  describe('Pass 4: Alias detection', () => {
    it('should create token references (aliases)', async () => {
      const pass1Response = JSON.stringify({
        files: [
          {
            file: '/test/tokens.scss',
            tokens: [
              { name: 'blue-500', value: '#0ea5e9', type: 'color', line: 1 },
              { name: 'primary', value: '#0ea5e9', type: 'color', line: 2 },
            ],
          },
        ],
      });

      const pass2Response = JSON.stringify({ patterns: [], duplicates: [] });

      const pass3Response = JSON.stringify({
        groups: {
          core: {
            colors: [{ name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/tokens.scss', line: 1 }],
          },
          semantic: {},
          component: {},
        },
      });

      const pass4Response = JSON.stringify({
        tokens: [
          { name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/tokens.scss', line: 1 },
          {
            name: 'colors.primary',
            value: '{colors.blue.500}',
            type: 'color',
            file: '/test/tokens.scss',
            line: 2,
            context: 'alias',
          },
        ],
        aliases: [
          {
            alias: 'colors.primary',
            references: 'colors.blue.500',
            reasoning: 'semantic alias to core color',
          },
        ],
      });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      const result = await mode.extract(['/test/tokens.scss']);

      // Should have both base token and alias
      expect(result.tokens.length).toBe(2);

      // One should be an alias (value starts with {})
      const aliases = result.tokens.filter((t: ExtractedToken) => typeof t.value === 'string' && t.value.startsWith('{'));
      expect(aliases.length).toBeGreaterThan(0);
    });

    it('should create aliases like $colors.primary → $colors.blue.500', async () => {
      const pass1Response = JSON.stringify({
        files: [{ file: '/test/test.scss', tokens: [] }],
      });

      const pass2Response = JSON.stringify({ patterns: [], duplicates: [] });
      const pass3Response = JSON.stringify({ groups: { core: {}, semantic: {}, component: {} } });

      const pass4Response = JSON.stringify({
        tokens: [
          { name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/test.scss', line: 1 },
          { name: 'colors.primary', value: '{colors.blue.500}', type: 'color', file: '/test/test.scss', line: 2 },
        ],
        aliases: [{ alias: 'colors.primary', references: 'colors.blue.500' }],
      });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      const result = await mode.extract(['/test/test.scss']);

      const primaryToken = result.tokens.find((t: ExtractedToken) => t.name === 'colors.primary');
      expect(primaryToken).toBeDefined();
      expect(primaryToken!.value).toBe('{colors.blue.500}');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON in pass 1', async () => {
      const mockProvider = new MockAIProvider(['invalid json']);
      const mode = new ThoroughMode(mockProvider);

      await expect(mode.extract(['/test/file.scss'])).rejects.toThrow();
    });

    it('should handle missing tokens array in response', async () => {
      const pass1Response = JSON.stringify({ files: [] });
      const mockProvider = new MockAIProvider([pass1Response]);
      const mode = new ThoroughMode(mockProvider);

      const result = await mode.extract(['/test/file.scss']);

      // Should handle gracefully with empty result
      expect(result.tokens).toEqual([]);
    });

    it('should handle AI provider errors', async () => {
      const mockProvider: AIProvider = {
        analyze: jest.fn().mockRejectedValue(new Error('API Error')),
      };

      const mode = new ThoroughMode(mockProvider);

      await expect(mode.extract(['/test/file.scss'])).rejects.toThrow('API Error');
    });
  });

  describe('Integration', () => {
    it('should combine results from all 4 passes into final TokenSet', async () => {
      const pass1Response = JSON.stringify({
        files: [
          {
            file: '/test/colors.scss',
            tokens: [
              { name: 'primary-color', value: '#0ea5e9', type: 'color', line: 1 },
              { name: 'secondary-color', value: '#6366f1', type: 'color', line: 2 },
            ],
          },
        ],
      });

      const pass2Response = JSON.stringify({
        patterns: [
          { value: '#0ea5e9', occurrences: 1, files: ['/test/colors.scss'] },
          { value: '#6366f1', occurrences: 1, files: ['/test/colors.scss'] },
        ],
        duplicates: [],
      });

      const pass3Response = JSON.stringify({
        groups: {
          core: {
            colors: [
              { name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/colors.scss', line: 1 },
              { name: 'colors.indigo.500', value: '#6366f1', type: 'color', file: '/test/colors.scss', line: 2 },
            ],
          },
          semantic: {},
          component: {},
        },
      });

      const pass4Response = JSON.stringify({
        tokens: [
          { name: 'colors.blue.500', value: '#0ea5e9', type: 'color', file: '/test/colors.scss', line: 1 },
          { name: 'colors.indigo.500', value: '#6366f1', type: 'color', file: '/test/colors.scss', line: 2 },
          {
            name: 'colors.primary',
            value: '{colors.blue.500}',
            type: 'color',
            file: '/test/colors.scss',
            line: 1,
            context: 'alias',
          },
        ],
        aliases: [{ alias: 'colors.primary', references: 'colors.blue.500' }],
      });

      const mockProvider = new MockAIProvider([
        pass1Response,
        pass2Response,
        pass3Response,
        pass4Response,
      ]);

      const mode = new ThoroughMode(mockProvider);
      const result = await mode.extract(['/test/colors.scss']);

      // Verify final TokenSet structure
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBe(3); // 2 base colors + 1 alias

      expect(result.metadata).toBeDefined();
      expect(result.metadata.mode).toBe('thorough');
      expect(result.metadata.fileCount).toBe(1);
      expect(result.metadata.extractedAt).toBeDefined();

      // Verify tokens have required fields
      result.tokens.forEach((token: ExtractedToken) => {
        expect(token.name).toBeDefined();
        expect(token.value).toBeDefined();
        expect(token.type).toBeDefined();
        expect(token.file).toBeDefined();
      });
    });
  });
});
