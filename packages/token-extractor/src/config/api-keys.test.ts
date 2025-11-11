import { APIKeyManager } from './api-keys';
import * as fs from 'fs';

describe('APIKeyManager', () => {
  beforeEach(() => {
    // Clear environment
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  test('should detect API key from environment', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-123';
    const manager = new APIKeyManager();
    const key = manager.getKey('anthropic');
    expect(key).toBe('test-key-123');
  });

  test('should return null if no key found', () => {
    const manager = new APIKeyManager();
    const key = manager.getKey('anthropic');
    expect(key).toBeNull();
  });

  test('should detect provider from available keys', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const manager = new APIKeyManager();
    const provider = manager.detectProvider();
    expect(provider).toBe('anthropic');
  });
});
