import { addToCatalog, isIncluded } from '../config/catalog-include';
import { isComponentDirectory } from '../config/runtime';
import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';
import { Logger } from '../utils/logger';

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
  if (!/^[a-z0-9_-]+$/i.test(name)) {
    Logger.error(`Page name must be alphanumeric and may contain dashes or underscores`);
    return;
  }

  let workingPath, sourcePath, templatePath;
  if (parent) {
    if (!/^[a-z0-9_-]+$/i.test(parent)) {
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
 * Make a new component
 * @param handoff
 */
const DEFAULT_COMPONENTS_DIR = 'components';

export const makeComponent = async (handoff: Handoff, name: string) => {
  if (!name) {
    Logger.error(`Component name must be set`);
    return;
  }

  name = name.replace('.html', '');

  const configuredRoot = handoff.config.catalog?.include?.[0];
  const root = path.resolve(handoff.workingPath, configuredRoot ?? DEFAULT_COMPONENTS_DIR);
  const componentsRoot = isComponentDirectory(root) ? path.dirname(root) : root;

  let workingPath = path.resolve(componentsRoot, name);
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
  const templatePath = path.join(handoff.modulePath, 'config', 'templates/component');
  const htmlPath = path.resolve(templatePath, 'template.hbs');
  const htmlTemplate = fs.readFileSync(htmlPath, 'utf8');
  fs.writeFileSync(targetHtml, htmlTemplate);
  Logger.success(`New component ${name}.hbs was created in ${workingPath}`);

  const writeJSFile = await p.confirm({
    message: `Generate a supporting javascript file ${name}.js?`,
    initialValue: false,
  });
  if (writeJSFile === true) {
    Logger.success(`Writing ${name}.js.\n`);
    const jsPath = path.resolve(templatePath, 'template.js');
    const jsTemplate = fs.readFileSync(jsPath, 'utf8');
    fs.writeFileSync(path.resolve(workingPath, `${name}.js`), jsTemplate);
  }

  const writeSassFile = await p.confirm({
    message: `Generate a supporting SASS file ${name}.scss?`,
    initialValue: false,
  });
  if (writeSassFile === true) {
    Logger.success(`Writing ${name}.scss.\n`);
    const scssPath = path.resolve(templatePath, 'template.scss');
    const scssTemplate = fs.readFileSync(scssPath, 'utf8');
    fs.writeFileSync(path.resolve(workingPath, `${name}.scss`), scssTemplate);
  }

  // `implementation` names the template, so `entries` carries only supporting files.
  const declarationEntries: string[] = [];
  if (writeJSFile === true) {
    declarationEntries.push(`js: './${name}.js'`);
  }
  if (writeSassFile === true) {
    declarationEntries.push(`scss: './${name}.scss'`);
  }
  const entriesBlock = declarationEntries.length ? `\n  entries: {\n    ${declarationEntries.join(',\n    ')}\n  },` : '';

  const declarationContent = `const { defineCatalogItem } = require('handoff-app/handlebars');

exports.default = defineCatalogItem({
  id: '${name}',
  name: '',
  description: '',
  group: '',
  type: 'element',
  implementation: './${name}.hbs',${entriesBlock}
});

exports.Default = {
  args: {},
};
`;

  fs.writeFileSync(path.resolve(workingPath, `${name}.handoff.js`), declarationContent);
  Logger.success(`New component declaration ${name}.handoff.js was created in ${workingPath}`);

  if (!isIncluded(handoff, workingPath)) {
    const result = await addToCatalog(handoff, [workingPath]);
    if (result.status === 'unsupported') Logger.warn(`Add ${result.pending.join(', ')} to catalog.include in handoff.config.`);
  }

  return handoff;
};
