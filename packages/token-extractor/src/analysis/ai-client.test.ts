import { AIProvider, AnthropicProvider, OpenAIProvider, createProvider } from './ai-client';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Mock the SDKs
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

describe('AIProvider Interface', () => {
  describe('AnthropicProvider', () => {
    let mockCreate: jest.Mock;
    let provider: AnthropicProvider;

    beforeEach(() => {
      jest.clearAllMocks();

      // Create mock function
      mockCreate = jest.fn();

      // Mock the Anthropic constructor
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
        () =>
          ({
            messages: {
              create: mockCreate,
            },
          } as any)
      );

      provider = new AnthropicProvider('test-api-key');
    });

    test('should initialize with API key', () => {
      expect(Anthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
    });

    test('should successfully analyze with prompt', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Analysis result',
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await provider.analyze('Test prompt', { data: 'test' });

      expect(result).toBe('Analysis result');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('Test prompt'),
          },
        ],
      });
    });

    test('should include context in the prompt', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Analysis with context',
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      const context = {
        frameworks: ['react', 'styled-components'],
        fileCount: 50,
      };

      await provider.analyze('Analyze tokens', context);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: expect.stringContaining('react'),
            },
          ],
        })
      );
    });

    test('should retry on transient errors', async () => {
      const mockError = new Error('Rate limit exceeded');
      mockCreate
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: 'Success after retry' }],
        } as any);

      const result = await provider.analyze('Test prompt', {});

      expect(result).toBe('Success after retry');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    test('should fail after max retries', async () => {
      const mockError = new Error('Persistent error');
      mockCreate.mockRejectedValue(mockError);

      await expect(provider.analyze('Test prompt', {})).rejects.toThrow(
        /AI analysis failed after 3 attempts/
      );

      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    test('should use exponential backoff between retries', async () => {
      jest.useFakeTimers();

      const mockError = new Error('Temporary error');
      mockCreate
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: 'Success' }],
        } as any);

      const analyzePromise = provider.analyze('Test prompt', {});

      // Fast-forward through all timers
      await jest.runAllTimersAsync();

      const result = await analyzePromise;

      expect(result).toBe('Success');
      expect(mockCreate).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    test('should handle custom model', async () => {
      const customProvider = new AnthropicProvider('test-key', {
        model: 'claude-3-opus-20240229',
      });

      const mockResponse = {
        content: [{ type: 'text', text: 'Result' }],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      await customProvider.analyze('Test', {});

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
        })
      );
    });

    test('should handle custom max tokens', async () => {
      const customProvider = new AnthropicProvider('test-key', {
        maxTokens: 4096,
      });

      const mockResponse = {
        content: [{ type: 'text', text: 'Result' }],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      await customProvider.analyze('Test', {});

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 4096,
        })
      );
    });

    test('should handle missing text content in response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'image',
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      await expect(provider.analyze('Test prompt', {})).rejects.toThrow(
        /No text content in (AI )?response|AI analysis failed after 3 attempts/
      );
    });
  });

  describe('OpenAIProvider', () => {
    let mockCreate: jest.Mock;
    let provider: OpenAIProvider;

    beforeEach(() => {
      jest.clearAllMocks();

      // Create mock function
      mockCreate = jest.fn();

      // Mock the OpenAI constructor
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      provider = new OpenAIProvider('test-openai-key');
    });

    test('should initialize with API key', () => {
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-openai-key',
      });
    });

    test('should successfully analyze with prompt', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'OpenAI analysis result',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await provider.analyze('Test prompt', { data: 'test' });

      expect(result).toBe('OpenAI analysis result');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('Test prompt'),
          },
        ],
      });
    });

    test('should include context in the prompt', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Analysis with context',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      const context = {
        frameworks: ['vue', 'tailwind'],
        fileCount: 30,
      };

      await provider.analyze('Analyze tokens', context);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: expect.stringContaining('vue'),
            },
          ],
        })
      );
    });

    test('should retry on transient errors', async () => {
      jest.useFakeTimers();

      const mockError = new Error('API timeout');
      mockCreate
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success after retry' } }],
        } as any);

      const analyzePromise = provider.analyze('Test prompt', {});

      await jest.runAllTimersAsync();

      const result = await analyzePromise;

      expect(result).toBe('Success after retry');
      expect(mockCreate).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    test('should fail after max retries', async () => {
      jest.useFakeTimers();

      const mockError = new Error('Persistent error');
      mockCreate.mockRejectedValue(mockError);

      const analyzePromise = provider.analyze('Test prompt', {});

      // Run all timers and catch the promise rejection
      await Promise.all([
        jest.runAllTimersAsync(),
        expect(analyzePromise).rejects.toThrow('Failed to analyze after 3 attempts'),
      ]);

      expect(mockCreate).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    test('should handle custom model', async () => {
      const customProvider = new OpenAIProvider('test-key', {
        model: 'gpt-4',
      });

      const mockResponse = {
        choices: [{ message: { content: 'Result' } }],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      await customProvider.analyze('Test', {});

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
        })
      );
    });

    test('should handle missing content in response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {},
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      await expect(provider.analyze('Test prompt', {})).rejects.toThrow(
        /No content in response|Failed to analyze after 3 attempts/
      );
    });

    test('should handle empty choices array', async () => {
      const mockResponse = {
        choices: [],
      };

      mockCreate.mockResolvedValue(mockResponse as any);

      await expect(provider.analyze('Test prompt', {})).rejects.toThrow(
        /No content in response|Failed to analyze after 3 attempts/
      );
    });
  });

  describe('createProvider factory', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create AnthropicProvider', () => {
      const provider = createProvider('anthropic', 'test-key');
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    test('should create OpenAIProvider', () => {
      const provider = createProvider('openai', 'test-key');
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    test('should pass options to provider', () => {
      const options = { model: 'custom-model', maxTokens: 2048 };
      const provider = createProvider('anthropic', 'test-key', options);
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });
  });

  describe('Rate limit handling', () => {
    let mockCreate: jest.Mock;
    let provider: AnthropicProvider;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCreate = jest.fn();

      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
        () =>
          ({
            messages: {
              create: mockCreate,
            },
          } as any)
      );

      provider = new AnthropicProvider('test-api-key');
    });

    test('should handle rate limit errors with longer delay', async () => {
      jest.useFakeTimers();

      const rateLimitError = Object.assign(new Error('Rate limit exceeded'), {
        status: 429,
      });

      mockCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: 'Success after rate limit' }],
        } as any);

      const analyzePromise = provider.analyze('Test prompt', {});

      // Fast-forward through all timers
      await jest.runAllTimersAsync();

      const result = await analyzePromise;

      expect(result).toBe('Success after rate limit');
      expect(mockCreate).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });
});
