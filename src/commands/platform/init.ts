import * as p from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { CommandModule } from 'yargs';
import { CliProject, downloadFile, getManifest, listProjects } from '../../platform/client';
import { getToken } from '../../platform/credentials';

const DEFAULT_PLATFORM_URL = 'http://localhost:3000';

const CONFIG_FILES = ['handoff.config.json', 'handoff.config.js', 'handoff.config.cjs'] as const;

export interface PlatformInitArgs {
  url?: string;
}

const command: CommandModule<{}, PlatformInitArgs> = {
  command: 'platform:init',
  describe: 'Link this directory to a Handoff platform project',
  builder: (yargs) => {
    return yargs.option('url', {
      type: 'string',
      description: 'Platform URL',
      default: process.env.HANDOFF_PLATFORM_URL || DEFAULT_PLATFORM_URL,
    });
  },
  handler: async (args) => {
    const baseUrl = (args.url || DEFAULT_PLATFORM_URL).replace(/\/+$/, '');
    const workingDir = process.cwd();

    p.intro(chalk.bold('Handoff Platform Init'));

    // 1. Check login
    const token = getToken(baseUrl);
    if (!token) {
      p.cancel(`Not logged in to ${baseUrl}. Run ${chalk.cyan('handoff-app platform:login')} first.`);
      process.exit(1);
    }

    const spinner = p.spinner();

    try {
      // 2. Fetch project list
      spinner.start('Fetching projects...');
      const projects = await listProjects(baseUrl, token);
      spinner.stop('Projects loaded.');

      if (projects.length === 0) {
        p.cancel('No projects found. Create a project in the Handoff platform first.');
        process.exit(1);
      }

      // 3. Interactive project selection
      const projectId = await p.select({
        message: 'Select a project to link:',
        options: projects.map((proj: CliProject) => ({
          value: proj.id,
          label: `${proj.name} (${proj.orgName})`,
          hint: `${proj.slug} — ${proj.role}`,
        })),
      });

      if (p.isCancel(projectId)) {
        p.cancel('Init cancelled.');
        process.exit(0);
      }

      const selectedProject = projects.find((proj) => proj.id === projectId)!;

      // 4. Check if a local config exists
      const existingConfigFile = CONFIG_FILES.find((file) => fs.existsSync(path.resolve(workingDir, file)));

      if (!existingConfigFile) {
        // No local config — pull it from the remote project
        spinner.start('No local config found. Fetching config from platform...');

        try {
          const manifest = await getManifest(baseUrl, token, selectedProject.id);
          // Look for handoff.config.js in the manifest
          const remoteConfigKey = Object.keys(manifest.files).find(
            (key) => key === 'handoff.config.js' || key === 'handoff.config.json' || key === 'handoff.config.cjs'
          );

          if (remoteConfigKey) {
            const content = await downloadFile(baseUrl, token, selectedProject.id, remoteConfigKey);
            const localConfigPath = path.resolve(workingDir, remoteConfigKey);
            fs.writeFileSync(localConfigPath, content);
            spinner.stop(`Downloaded ${remoteConfigKey} from platform.`);

            // Now inject the platform fields into it
            await injectPlatformFields(localConfigPath, selectedProject.id, baseUrl);
          } else {
            spinner.stop('No remote config found either. Creating a new config.');
            // Create a minimal config with just the platform fields
            const configPath = path.resolve(workingDir, 'handoff.config.js');
            const configContent = generateMinimalConfig(selectedProject.id, baseUrl);
            fs.writeFileSync(configPath, configContent);
          }
        } catch (err: any) {
          spinner.stop('Could not fetch remote config.');
          // Fall back to creating a minimal config
          const configPath = path.resolve(workingDir, 'handoff.config.js');
          const configContent = generateMinimalConfig(selectedProject.id, baseUrl);
          fs.writeFileSync(configPath, configContent);
        }
      } else {
        // Local config exists — add/update platform fields
        const configPath = path.resolve(workingDir, existingConfigFile);
        await injectPlatformFields(configPath, selectedProject.id, baseUrl);
      }

      p.note(
        [
          `Project: ${chalk.bold(selectedProject.name)}`,
          `Organization: ${chalk.dim(selectedProject.orgName)}`,
          `Project ID: ${chalk.dim(selectedProject.id)}`,
          `Platform: ${chalk.dim(baseUrl)}`,
        ].join('\n'),
        'Linked successfully'
      );

      p.outro(`Run ${chalk.cyan('handoff-app platform:pull')} to sync files from the platform.`);
    } catch (err: any) {
      spinner.stop('Init failed.');
      p.cancel(err.message || 'Init failed');
      process.exit(1);
    }
  },
};

