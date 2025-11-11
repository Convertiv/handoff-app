import inquirer from 'inquirer';
import chalk from 'chalk';
import type { DiscoveryResult, ModeRecommendation, AnalysisMode } from '../types/config';

interface ModeDetails {
  mode: AnalysisMode;
  cost: number;
  time: number;
  accuracy: number;
  description: string;
}

/**
 * Get mode details for all three modes based on discovery results
 */
function getModeDetails(discovery: DiscoveryResult): Record<AnalysisMode, ModeDetails> {
  const { fileCount, lineCount } = discovery;

  return {
    quick: {
      mode: 'quick',
      cost: Math.max(0.10, fileCount * 0.005),
      time: 60,
      accuracy: 75,
      description: 'AST parsing + AI refinement. Fast extraction from well-structured code.'
    },
    balanced: {
      mode: 'balanced',
      cost: Math.max(0.50, Math.min(lineCount / 1000 * 0.50, 1.50)),
      time: Math.min(90, 30 + fileCount),
      accuracy: 85,
      description: 'Single-pass AI analysis. Good for diverse patterns and modern frameworks.'
    },
    thorough: {
      mode: 'thorough',
      cost: Math.max(1.0, fileCount * 0.02),
      time: Math.min(300, 120 + fileCount * 0.5),
      accuracy: 95,
      description: 'Multi-pass analysis with semantic grouping. Most comprehensive extraction.'
    }
  };
}

/**
 * Format mode choice for display in inquirer
 */
function formatModeChoice(
  details: ModeDetails,
  isRecommended: boolean
): { name: string; value: AnalysisMode } {
  const badge = isRecommended ? chalk.green(' [RECOMMENDED]') : '';
  const name = `${chalk.bold(details.mode.toUpperCase())}${badge}
  ${chalk.gray(details.description)}
  ${chalk.gray(`Cost: $${details.cost.toFixed(2)} | Time: ~${details.time}s | Accuracy: ${details.accuracy}%`)}`;

  return { name, value: details.mode };
}

/**
 * Prompt user to select analysis mode with interactive confirmation
 */
export async function promptModeSelection(
  discovery: DiscoveryResult,
  recommendation: ModeRecommendation
): Promise<AnalysisMode> {
  const modeDetails = getModeDetails(discovery);
  let selectedMode: AnalysisMode = recommendation.mode;
  let confirmed = false;

  // Keep prompting until user confirms
  while (!confirmed) {
    // Step 1: Present mode choices
    console.log(chalk.cyan('\n🎯 Select Analysis Mode:\n'));

    const { mode } = await inquirer.prompt<{ mode: AnalysisMode }>([
      {
        type: 'list',
        name: 'mode',
        message: 'Choose how to analyze your codebase:',
        default: recommendation.mode,
        choices: [
          formatModeChoice(modeDetails.quick, recommendation.mode === 'quick'),
          formatModeChoice(modeDetails.balanced, recommendation.mode === 'balanced'),
          formatModeChoice(modeDetails.thorough, recommendation.mode === 'thorough')
        ]
      }
    ]);

    selectedMode = mode;
    const selectedDetails = modeDetails[selectedMode];

    // Step 2: Confirm cost estimate
    const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Proceed with ${chalk.bold(selectedMode.toUpperCase())} mode? (Est. cost: ${chalk.yellow(`$${selectedDetails.cost.toFixed(2)}`)}):`,
        default: true
      }
    ]);

    confirmed = confirm;

    if (!confirmed) {
      console.log(chalk.yellow('\nLet\'s try a different mode...\n'));
    }
  }

  return selectedMode;
}
