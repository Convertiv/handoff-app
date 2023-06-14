import path from 'path';
import Handoff from '.';
import fs from 'fs-extra';
import chalk from 'chalk';

/**
 * Eject the config to the working directory
 * @param handoff 
 */
export const ejectConfig = async (handoff: Handoff) => {
  const config = await handoff.config;
  const configPath = path.resolve(path.join(handoff.workingPath, 'handoff.config.json'));
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}`);
  console.log(chalk.green(`Config ejected to ${configPath}`));
};
