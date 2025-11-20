import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { runDiscovery, recommendMode, displayDiscoveryResults } from '../discovery';
import { promptModeSelection } from '../interactive/mode-selection';
import { APIKeyManager } from '../config/api-keys';
import { promptForAPIKey } from '../config/prompt-api-key';
import { createProvider } from '../analysis/ai-client';
import { QuickMode } from '../analysis/modes/quick';
import { BalancedMode } from '../analysis/modes/balanced';
import { ThoroughMode } from '../analysis/modes/thorough';
import { PostCSSParser } from '../extraction/parsers/postcss-parser';
import { BabelParser } from '../extraction/parsers/babel-parser';
import { askClarifyingQuestions } from '../interactive/questions';
import { FigmaTokensGenerator } from '../output/figma-tokens';
import { ReportGenerator } from '../output/report';
import { AuditGenerator } from '../output/audit';
import { CleanupTaskGenerator } from '../output/cleanup';
import { analyzeDesignSystemHealth, type HealthReport } from '../analysis/health-checker';
import type { AnalysisMode, AIProvider as AIProviderType } from '../types/config';
import type { TokenSet } from '../types/tokens';

interface ExtractOptions {
  mode?: 'quick' | 'balanced' | 'thorough';
  interactive?: boolean;
  output?: string;
  report?: boolean;
  audit?: boolean;
}

