import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { AIProvider } from '../types/config';

export class APIKeyManager {
  private configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), '.token-extractor.config.json');
  }

  /**
   * Get API key for provider from environment or config file
   */
  public getKey(provider: AIProvider): string | null {
    // 1. Check environment variables
    const envKey = this.getKeyFromEnv(provider);
    if (envKey) return envKey;

    // 2. Check config file
    const configKey = this.getKeyFromConfig(provider);
    if (configKey) return configKey;

    return null;
  }

  /**
   * Detect which provider has an available API key
   */
  public detectProvider(): AIProvider | null {
    if (this.getKey('anthropic')) return 'anthropic';
    if (this.getKey('openai')) return 'openai';
    return null;
  }

  /**
   * Save API key to config file (gitignored)
   */
  public saveKey(provider: AIProvider, apiKey: string): void {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key cannot be empty. Please provide a valid API key from:\n' +
        (provider === 'anthropic'
          ? '  https://console.anthropic.com/'
          : '  https://platform.openai.com/api-keys'));
    }

    let config: Record<string, any> = {};

    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        try {
          config = JSON.parse(content);
        } catch (parseError) {
          throw new Error(`Failed to parse config file at ${this.configPath}.\n` +
            `The file may be corrupted. You can:\n` +
            `  1. Delete the file: rm ${this.configPath}\n` +
            `  2. Re-run the tool to create a new config\n\n` +
            `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      }

      config[`${provider}ApiKey`] = apiKey;

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));

      // Try to set file permissions (may fail on Windows)
      try {
        fs.chmodSync(this.configPath, 0o600); // Readable only by owner
      } catch (chmodError) {
        // Log warning but don't fail - Windows doesn't support chmod
        console.warn(`Warning: Could not set file permissions on ${this.configPath}: ${chmodError instanceof Error ? chmodError.message : 'Unknown error'}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to parse config file')) {
        throw error;
      }
      throw new Error(`Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getKeyFromEnv(provider: AIProvider): string | null {
    const envVar = provider === 'anthropic'
      ? 'ANTHROPIC_API_KEY'
      : 'OPENAI_API_KEY';

    return process.env[envVar] || null;
  }

  private getKeyFromConfig(provider: AIProvider): string | null {
    if (!fs.existsSync(this.configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      return config[`${provider}ApiKey`] || null;
    } catch (error) {
      console.warn(`Warning: Could not read config file at ${this.configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }
}
