import chalk from 'chalk';
import { runDiscovery, recommendMode, displayDiscoveryResults } from '../discovery';
import { promptModeSelection } from '../interactive/mode-selection';
import type { ExtractorConfig, AnalysisMode } from '../types/config';

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

    // Determine mode: use CLI option, interactive prompt, or recommendation
    let selectedMode: AnalysisMode;

    if (options.mode) {
      // Mode explicitly provided via CLI
      selectedMode = options.mode;
      console.log(chalk.cyan(`\n✓ Using mode from CLI: ${chalk.bold(selectedMode.toUpperCase())}`));
    } else if (options.interactive !== false) {
      // Interactive mode (default)
      selectedMode = await promptModeSelection(discovery, recommendation);
      console.log(chalk.green(`\n✓ Mode selected: ${chalk.bold(selectedMode.toUpperCase())}`));
    } else {
      // Non-interactive: use recommendation
      selectedMode = recommendation.mode;
      console.log(chalk.cyan(`\n✓ Using recommended mode: ${chalk.bold(selectedMode.toUpperCase())}`));
    }

    // Placeholder - will implement extraction in later tasks
    console.log(chalk.cyan('\n📄 Files written:'));
    console.log(chalk.gray(`   • ${options.output || './figma-tokens.json'}`));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red('\nToken extraction failed:'));
    console.error(chalk.red(errorMessage));

    // Provide helpful guidance
    console.error(chalk.yellow('\nFor help, see:'));
    console.error(chalk.gray('  • Troubleshooting guide: https://github.com/Convertiv/handoff/blob/main/packages/token-extractor/TROUBLESHOOTING.md'));
    console.error(chalk.gray('  • Report issues: https://github.com/Convertiv/handoff/issues'));

    throw error;
  }
}