export async function extractCommand(options: ExtractOptions): Promise<void> {
  try {
    // ========== SETUP PHASE ==========
    console.log(chalk.cyan('\n🔧 Setup Phase'));

    // Check for API key
    const keyManager = new APIKeyManager();
    let provider: AIProviderType | null = keyManager.detectProvider();
    let apiKey: string | null = null;

    if (!provider) {
      // No API key found - prompt user
      const result = await promptForAPIKey();
      provider = result.provider;
      apiKey = result.apiKey;
    } else {
      apiKey = keyManager.getKey(provider);
      console.log(chalk.green(`✓ Using ${provider === 'anthropic' ? 'Anthropic (Claude)' : 'OpenAI (GPT-4)'} API key`));
    }

    if (!apiKey) {
      throw new Error('No API key available. Please provide an API key to continue.');
    }

    // Create AI provider
    const aiProvider = createProvider(provider, apiKey);
    console.log(chalk.green('✓ AI provider initialized'));

    // ========== DISCOVERY PHASE ==========
    console.log(chalk.cyan('\n🔍 Discovery Phase'));

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

    // ========== EXTRACTION PHASE ==========
    console.log(chalk.cyan('\n🎨 Extraction Phase'));

    const spinner = ora('Extracting tokens...').start();

    let tokenSet: TokenSet;

    try {
      if (selectedMode === 'quick') {
        spinner.text = 'Quick mode: Parsing files with AST...';

        // Get file scanner to retrieve files
        const { FileScanner } = await import('../discovery/scanner');
        const scanner = new FileScanner();
        const allFiles = await scanner.findStyleFiles();

        // Separate CSS/SCSS files from JS/TS files
        const cssFiles = allFiles.filter(f => /\.(css|scss|less|sass)$/.test(f));
        const jsFiles = allFiles.filter(f => /\.(jsx?|tsx?)$/.test(f));

        // Initialize parsers
        const postCSSParser = new PostCSSParser();
        const babelParser = new BabelParser();

        // Create QuickMode instance and extract
        const quickMode = new QuickMode(aiProvider, postCSSParser, babelParser);
        tokenSet = await quickMode.extract(cssFiles, jsFiles);

        spinner.succeed(`Quick extraction complete: ${tokenSet.tokens.length} tokens found`);

      } else if (selectedMode === 'balanced') {
        spinner.text = 'Balanced mode: Single-pass AI analysis...';

        // Get all files
        const { FileScanner } = await import('../discovery/scanner');
        const scanner = new FileScanner();
        const files = await scanner.findStyleFiles();

        // Create BalancedMode instance and extract
        const balancedMode = new BalancedMode(aiProvider);
        tokenSet = await balancedMode.extract(files);

        spinner.succeed(`Balanced extraction complete: ${tokenSet.tokens.length} tokens found`);

      } else if (selectedMode === 'thorough') {
        spinner.text = 'Thorough mode: Multi-pass AI analysis...';

        // Get all files
        const { FileScanner } = await import('../discovery/scanner');
        const scanner = new FileScanner();
        const files = await scanner.findStyleFiles();

        // Create ThoroughMode instance with progress callback
        const thoroughMode = new ThoroughMode(aiProvider);
        tokenSet = await thoroughMode.extract(files, (message: string) => {
          spinner.text = `Thorough mode: ${message}`;
        });

        spinner.succeed(`Thorough extraction complete: ${tokenSet.tokens.length} tokens found`);

      } else {
        throw new Error(`Unknown mode: ${selectedMode}`);
      }
    } catch (error) {
      spinner.fail('Extraction failed');
      throw error;
    }

    // ========== REFINEMENT PHASE ==========
    if (options.interactive !== false && tokenSet.tokens.length > 0) {
      console.log(chalk.cyan('\n🤔 Refinement Phase'));
      tokenSet = await askClarifyingQuestions(tokenSet, { interactive: true });
    }

    // ========== HEALTH ANALYSIS PHASE ==========
    console.log(chalk.cyan('\n🔍 Health Analysis Phase'));
    const healthSpinner = ora('Analyzing design system health...').start();

    let healthReport: HealthReport | null = null;
    try {
      healthReport = await analyzeDesignSystemHealth(tokenSet.tokens, process.cwd());
      healthSpinner.succeed(`Health analysis complete (Score: ${healthReport.summary.healthScore}/100)`);

      // Display key findings
      if (healthReport.undefinedTokens.length > 0) {
        console.log(chalk.yellow(`⚠️  Found ${healthReport.undefinedTokens.length} undefined token references`));
      }
      if (healthReport.orphanedTokens.length > 0) {
        console.log(chalk.gray(`ℹ️  Found ${healthReport.orphanedTokens.length} orphaned tokens (defined but unused)`));
      }
      if (healthReport.namingInconsistencies.length > 0) {
        console.log(chalk.gray(`ℹ️  Found ${healthReport.namingInconsistencies.length} naming inconsistencies`));
      }
    } catch (error) {
      healthSpinner.warn('Health analysis skipped (optional feature)');
      console.log(chalk.gray(`   Reason: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }

    // ========== OUTPUT PHASE ==========
    console.log(chalk.cyan('\n📄 Output Phase'));

    const outputPath = options.output || './figma-tokens.json';
    const outputDir = path.dirname(outputPath);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir) && outputDir !== '.') {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate and write Figma Tokens JSON
    const generator = new FigmaTokensGenerator();
    const figmaTokensJson = generator.generate(tokenSet);
    fs.writeFileSync(outputPath, JSON.stringify(figmaTokensJson, null, 2));
    console.log(chalk.green(`✓ Figma Tokens JSON written to ${outputPath}`));

    // Generate and write report if requested
    if (options.report) {
      const reportPath = outputPath.replace(/\.json$/, '.report.md');
      const reportGenerator = new ReportGenerator(tokenSet);
      const reportContent = reportGenerator.generate();
      fs.writeFileSync(reportPath, reportContent);
      console.log(chalk.green(`✓ Report written to ${reportPath}`));
    }

    // Generate and write audit if requested
    if (options.audit) {
      const auditPath = outputPath.replace(/\.json$/, '.audit.md');
      const auditGenerator = new AuditGenerator(tokenSet);
      const auditResult = auditGenerator.audit();
      const cleanupGenerator = new CleanupTaskGenerator(auditResult);
      const cleanupContent = cleanupGenerator.generateMarkdown();
      fs.writeFileSync(auditPath, cleanupContent);
      console.log(chalk.green(`✓ Audit/cleanup tasks written to ${auditPath}`));
    }

    // Generate and write health report (always generated if health analysis succeeded)
    if (healthReport) {
      const healthPath = outputPath.replace(/\.json$/, '.health.md');
      const healthContent = generateHealthReportMarkdown(healthReport);
      fs.writeFileSync(healthPath, healthContent);
      console.log(chalk.green(`✓ Health report written to ${healthPath}`));
    }

    // ========== SUMMARY ==========
    console.log(chalk.cyan('\n✨ Summary'));
    console.log(chalk.green(`✓ Successfully extracted ${tokenSet.tokens.length} tokens`));
    console.log(chalk.gray(`   • Mode: ${selectedMode}`));
    console.log(chalk.gray(`   • Files analyzed: ${tokenSet.metadata.fileCount}`));
    if (tokenSet.metadata.lineCount) {
      console.log(chalk.gray(`   • Lines processed: ${tokenSet.metadata.lineCount.toLocaleString()}`));
    }
    if (healthReport) {
      console.log(chalk.gray(`   • Health score: ${healthReport.summary.healthScore}/100`));
      console.log(chalk.gray(`   • Definitions: ${healthReport.summary.definitions}`));
      console.log(chalk.gray(`   • References: ${healthReport.summary.references}`));
    }

    // Display next steps
    console.log(chalk.cyan('\n📚 Next Steps:'));
    console.log(chalk.gray('   1. Review the generated tokens in ' + outputPath));
    console.log(chalk.gray('   2. Import into Figma Tokens plugin (Plugins → Figma Tokens → Load from JSON)'));
    if (options.report) {
      console.log(chalk.gray('   3. Check the report for recommendations and insights'));
    }
    if (options.audit) {
      console.log(chalk.gray('   4. Review audit tasks to improve token quality'));
    }
    console.log(chalk.gray('   5. Commit tokens to version control for team sync\n'));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red('\n❌ Token extraction failed:'));
    console.error(chalk.red(errorMessage));

    // Provide helpful guidance
    console.error(chalk.yellow('\n💡 For help:'));
    console.error(chalk.gray('   • Troubleshooting: https://github.com/Convertiv/handoff/blob/main/packages/token-extractor/TROUBLESHOOTING.md'));
    console.error(chalk.gray('   • Report issues: https://github.com/Convertiv/handoff/issues\n'));

    throw error;
  }
}

/**
 * Generate health report markdown
 */
function generateHealthReportMarkdown(healthReport: HealthReport): string {
  const lines: string[] = [];

  // Header
  lines.push('# Design System Health Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`**Health Score:** ${healthReport.summary.healthScore}/100`);
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total Tokens Extracted | ${healthReport.summary.totalTokensExtracted} |`);
  lines.push(`| Token Definitions | ${healthReport.summary.definitions} |`);
  lines.push(`| Token References | ${healthReport.summary.references} |`);
  lines.push(`| Undefined Tokens | ${healthReport.summary.undefinedCount} |`);
  lines.push(`| Orphaned Tokens | ${healthReport.summary.orphanedCount} |`);
  lines.push('');

  // Undefined Tokens
  if (healthReport.undefinedTokens.length > 0) {
    lines.push('## Undefined Token References');
    lines.push('');
    lines.push('These tokens are referenced in your code but never defined. This can cause runtime errors or visual inconsistencies.');
    lines.push('');

    for (const undefinedToken of healthReport.undefinedTokens) {
      lines.push(`### \`${undefinedToken.token}\``);
      lines.push('');
      lines.push(`**Usage Count:** ${undefinedToken.usageCount}`);
      lines.push('');

      if (undefinedToken.suggestedAction) {
        lines.push(`**Suggested Action:** ${undefinedToken.suggestedAction}`);
        lines.push('');
      }

      if (undefinedToken.locations.length > 0) {
        lines.push('**Locations:**');
        lines.push('');
        for (const location of undefinedToken.locations.slice(0, 5)) {
          lines.push(`- \`${location.file}:${location.line}\``);
          if (location.context) {
            lines.push(`  \`\`\`${location.context}\`\`\``);
          }
        }
        if (undefinedToken.locations.length > 5) {
          lines.push(`- *...and ${undefinedToken.locations.length - 5} more locations*`);
        }
        lines.push('');
      }
    }
  }

  // Orphaned Tokens
  if (healthReport.orphanedTokens.length > 0) {
    lines.push('## Orphaned Tokens');
    lines.push('');
    lines.push('These tokens are defined but never used in your code. Consider removing them to reduce maintenance burden.');
    lines.push('');

    for (const orphanedToken of healthReport.orphanedTokens) {
      lines.push(`### \`${orphanedToken.token}\``);
      lines.push('');
      lines.push(`**Defined in:** \`${orphanedToken.definedIn.file}:${orphanedToken.definedIn.line}\``);
      if (orphanedToken.definedIn.context) {
        lines.push(`\`\`\`${orphanedToken.definedIn.context}\`\`\``);
      }
      lines.push('');
      lines.push(`**Recommendation:** ${orphanedToken.recommendation}`);
      lines.push('');
    }
  }

  // Naming Inconsistencies
  if (healthReport.namingInconsistencies.length > 0) {
    lines.push('## Naming Inconsistencies');
    lines.push('');
    lines.push('These tokens have similar names but inconsistent formatting. Standardizing names improves maintainability.');
    lines.push('');

    for (const inconsistency of healthReport.namingInconsistencies) {
      lines.push(`### ${inconsistency.issue}`);
      lines.push('');
      lines.push('**Tokens:**');
      for (const token of inconsistency.tokens) {
        lines.push(`- \`${token}\``);
      }
      lines.push('');
      lines.push(`**Suggestion:** ${inconsistency.suggestion}`);
      lines.push('');
    }
  }

  // Closing
  if (healthReport.undefinedTokens.length === 0 && healthReport.orphanedTokens.length === 0 && healthReport.namingInconsistencies.length === 0) {
    lines.push('## All Clear!');
    lines.push('');
    lines.push('Your design system is in good health. All tokens are properly defined and used consistently.');
  }

  return lines.join('\n');
}
