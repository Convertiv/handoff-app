import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { AIProvider as AIProviderType } from '../types/config';

/**
 * Common options for AI providers
 */
export interface ProviderOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Base interface for AI providers
 */
export interface AIProvider {
  /**
   * Analyze content using AI
   * @param prompt - The analysis prompt
   * @param context - Additional context for the analysis
   * @returns The analysis result as a string
   */
  analyze(prompt: string, context: any): Promise<string>;
}

/**
 * Anthropic (Claude) provider implementation
 */
export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(apiKey: string, options: ProviderOptions = {}) {
    this.client = new Anthropic({
      apiKey,
    });
    this.model = options.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = options.maxTokens || 8192;
    this.temperature = options.temperature || 0.7;
  }

  async analyze(prompt: string, context: any): Promise<string> {
    const fullPrompt = this.buildPrompt(prompt, context);

    return this.retryWithBackoff(async () => {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      });

      // Extract text content from response
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return textContent.text;
    });
  }

  private buildPrompt(prompt: string, context: any): string {
    if (!context || Object.keys(context).length === 0) {
      return prompt;
    }

    const contextStr = JSON.stringify(context, null, 2);
    return `${prompt}\n\nContext:\n${contextStr}`;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw new Error(
            `Failed to analyze after ${maxRetries} attempts: ${lastError.message}`
          );
        }

        // Check if it's a rate limit error (429)
        const errorObj = error as any;
        const isRateLimit = errorObj && typeof errorObj === 'object' && 'status' in errorObj && errorObj.status === 429;
        const delay = isRateLimit
          ? baseDelay * Math.pow(2, attempt) * 2 // Longer delay for rate limits
          : baseDelay * Math.pow(2, attempt - 1); // Exponential backoff

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * OpenAI (GPT) provider implementation
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(apiKey: string, options: ProviderOptions = {}) {
    this.client = new OpenAI({
      apiKey,
    });
    this.model = options.model || 'gpt-4-turbo-preview';
    this.maxTokens = options.maxTokens || 8192;
    this.temperature = options.temperature || 0.7;
  }

  async analyze(prompt: string, context: any): Promise<string> {
    const fullPrompt = this.buildPrompt(prompt, context);

    return this.retryWithBackoff(async () => {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      });

      // Extract content from response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      return content;
    });
  }

  private buildPrompt(prompt: string, context: any): string {
    if (!context || Object.keys(context).length === 0) {
      return prompt;
    }

    const contextStr = JSON.stringify(context, null, 2);
    return `${prompt}\n\nContext:\n${contextStr}`;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw new Error(
            `Failed to analyze after ${maxRetries} attempts: ${lastError.message}`
          );
        }

        // Check if it's a rate limit error
        const errorObj = error as any;
        const isRateLimit = errorObj && typeof errorObj === 'object' && 'status' in errorObj && errorObj.status === 429;
        const delay = isRateLimit
          ? baseDelay * Math.pow(2, attempt) * 2 // Longer delay for rate limits
          : baseDelay * Math.pow(2, attempt - 1); // Exponential backoff

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create the appropriate provider
 */
export function createProvider(
  providerType: AIProviderType,
  apiKey: string,
  options?: ProviderOptions
): AIProvider {
  switch (providerType) {
    case 'anthropic':
      return new AnthropicProvider(apiKey, options);
    case 'openai':
      return new OpenAIProvider(apiKey, options);
    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
}
