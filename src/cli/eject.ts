import path from 'path';
import Handoff from '../index';
import fs from 'fs-extra';
import chalk from 'chalk';
import { getPathToIntegration } from '../transformers/integration';
import { getClientConfig } from '../config';
import { ClientConfig } from 'handoff/types/config';

/**
 * Eject the config to the working directory
 * @param handoff
 */
export const ejectConfig = async (handoff: Handoff) => {
  const config = getClientConfig(handoff.config);
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
  const config = handoff.config;

  if (!config.integration) {
    console.log(chalk.red(`Unable to eject integration as it is not defined.`));
    return handoff;
  }

  const integration = config.integration.name;

  // is the custom integration already being used?
  if (integration === 'custom') {
    console.log(chalk.red(`Custom integration cannot be ejected as it's destination matches the source.`));
    return;
  }

  // does an local integration exist?
  const workingPath = path.resolve(path.join(handoff.workingPath, 'integration'));
  if (fs.existsSync(workingPath)) {
    if (!handoff.force) {
      console.log(chalk.red(`An integration already exists in the working directory. Use the --force flag to overwrite.`));
      return;
    }
  }

  // perform integration ejection
  const integrationPath = getPathToIntegration(handoff);
  fs.copySync(integrationPath, workingPath, { overwrite: false });
  console.log(chalk.green(`${config?.integration?.name} ${config?.integration?.version} ejected to ${workingPath}`));

  // ensure local configuration is set up to support the ejected integration
  const localConfigPath = path.join(handoff.workingPath, 'handoff.config.json');
  !fs.existsSync(localConfigPath) && (await ejectConfig(handoff));

  // update (and re-write) the ejected configuration with custom integration
  const localConfigBuffer = fs.readFileSync(localConfigPath);
  const localConfig = JSON.parse(localConfigBuffer.toString()) as ClientConfig;
  localConfig.integration = { name: 'custom', version: '' };
  fs.writeFileSync(localConfigPath, `${JSON.stringify(localConfig, null, 2)}`);

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
  // does an local page exist?
  const workingPath = path.resolve(path.join(handoff.workingPath, 'theme', 'default.scss'));
  if (fs.existsSync(workingPath)) {
    if (!handoff.force) {
      console.log(
        chalk.yellow(`It appears you already have custom theme.  Use the --force flag to replace you haven't customized.`)
      );
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
