import chalk from 'chalk';
import { runDiscovery, recommendMode, displayDiscoveryResults } from '../discovery';
import type { ExtractorConfig } from '../types/config';

interface ExtractOptions {
  mode?: 'quick' | 'balanced' | 'thorough';
  interactive?: boolean;
  output?: string;
  report?: boolean;
  audit?: boolean;
}

export async function extractCommand(options: ExtractOptions): Promise<void> {
  try {
    // Run discovery pass
    const discovery = await runDiscovery();
    const recommendation = recommendMode(discovery);

    displayDiscoveryResults(discovery, recommendation);

    // Placeholder - will implement mode selection in next task
    console.log(chalk.cyan('\n📄 Files written:'));
    console.log(chalk.gray(`   • ${options.output || './figma-tokens.json'}`));

  } catch (error) {
    console.error(chalk.red('Token extraction failed:'), error);
    throw error;
  }
}
