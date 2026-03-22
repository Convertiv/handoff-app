import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';
import { Logger } from '../utils/logger';

/**
 * Eject the config to the working directory
 * @param handoff
 */
export const ejectConfig = async (handoff: Handoff) => {
  const existingConfigNames = ['handoff.config.ts', 'handoff.config.js', 'handoff.config.cjs', 'handoff.config.json'];
  const existingConfigPaths = existingConfigNames
    .map((name) => path.resolve(path.join(handoff.workingPath, name)))
    .filter((filePath) => fs.existsSync(filePath));
  if (existingConfigPaths.length > 0 && !handoff.force) {
    Logger.error(`Config file already exists. Use "--force" to overwrite.`);
    return handoff;
  }

  const defaultFormat = fs.existsSync(path.resolve(handoff.workingPath, 'tsconfig.json')) ? 'typescript' : 'javascript';
  const formatSelection = await p.select({
    message: 'Which config format would you like to eject?',
    options: [
      { value: 'typescript', label: 'TypeScript', hint: 'Generates handoff.config.ts' },
      { value: 'javascript', label: 'JavaScript', hint: 'Generates handoff.config.js' },
    ],
    initialValue: defaultFormat,
  });

  if (p.isCancel(formatSelection)) {
    Logger.warn('Config eject cancelled.');
    return handoff;
  }

  const useTypeScript = formatSelection === 'typescript';
  const configPath = path.resolve(path.join(handoff.workingPath, useTypeScript ? 'handoff.config.ts' : 'handoff.config.js'));
  const templatePath = path.resolve(handoff.modulePath, useTypeScript ? 'config/config.template.ts' : 'config/config.template.js');

  const template = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(configPath, template);
  Logger.success(`Config ejected to ${configPath}`);
  return handoff;
};

/**
 * Eject pages to the working directory
 * @param handoff
 */
export const ejectPages = async (handoff: Handoff) => {
  // does an local page exist?
  const workingPath = path.resolve(path.join(handoff.workingPath, 'pages'));
  if (fs.existsSync(workingPath)) {
    if (!handoff.force) {
      Logger.warn(`It appears you already have custom pages.  Use the --force flag to merge in any pages you haven't customized.`);
      return;
    }
  }
  const docsPath = path.resolve(path.join(handoff.modulePath, 'config/docs'));
  fs.copySync(docsPath, workingPath, { overwrite: false });
  Logger.success(`Customizable pages ejected to ${workingPath}`);
  return handoff;
};

/**
 * Eject theme to the working directory
 * @param handoff
 */
export const ejectTheme = async (handoff: Handoff) => {
  // does an local page exist?
  const workingPath = path.resolve(path.join(handoff.workingPath, 'theme', 'default.scss'));
  if (fs.existsSync(workingPath)) {
    if (!handoff.force) {
      Logger.warn(`It appears you already have custom theme.  Use the --force flag to replace you haven't customized.`);
      return;
    }
  }

  const currentTheme = handoff.config.app.theme ?? 'default';
  const docsPath = path.resolve(path.join(handoff.modulePath, `src/app/sass/themes/_${currentTheme}.scss`));

  if (fs.existsSync(docsPath)) {
    fs.copySync(docsPath, workingPath, { overwrite: false });
    Logger.success(`Customizable theme ejected to ${workingPath}`);
  } else {
    fs.copySync(path.resolve(path.join(handoff.modulePath, `src/app/sass/themes/_default.scss`)), workingPath, { overwrite: false });
    Logger.success(`Customizable theme ejected to ${workingPath}`);
  }

  return handoff;
};

export default ejectConfig;
