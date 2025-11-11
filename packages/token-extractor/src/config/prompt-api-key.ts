import inquirer from 'inquirer';
import chalk from 'chalk';
import type { AIProvider } from '../types/config';
import { APIKeyManager } from './api-keys';

export async function promptForAPIKey(): Promise<{ provider: AIProvider; apiKey: string }> {
  console.log(chalk.yellow('\n⚠️  No API key found'));
  console.log(chalk.gray('You need an API key from Anthropic or OpenAI to use this tool.\n'));

  const { provider } = await inquirer.prompt<{ provider: AIProvider }>([
    {
      type: 'list',
      name: 'provider',
      message: 'Which AI provider would you like to use?',
      choices: [
        { name: 'Anthropic (Claude) - Recommended for code analysis', value: 'anthropic' },
        { name: 'OpenAI (GPT-4)', value: 'openai' }
      ]
    }
  ]);

  const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key:`,
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'API key cannot be empty';
        }
        return true;
      }
    }
  ]);

  const { save } = await inquirer.prompt<{ save: boolean }>([
    {
      type: 'confirm',
      name: 'save',
      message: 'Save this API key to ~/.token-extractor.config.json?',
      default: true
    }
  ]);

  if (save) {
    const manager = new APIKeyManager();
    manager.saveKey(provider, apiKey);
    console.log(chalk.green('✓ API key saved\n'));
  }

  return { provider, apiKey };
}
