import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

/**
 * Environment variables that were already set when the process started. They outrank every `.env`
 * file, so an inline `DATABASE_URL=… handoff-app db:migrate` wins over what a file says. Recorded
 * before the base `.env` is read, which is why this module is imported first.
 */
const processEnvKeys = new Set(Object.keys(process.env));

// The base `.env`, read from the directory the command runs in, at module load so `process.env` is
// populated before the first Handoff is constructed.
dotenv.config();

/**
 * Apply `.env.<profile>` on top of the base `.env` for the selected profile. The file is optional:
 * a profile needs a config file, not an env file.
 *
 * Precedence is the process environment, then the profile env file, then `.env`. Dotenv's own
 * `override` option cannot express that - it would replace the values the shell supplied too - so
 * the keys already present at startup are skipped here.
 */
export const loadProfileEnv = (profile?: string, directory: string = process.cwd()): void => {
  if (!profile) {
    return;
  }

  const envPath = path.resolve(directory, `.env.${profile}`);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath));
  for (const [key, value] of Object.entries(parsed)) {
    if (processEnvKeys.has(key)) {
      continue;
    }
    process.env[key] = value;
  }
};
