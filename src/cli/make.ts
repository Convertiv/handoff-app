import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';
import { Logger } from '../utils/logger';
import { prompt } from '../utils/prompt';

/**
 * Make a new exportable component
 * @param handoff
 */
export const makeTemplate = async (handoff: Handoff, component: string, state: string) => {
  if (!handoff?.runtimeConfig?.entries?.templates) {
    Logger.error(`Runtime config does not specify entry for templates.`);
    return;
  }

  if (!component) {
    Logger.error(`Template component must be set`);
    return;
  }

  if (!state) {
    state = 'default';
  }

  if (!/^[a-z0-9]+$/i.test(component)) {
    Logger.error(`Template component must be alphanumeric and may contain dashes or underscores`);
    return;
  }

  if (!/^[a-z0-9]+$/i.test(state)) {
    Logger.error(`Template state must be alphanumeric and may contain dashes or underscores`);
    return;
  }

  const workingPath = path.resolve(handoff.runtimeConfig.entries.templates, component);

  if (!fs.existsSync(workingPath)) {
    fs.mkdirSync(workingPath, { recursive: true });
  }

  const target = path.resolve(workingPath, `${state}.html`);
  if (fs.existsSync(target)) {
    if (!handoff.force) {
      Logger.warn(`'${state}' already exists as custom template.  Use the --force flag revert it to default.`);
      return;
    }
  }
  const templatePath = path.resolve(path.join(handoff.modulePath, 'config/templates', 'template.html'));
  const template = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(target, template);
  Logger.success(`New template ${state}.html was created in ${workingPath}`);
  return handoff;
};

/**
 * Make a new docs page
 * @param handoff
 */
export const makePage = async (handoff: Handoff, name: string, parent: string | undefined) => {
  let type = 'md';
  if (!name) {
    Logger.error(`Page name must be set`);
    return;
  }
  if (!/^[a-z0-9]+$/i.test(name)) {
    Logger.error(`Page name must be alphanumeric and may contain dashes or underscores`);
    return;
  }

  let workingPath, sourcePath, templatePath;
  if (parent) {
    if (!/^[a-z0-9]+$/i.test(parent)) {
      Logger.error(`Parent name must be alphanumeric and may contain dashes or underscores`);
      return;
    }
    workingPath = path.resolve(path.join(handoff.workingPath, `pages`, parent));
    sourcePath = path.resolve(path.join(handoff.modulePath, `config/docs`, parent, `${name}.${type}`));
  } else {
    workingPath = path.resolve(path.join(handoff.workingPath, `pages`));
    sourcePath = path.resolve(path.join(handoff.modulePath, `config/docs`, `${name}.${type}`));
  }

  if (!fs.existsSync(workingPath)) {
    fs.mkdirSync(workingPath, { recursive: true });
  }

  const target = path.resolve(workingPath, `${name}.${type}`);
  if (fs.existsSync(target)) {
    if (!handoff.force) {
      Logger.warn(`'${name}' already exists as custom page.  Use the --force flag revert it to default.`);
      return;
    }
  }

  templatePath = path.resolve(path.join(handoff.modulePath, 'config/templates', `page.${type}`));
  if (fs.existsSync(sourcePath)) {
    templatePath = sourcePath;
  }
  const template = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(target, template);
  Logger.success(`New template ${name}.${type} was created in ${workingPath}`);
  return handoff;
};

/**
 * Make a new docs page
 * @param handoff
 */
export const makeComponent = async (handoff: Handoff, name: string) => {
  if (!name) {
    Logger.error(`Component name must be set`);
    return;
  }

  const version = '1.0.0';

  name = name.replace('.html', '');

  let workingPath = path.resolve(path.join(handoff.workingPath, `integration/components/${name}/${version}`));
  if (!fs.existsSync(workingPath)) {
    fs.mkdirSync(workingPath, { recursive: true });
  }
  const targetHtml = path.resolve(workingPath, `${name}.hbs`);
  if (fs.existsSync(targetHtml)) {
    if (!handoff.force) {
      Logger.warn(`'${name}' already exists as custom component.`);
      return;
    }
  }
  const templatePath = path.join(handoff.modulePath, 'config', 'templates/integration/components/template/1.0.0');
  const htmlPath = path.resolve(templatePath, 'template.hbs');
  const htmlTemplate = fs.readFileSync(htmlPath, 'utf8');
  fs.writeFileSync(targetHtml, htmlTemplate);
  Logger.success(`New component ${name}.hbs was created in ${workingPath}`);

  const jsonpath = path.resolve(templatePath, 'template.json');
  const jsonTemplate = fs.readFileSync(jsonpath, 'utf8');
  fs.writeFileSync(path.resolve(workingPath, `${name}.json`), jsonTemplate);

  const writeJSFile = await prompt(chalk.green(`Would you like us to generate a supporting javascript file ${name}.js? (y/n): `));
  if (writeJSFile === 'y') {
    Logger.success(`Writing ${name}.js.\n`);
    const jsPath = path.resolve(templatePath, 'template.js');
    const jsTemplate = fs.readFileSync(jsPath, 'utf8');
    fs.writeFileSync(path.resolve(workingPath, `${name}.js`), jsTemplate);
  }
  const writeSassFile = await prompt(chalk.green(`Would you like us to generate a supporting SASS file ${name}.scss? (y/n): `));

  if (writeSassFile === 'y') {
    Logger.success(`Writing ${name}.scss.\n`);
    const scssPath = path.resolve(templatePath, 'template.scss');
    const scssTemplate = fs.readFileSync(scssPath, 'utf8');
    fs.writeFileSync(path.resolve(workingPath, `${name}.scss`), scssTemplate);
  }

  return handoff;
};
