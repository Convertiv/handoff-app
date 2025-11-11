import chalk from 'chalk';
import ora from 'ora';
import { FileScanner } from './scanner';
import { FrameworkDetector } from './framework-detector';
import type { DiscoveryResult, ModeRecommendation, AnalysisMode } from '../types/config';

/**
 * Run complete discovery pass on repository
 */
export async function runDiscovery(rootDir: string = process.cwd()): Promise<DiscoveryResult> {
  const spinner = ora('Analyzing repository structure...').start();

  try {
    const scanner = new FileScanner(rootDir);
    const detector = new FrameworkDetector(rootDir);

    spinner.text = 'Scanning files...';
    const files = await scanner.findStyleFiles();
    const fileCount = files.length;

    spinner.text = 'Counting lines...';
    const lineCount = await scanner.countLines();

    spinner.text = 'Detecting frameworks...';
    const frameworks = await detector.detect();

    spinner.text = 'Checking for existing tokens...';
    const hasExistingTokens = await detector.hasExistingTokens();

    // Categorize directories
    const stylesDirs = files
      .filter(f => /\.(css|scss|less|sass)$/.test(f))
      .map(f => f.substring(0, f.lastIndexOf('/')))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    const componentDirs = files
      .filter(f => /\.(jsx?|tsx?|vue)$/.test(f))
      .map(f => f.substring(0, f.lastIndexOf('/')))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    spinner.succeed('Discovery complete');

    return {
      fileCount,
      lineCount,
      frameworks,
      hasExistingTokens,
      directories: {
        styles: stylesDirs,
        components: componentDirs
      }
    };
  } catch (error) {
    spinner.fail('Discovery failed');
    throw error;
  }
}

/**
 * Recommend analysis mode based on discovery results
 */
export function recommendMode(discovery: DiscoveryResult): ModeRecommendation {
  const { fileCount, lineCount, hasExistingTokens, frameworks } = discovery;

  // Quick mode: Good existing structure
  if (hasExistingTokens && frameworks.some(f => ['scss', 'less', 'css'].includes(f))) {
    return {
      mode: 'quick',
      reasoning: 'Repository has existing tokens and standard CSS structure. AST parsing will be fast and accurate.',
      estimatedCost: Math.max(0.10, fileCount * 0.005),
      estimatedTime: 60,
      expectedAccuracy: 75
    };
  }

  // Thorough mode: Large/complex repos
  if (fileCount > 100 || lineCount > 15000) {
    return {
      mode: 'thorough',
      reasoning: 'Large codebase with complex patterns. Multi-pass analysis will ensure comprehensive extraction.',
      estimatedCost: Math.max(1.0, fileCount * 0.02),
      estimatedTime: Math.min(300, 120 + fileCount * 0.5),
      expectedAccuracy: 95
    };
  }

  // Balanced mode: Default for modern frameworks
  const modernFrameworks = ['react', 'vue', 'styled-components', 'emotion', 'tailwind'];
  const hasModern = frameworks.some(f => modernFrameworks.includes(f));

  const baseCost = lineCount / 1000 * 0.50;

  return {
    mode: 'balanced',
    reasoning: hasModern
      ? 'Modern framework detected. Single-pass AI analysis handles diverse patterns well.'
      : 'Medium-sized repository. Balanced approach offers good accuracy/cost ratio.',
    estimatedCost: Math.max(0.50, Math.min(baseCost, 1.50)),
    estimatedTime: Math.min(90, 30 + fileCount),
    expectedAccuracy: 85
  };
}

/**
 * Display discovery results to user
 */
export function displayDiscoveryResults(discovery: DiscoveryResult, recommendation: ModeRecommendation): void {
  console.log(chalk.cyan('\n📊 Discovery Results:'));
  console.log(chalk.gray(`   • ${discovery.fileCount} style files (${discovery.lineCount.toLocaleString()} lines)`));
  console.log(chalk.gray(`   • Frameworks: ${discovery.frameworks.join(', ') || 'none detected'}`));
  console.log(chalk.gray(`   • Existing tokens: ${discovery.hasExistingTokens ? 'Yes' : 'No'}`));

  console.log(chalk.cyan('\n💡 Recommended: ') + chalk.bold(recommendation.mode.toUpperCase()) + chalk.cyan(' Mode'));
  console.log(chalk.gray(`   ${recommendation.reasoning}`));
  console.log(chalk.gray(`   • Estimated cost: $${recommendation.estimatedCost.toFixed(2)}`));
  console.log(chalk.gray(`   • Estimated time: ~${recommendation.estimatedTime}s`));
  console.log(chalk.gray(`   • Expected accuracy: ${recommendation.expectedAccuracy}%`));
}
