import path from 'path';
import Handoff from '../index';
import fs from 'fs-extra';
import chalk from 'chalk';
import { prompt } from '../utils/prompt';

/**
 * Make a new exportable component
 * @param handoff
 */
export const makeExportable = async (handoff: Handoff, type: string, name: string) => {
  const config = await handoff.config;
  if (type !== 'component' && type !== 'foundation') {
    console.log(chalk.red(`Exportable type must be either 'component' or 'foundation'`));
    return;
  }
  if (!/^[a-z0-9]+$/i.test(name)) {
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
      console.log(chalk.yellow(`'${name}' already exists as an exportable.  Use the --force flag revert it to default.`));
      return;
    }
  }
  const templatePath = path.resolve(path.join(handoff.modulePath, 'config/templates', 'exportable.json'));
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  template.id = name;
  template.group = type.slice(0, 1).toUpperCase() + type.slice(1, type.length) + 's';
  template.options.exporter.search = name.slice(0, 1).toUpperCase() + name.slice(1, type.length);
  template.options.transformer.cssRootClass = name;
  fs.writeFileSync(target, `${JSON.stringify(template, null, 2)}`);
  console.log(chalk.green(`New exportable schema ${name}.json was created in ${targetDir}`));
  return handoff;
};

/**
 * Make a new exportable component
 * @param handoff
 */
export const makeTemplate = async (handoff: Handoff, component: string, state: string) => {
  if (!handoff?.integrationObject?.entries?.templates) {
    console.log(chalk.red(`Integration does not specify entry for templates.`));
    return;
  }

  if (!component) {
    console.log(chalk.red(`Template component must be set`));
    return;
  }

  if (!state) {
    state = 'default';
  }

  if (!/^[a-z0-9]+$/i.test(component)) {
    console.log(chalk.red(`Template component must be alphanumeric and may contain dashes or underscores`));
    return;
  }

  if (!/^[a-z0-9]+$/i.test(state)) {
    console.log(chalk.red(`Template state must be alphanumeric and may contain dashes or underscores`));
    return;
  }

  const workingPath = path.resolve(handoff.integrationObject.entries.templates, component);

  if (!fs.existsSync(workingPath)) {
    fs.mkdirSync(workingPath, { recursive: true });
  }

  const target = path.resolve(workingPath, `${state}.html`);
  if (fs.existsSync(target)) {
    if (!handoff.force) {
      console.log(chalk.yellow(`'${state}' already exists as custom template.  Use the --force flag revert it to default.`));
      return;
    }
  }
  const templatePath = path.resolve(path.join(handoff.modulePath, 'config/templates', 'template.html'));
  const template = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(target, template);
  console.log(chalk.green(`New template ${state}.html was created in ${workingPath}`));
  return handoff;
};

/**
 * Make a new docs page
 * @param handoff
 */
export const makePage = async (handoff: Handoff, name: string, parent: string | undefined) => {
  const config = await handoff.config;
  let type = 'mdx';
  if (!name) {
    console.log(chalk.red(`Page name must be set`));
    return;
  }
  if (!/^[a-z0-9]+$/i.test(name)) {
    console.log(chalk.red(`Page name must be alphanumeric and may contain dashes or underscores`));
    return;
  }

  const checkType = await prompt(chalk.green(`By default this will create an MDX (.mdx) page supporting react components in your markdown. If you'd prefer normal markdown (.md), type 'markdown': `));
  if (checkType === 'markdown') {
    type = 'md';
  }
  let workingPath, sourcePath, templatePath;
  if (parent) {
    if (!/^[a-z0-9]+$/i.test(parent)) {
      console.log(chalk.red(`Parent name must be alphanumeric and may contain dashes or underscores`));
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
      console.log(chalk.yellow(`'${name}' already exists as custom page.  Use the --force flag revert it to default.`));
      return;
    }
  }

  templatePath = path.resolve(path.join(handoff.modulePath, 'config/templates', `page.${type}`));
  if (fs.existsSync(sourcePath)) {
    templatePath = sourcePath;
  }
  const template = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(target, template);
  console.log(chalk.green(`New template ${name}.${type} was created in ${workingPath}`));
  return handoff;
};

/**
 * Make a new docs page
 * @param handoff
 */
export const makeSnippet = async (handoff: Handoff, name: string) => {
  const config = await handoff.config;
  if (!name) {
    console.log(chalk.red(`Snippet name must be set`));
    return;
  }
  if (!/^[a-z0-9]+$/i.test(name)) {
    console.log(chalk.red(`Snippet name must be alphanumeric and may contain dashes or underscores`));
    return;
  }
  name = name.replace('.html', '');

  let workingPath = path.resolve(path.join(handoff.workingPath, `integration/snippets`));
  if (!fs.existsSync(workingPath)) {
    fs.mkdirSync(workingPath, { recursive: true });
  }
  const targetHtml = path.resolve(workingPath, `${name}.html`);
  if (fs.existsSync(targetHtml)) {
    if (!handoff.force) {
      console.log(chalk.yellow(`'${name}' already exists as custom snippet.`));
      return;
    }
  }
  const htmlPath = path.resolve(path.join(handoff.modulePath, 'config', 'snippet.html'));
  const htmlTemplate = fs.readFileSync(htmlPath, 'utf8');
  fs.writeFileSync(targetHtml, htmlTemplate);
  console.log(chalk.green(`New snippet ${name}.html was created in ${workingPath}`));

  const writeJSFile = await prompt(chalk.green(`Would you like us to generate a supporting javascript file ${name}.js? (y/n): `));
  if (writeJSFile === 'y') {
    console.log(chalk.green(`Writing ${name}.js.\n`));
    const jsPath = path.resolve(path.join(handoff.modulePath, 'config', 'snippet.js'));
    const jsTemplate = fs.readFileSync(jsPath, 'utf8');
    fs.writeFileSync(path.resolve(workingPath, `${name}.js`), jsTemplate);
  }
  const writeSassFile = await prompt(chalk.green(`Would you like us to generate a supporting SASS file ${name}.scss? (y/n): `));

  if (writeSassFile === 'y') {
    console.log(chalk.green(`Writing ${name}.scss.\n`));
    const scssPath = path.resolve(path.join(handoff.modulePath, 'config', 'snippet.scss'));
    const scssTemplate = fs.readFileSync(scssPath, 'utf8');
    fs.writeFileSync(path.resolve(workingPath, `${name}.scss`), scssTemplate);
  }

  return handoff;
};
