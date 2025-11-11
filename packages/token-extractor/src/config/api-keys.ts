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
    let config: Record<string, any> = {};

    if (fs.existsSync(this.configPath)) {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      config = JSON.parse(content);
    }

    config[`${provider}ApiKey`] = apiKey;

    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    fs.chmodSync(this.configPath, 0o600); // Readable only by owner
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
    } catch {
      return null;
    }
  }
}
