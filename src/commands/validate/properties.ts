import chalk from 'chalk';
import { CommandModule } from 'yargs';
import Handoff from '../../';
import { validateComponent, PropertyValidationResult } from '../../transformers/preview/property-validator';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

const command: CommandModule<{}, SharedArgs> = {
  command: 'validate:properties',
  describe: 'Validate component property definitions and preview values',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: SharedArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    handoff.preRunner();

    const runtimeComponents = handoff.runtimeConfig?.entries?.components ?? {};
    const componentIds = Object.keys(runtimeComponents);

    if (componentIds.length === 0) {
      console.log(chalk.yellow('No components found.'));
      return;
    }

    console.log(chalk.bold(`\nValidating ${componentIds.length} component(s)...\n`));

    const results: PropertyValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const componentId of componentIds) {
      const component = runtimeComponents[componentId];
      const properties = component.properties ?? {};
      const previews = component.previews ?? {};

      if (Object.keys(properties).length === 0) {
        continue;
      }

      const result = validateComponent(componentId, properties, previews);
      results.push(result);
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;

      if (result.errors.length > 0 || result.warnings.length > 0) {
        const status = result.valid ? chalk.yellow('WARN') : chalk.red('FAIL');
        console.log(`${status} ${chalk.bold(componentId)}`);

        for (const err of result.errors) {
          console.log(chalk.red(`  ✗ ${err.code}: ${err.message}`));
          console.log(chalk.gray(`    at ${err.path}`));
        }
        for (const warn of result.warnings) {
          console.log(chalk.yellow(`  ⚠ ${warn.code}: ${warn.message}`));
          console.log(chalk.gray(`    at ${warn.path}`));
        }
        console.log();
      } else {
        console.log(`${chalk.green('PASS')} ${chalk.bold(componentId)}`);
      }
    }

    console.log(chalk.bold('\n── Summary ──'));
    console.log(`Components: ${componentIds.length}`);
    console.log(`Errors:     ${totalErrors > 0 ? chalk.red(totalErrors) : chalk.green(0)}`);
    console.log(`Warnings:   ${totalWarnings > 0 ? chalk.yellow(totalWarnings) : chalk.green(0)}`);
    console.log();

    if (totalErrors > 0) {
      process.exitCode = 1;
    }
  },
};

export default command;
