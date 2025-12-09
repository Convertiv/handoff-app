import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';
import { Logger } from '../utils/logger';

/**
 * Eject the config to the working directory
 * @param handoff
 */
export const ejectConfig = async (handoff: Handoff) => {
  const configPath = path.resolve(path.join(handoff.workingPath, 'handoff.config.js'));
  if (fs.existsSync(configPath)) {
    if (!handoff.force) {
      Logger.error(`Config file already exists. Use "--force" to overwrite.`);
    }
  }
  // load the template as a string
  const template = fs.readFileSync(path.resolve(handoff.modulePath, 'config/config.template.js'), 'utf8');
  fs.writeFileSync(configPath, template);
  Logger.success(`Config ejected to ${configPath}`);
  return handoff;
};

/**
 * Eject the integration to the working directory
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
 * Eject the integration to the working directory
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