/**
 * Inject platformProjectId and platformUrl into an existing config file.
 *
 * For JSON files, parse and re-serialize.
 * For JS/CJS files, use a regex approach to add/update the fields.
 */
async function injectPlatformFields(configPath: string, projectId: string, platformUrl: string): Promise<void> {
  const ext = path.extname(configPath);

  if (ext === '.json') {
    const config = fs.readJsonSync(configPath);
    config.platformProjectId = projectId;
    config.platformUrl = platformUrl;
    fs.writeJsonSync(configPath, config, { spaces: 2 });
  } else {
    // JS or CJS file — read as text, inject/replace fields
    let content = fs.readFileSync(configPath, 'utf8');

    content = upsertConfigField(content, 'platformProjectId', JSON.stringify(projectId));
    content = upsertConfigField(content, 'platformUrl', JSON.stringify(platformUrl));

    fs.writeFileSync(configPath, content, 'utf8');
  }
}

/**
 * Insert or replace a top-level field in a JS config export.
 * Looks for `fieldName: ...` and replaces the value, or appends
 * the field before the closing `};` of module.exports.
 */
function upsertConfigField(source: string, fieldName: string, value: string): string {
  // Pattern to match an existing field assignment (with optional trailing comma)
  const existingPattern = new RegExp(`(${fieldName}\\s*:\\s*)([^,}\\n]+)(,?)`);
  if (existingPattern.test(source)) {
    return source.replace(existingPattern, `$1${value}$3`);
  }

  // Insert before the last `};` (end of module.exports)
  // Handle both `module.exports = {` and `export default {` styles
  // Also ensure the previous line ends with a comma so the JS stays valid
  const closingBrace = /(\n)(};?\s*$)/;
  if (closingBrace.test(source)) {
    // Ensure the last property line before the closing brace has a trailing comma
    source = ensureTrailingComma(source);
    return source.replace(closingBrace, `$1  ${fieldName}: ${value},\n$2`);
  }

  // Fallback: just append as a comment warning
  return source + `\n// Added by platform:init — could not auto-inject:\n// ${fieldName}: ${value}\n`;
}

/**
 * Ensure the last property line before the closing `};` has a trailing comma.
 * This prevents invalid JS when appending new properties to an object literal.
 */
function ensureTrailingComma(source: string): string {
  const lines = source.split('\n');

  // Find the closing `};` or `}` at the start of a line (module.exports / export default)
  let closingIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^};?\s*$/.test(lines[i])) {
      closingIdx = i;
      break;
    }
  }

  if (closingIdx <= 0) return source;

  // Walk backwards past blank lines and comment-only lines to find the last property line
  let lastPropIdx = closingIdx - 1;
  while (lastPropIdx >= 0 && (/^\s*$/.test(lines[lastPropIdx]) || /^\s*\/\//.test(lines[lastPropIdx]))) {
    lastPropIdx--;
  }

  if (lastPropIdx < 0) return source;

  // Strip inline comments for the check, but preserve them in the output
  const stripped = lines[lastPropIdx].replace(/\s*\/\/.*$/, '').trimEnd();
  if (stripped.length > 0 && !stripped.endsWith(',') && !stripped.endsWith('{')) {
    // Insert a comma after the last significant character, preserving any inline comment
    lines[lastPropIdx] = lines[lastPropIdx].replace(/(\S)(\s*(?:\/\/.*)?)$/, '$1,$2');
  }

  return lines.join('\n');
}

/**
 * Generate a minimal handoff.config.js with platform fields.
 */
function generateMinimalConfig(projectId: string, platformUrl: string): string {
  return `module.exports = {
  platformProjectId: ${JSON.stringify(projectId)},
  platformUrl: ${JSON.stringify(platformUrl)},
};
`;
}

export default command;
