import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';

/**
 * Eject the config to the working directory
 * @param handoff
 */
export const ejectConfig = async (handoff: Handoff) => {
  const configPath = path.resolve(path.join(handoff.workingPath, 'handoff.config.js'));
  if (fs.existsSync(configPath)) {
    if (!handoff.force) {
      console.log(chalk.red(`A config already exists in the working directory.  Use the --force flag to overwrite.`));
    }
  }
  // load the template as a string
  const template = fs.readFileSync(path.resolve(handoff.modulePath, 'config/config.template.js'), 'utf8');
  fs.writeFileSync(configPath, template);
  console.log(chalk.green(`Config ejected to ${configPath}`));
  return handoff;
};

/**
 * Eject the integration to the working directory
 * @param handoff
 */
export const ejectExportables = async (handoff: Handoff) => {
  // does an local integration exist?
  const workingPath = path.resolve(path.join(handoff.workingPath, 'exportables'));
  if (fs.existsSync(workingPath)) {
    if (!handoff.force) {
      console.log(
        chalk.yellow(
          `It appears you already have customized the exportables.  Use the --force flag to merge in any schemas you haven't customized.`
        )
      );
      return;
    }
  }
  const integrationPath = path.resolve(path.join(handoff.modulePath, 'config/exportables'));
  fs.copySync(integrationPath, workingPath, { overwrite: false });
  console.log(chalk.green(`All exportables ejected to ${workingPath}`));
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
      console.log(
        chalk.yellow(`It appears you already have custom pages.  Use the --force flag to merge in any pages you haven't customized.`)
      );
      return;
    }
  }
  const docsPath = path.resolve(path.join(handoff.modulePath, 'config/docs'));
  fs.copySync(docsPath, workingPath, { overwrite: false });
  console.log(chalk.green(`Customizable pages ejected to ${workingPath}`));
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
      console.log(chalk.yellow(`It appears you already have custom theme.  Use the --force flag to replace you haven't customized.`));
      return;
    }
  }

  const currentTheme = handoff.config.app.theme ?? 'default';
  const docsPath = path.resolve(path.join(handoff.modulePath, `src/app/sass/themes/_${currentTheme}.scss`));

  if (fs.existsSync(docsPath)) {
    fs.copySync(docsPath, workingPath, { overwrite: false });
    console.log(chalk.green(`Customizable theme ejected to ${workingPath}`));
  } else {
    fs.copySync(path.resolve(path.join(handoff.modulePath, `src/app/sass/themes/_default.scss`)), workingPath, { overwrite: false });
    console.log(chalk.green(`Customizable theme ejected to ${workingPath}`));
  }

  return handoff;
};

export default ejectConfig;
