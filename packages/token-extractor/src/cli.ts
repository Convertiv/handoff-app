#!/usr/bin/env node
import { Command } from 'commander';
import { extractCommand } from './commands/extract';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('token-extractor')
    .description('Extract design tokens from code and generate Figma Tokens JSON')
    .version('0.1.0');

  program
    .command('extract')
    .description('Extract tokens from current directory')
    .option('-m, --mode <mode>', 'Analysis mode: quick, balanced, or thorough')
    .option('--no-interactive', 'Skip interactive questions')
    .option('-o, --output <path>', 'Output file path', './figma-tokens.json')
    .option('--no-report', 'Skip generating report')
    .option('--no-audit', 'Skip generating audit/cleanup tasks')
    .action(extractCommand);

  return program;
}

// Run CLI if executed directly
if (require.main === module) {
  createCLI().parse(process.argv);
}
