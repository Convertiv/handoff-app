import path from 'path';
import Handoff from '../index';
import fs from 'fs-extra';
import chalk from 'chalk';
import { getPathToIntegration } from '../transformers/integration';

/**
 * Make a new exportable component
 * @param handoff
 */
export const makeExportable = async (handoff: Handoff, type: string, name: string) => {
  const config = await handoff.config;
  if(type !== 'component' && type !== 'foundation') {
    console.log(chalk.red(`Exportable type must be either 'component' or 'foundation'`));
    return;
  }
  if(!/^[a-z0-9]+$/i.test(name)) {
    console.log(chalk.red(`Exportable name must be alphanumeric and may contain dashes or underscores`));
    return;
  }
  const workingPath = path.resolve(path.join(handoff.workingPath, 'exportables'));
  if (!fs.existsSync(workingPath)) {
    fs.mkdirSync(workingPath);
  }
  const targetDir = path.resolve(workingPath, `${type}s`);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }
  const target = path.resolve(targetDir, `${name}.json`);
  if (fs.existsSync(target)) {
    if (!handoff.force) {
      console.log(
        chalk.yellow(
          `'${name}' already exists as an exportable.  Use the --force flag revert it to default.`
        )
      );
      return;
    }
  }
  const templatePath = path.resolve(path.join(handoff.modulePath, 'config/templates', 'exportable.json'));
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  template.id = name;
  template.group = type;
  template.options.exporter.search = name;
  template.options.transformer.rootCssClass = name;
  template.options.transformer.cssVariableTemplate = name + template.options.transformer.cssVariableTemplate;
  template.options.transformer.scssVariableTemplate = name + template.options.transformer.scssVariableTemplate;
  fs.writeFileSync(target, `${JSON.stringify(template, null, 2)}`);
  console.log(chalk.green(`New exportable schema ${name}.json was created in ${targetDir}`));
  return handoff;
};
