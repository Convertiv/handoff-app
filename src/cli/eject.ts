import path from 'path';
import Handoff from '../index';
import fs from 'fs-extra';
import chalk from 'chalk';
import { getPathToIntegration } from '../transformers/integration';

/**
 * Eject the config to the working directory
 * @param handoff
 */
export const ejectConfig = async (handoff: Handoff) => {
  const config = await handoff.config;
  const configPath = path.resolve(path.join(handoff.workingPath, 'handoff.config.json'));
  if (fs.existsSync(configPath)) {
    if (!handoff.force) {
      console.log(chalk.red(`A config already exists in the working directory.  Use the --force flag to overwrite.`));
    }
  }
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}`);
  console.log(chalk.green(`Config ejected to ${configPath}`));
  return handoff;
};

/**
 * Eject the integration to the working directory
 * @param handoff
 */
export const ejectIntegration = async (handoff: Handoff) => {
  const config = await handoff.config;
  // does an local integration exist?
  const workingPath = path.resolve(path.join(handoff.workingPath, 'integration'));
  console.log(workingPath);
  if (fs.existsSync(workingPath)) {
    if (!handoff.force) {
      console.log(chalk.red(`An integration already exists in the working directory.  Use the --force flag to overwrite.`));
      return;
    }
  }
  const integrationPath = getPathToIntegration();
  fs.copySync(integrationPath, workingPath, { overwrite: false });
  console.log(chalk.green(`${config?.integration?.name} ${config?.integration?.version} ejected to ${workingPath}`));
  return handoff;
};

/**
 * Eject the integration to the working directory
 * @param handoff
 */
export const ejectExportables = async (handoff: Handoff) => {
  const config = await handoff.config;
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
  const config = await handoff.config;
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
  const config = await handoff.config;
  // does an local page exist?
  const workingPath = path.resolve(path.join(handoff.workingPath, 'theme', 'main.scss'));
  if (fs.existsSync(workingPath)) {
    if (!handoff.force) {
      console.log(
        chalk.yellow(`It appears you already have custom theme.  Use the --force flag to replace you haven't customized.`)
      );
      return;
    }
  }
  const currentTheme = handoff.config.theme ?? 'default';
  const docsPath = path.resolve(path.join(handoff.modulePath, `src/app/sass/_${currentTheme}.scss`));
  if(fs.existsSync(docsPath)){
    fs.copySync(docsPath, workingPath, { overwrite: false });
    console.log(chalk.green(`Customizable theme ejected to ${workingPath}`));
  }else {
    console.log(chalk.green(`Customizable theme ejected to ${workingPath}`));
  }
  
  return handoff;
};

export default ejectConfig;
