import * as p from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { CommandModule } from 'yargs';
import Handoff from '../../';
import { CliProject, listProjects, PlatformApiError } from '../../platform/client';
import { getToken } from '../../platform/credentials';
import { computePushDiff, createPushProject, pushProject } from '../../platform/sync';

const DEFAULT_PLATFORM_URL = 'http://localhost:3000';

const CONFIG_FILES = ['handoff.config.json', 'handoff.config.js', 'handoff.config.cjs'] as const;

export interface PlatformPushArgs {
  url?: string;
  force?: boolean;
  debug?: boolean;
}

const command: CommandModule<{}, PlatformPushArgs> = {
  command: 'platform:push',
  describe: 'Push local changes to the Handoff platform',
  builder: (yargs) => {
    return yargs
      .option('url', {
        type: 'string',
        description: 'Platform URL (overrides config)',
      })
      .option('force', {
        alias: 'f',
        type: 'boolean',
        description: 'Push without confirmation prompt',
        default: false,
      })
      .option('debug', {
        alias: 'd',
        type: 'boolean',
        description: 'Enable debug mode',
      });
  },
  handler: async (args) => {
    const handoff = new Handoff(args.debug, args.force);
    const config = handoff.config;

    const baseUrl = (args.url || config?.platformUrl || process.env.HANDOFF_PLATFORM_URL || DEFAULT_PLATFORM_URL).replace(/\/+$/, '');
    const projectId = config?.platformProjectId;

    p.intro(chalk.bold('Handoff Platform Push'));

    // Check login first — needed for both flows
    const token = getToken(baseUrl);
    if (!token) {
      p.cancel(`Not logged in to ${baseUrl}. Run ${chalk.cyan('handoff-app platform:login')} first.`);
      process.exit(1);
    }

    // ── No project linked → offer to create a new one ──────────────────
    if (!projectId) {
      await handleCreatePush(handoff, baseUrl, token, args.force);
      return;
    }

    // ── Normal push to existing project ────────────────────────────────
    await handleExistingPush(handoff, baseUrl, token, projectId, args.force);
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Create-push flow: push a legacy project as a new platform project
// ─────────────────────────────────────────────────────────────────────────

async function handleCreatePush(
  handoff: Handoff,
  baseUrl: string,
  token: string,
  force?: boolean
): Promise<void> {
  p.note(
    [
      'This project is not linked to a platform project.',
      '',
      'You can create a new project on the platform and push',
      'your local files up in a single step.',
    ].join('\n'),
    'New Project'
  );

  const wantCreate = await p.confirm({
    message: 'Would you like to create a new project on the platform?',
  });

  if (p.isCancel(wantCreate) || !wantCreate) {
    p.cancel(`Run ${chalk.cyan('handoff-app platform:init')} to link to an existing project instead.`);
    process.exit(0);
  }

  const spinner = p.spinner();

  // Fetch the project list to get available organizations
  spinner.start('Loading organizations...');
  let projects: CliProject[];
  try {
    projects = await listProjects(baseUrl, token);
  } catch (err: any) {
    spinner.stop('Failed to load organizations.');
    p.cancel(err.message || 'Could not fetch project list');
    process.exit(1);
  }
  spinner.stop('Organizations loaded.');

  // Extract unique organizations the user has access to
  const orgMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const proj of projects) {
    if (!orgMap.has(proj.orgId)) {
      orgMap.set(proj.orgId, { id: proj.orgId, name: proj.orgName, slug: proj.orgSlug });
    }
  }

  // If no orgs available at all, the user might still have org access even with 0 projects.
  // The listProjects endpoint returns projects — if there are none, we still have the token.
  // We'll ask the user to type an org ID, or if we found orgs, let them pick.
  let orgId: string;

  if (orgMap.size > 0) {
    const orgs = Array.from(orgMap.values());

    if (orgs.length === 1) {
      orgId = orgs[0].id;
      p.log.info(`Organization: ${chalk.bold(orgs[0].name)}`);
    } else {
      const selectedOrg = await p.select({
        message: 'Which organization should own this project?',
        options: orgs.map((org) => ({
          value: org.id,
          label: org.name,
          hint: org.slug,
        })),
      });

      if (p.isCancel(selectedOrg)) {
        p.cancel('Push cancelled.');
        process.exit(0);
      }

      orgId = selectedOrg as string;
    }
  } else {
    // No projects found → we can't infer orgs. Ask the user.
    const orgInput = await p.text({
      message: 'Enter the organization ID to create the project in:',
      placeholder: 'uuid',
      validate: (val) => {
        if (!val || val.trim().length === 0) return 'Organization ID is required';
        return undefined;
      },
    });

    if (p.isCancel(orgInput)) {
      p.cancel('Push cancelled.');
      process.exit(0);
    }

    orgId = (orgInput as string).trim();
  }

  // Collect project name
  const defaultName = handoff.config?.app?.title || path.basename(handoff.workingPath);
  const projectName = await p.text({
    message: 'Project name:',
    placeholder: defaultName,
    defaultValue: defaultName,
    validate: (val) => {
      if (!val || val.trim().length === 0) return 'Project name is required';
      return undefined;
    },
  });

  if (p.isCancel(projectName)) {
    p.cancel('Push cancelled.');
    process.exit(0);
  }

  // Optionally collect Figma project ID
  const wantFigma = await p.confirm({
    message: 'Do you want to connect a Figma file? (can be added later)',
    initialValue: false,
  });

  let figmaProjectId: string | undefined;
  if (!p.isCancel(wantFigma) && wantFigma) {
    const figmaInput = await p.text({
      message: 'Figma file ID:',
      placeholder: 'e.g. abc123XYZ',
      validate: (val) => {
        if (!val || val.trim().length === 0) return 'Figma file ID is required';
        return undefined;
      },
    });

    if (p.isCancel(figmaInput)) {
      p.cancel('Push cancelled.');
      process.exit(0);
    }

    figmaProjectId = (figmaInput as string).trim();
  }

  // Confirm before proceeding
  if (!force) {
    const confirmed = await p.confirm({
      message: `Create project "${projectName}" and push all local files?`,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Push cancelled.');
      process.exit(0);
    }
  }

  // Execute create-push
  try {
    spinner.start('Creating project and uploading files...');

    const result = await createPushProject(baseUrl, token, orgId, handoff.workingPath, {
      name: (projectName as string).trim(),
      figmaProjectId,
      onProgress: (msg) => spinner.message(msg),
    });

    spinner.stop('Project created and files uploaded!');

    // Update the local config with the new project ID and platform URL
    await updateLocalConfig(handoff.workingPath, result.project.id, baseUrl);

    // Separate excluded-path warnings from real errors
    const excludedErrors = result.errors.filter((e) => /excluded\s*path/i.test(e));
    const realErrors = result.errors.filter((e) => !/excluded\s*path/i.test(e));

    const summary = [
      `Project: ${chalk.bold(result.project.name)}`,
      `Project ID: ${chalk.dim(result.project.id)}`,
      `Files uploaded: ${chalk.green(String(result.uploaded))}`,
      `Sync version: ${chalk.cyan(String(result.syncVersion))}`,
    ];

    if (excludedErrors.length > 0) {
      summary.push(chalk.yellow(`${excludedErrors.length} path(s) not synced (excluded by server)`));
    }

    if (realErrors.length > 0) {
      summary.push(`Errors: ${chalk.red(String(realErrors.length))}`);
      for (const err of realErrors) {
        summary.push(chalk.red(`  ! ${err}`));
      }
    }

    p.note(summary.join('\n'), 'Create-Push Summary');
    p.outro(`Your local config has been updated. Use ${chalk.cyan('platform:push')} for future syncs.`);
  } catch (err: any) {
    spinner.stop('Create-push failed.');
    p.cancel(err.message || 'Failed to create project');
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Normal push flow: push changes to an existing linked project
// ─────────────────────────────────────────────────────────────────────────

async function handleExistingPush(
  handoff: Handoff,
  baseUrl: string,
  token: string,
  projectId: string,
  force?: boolean
): Promise<void> {
  // Preview what will be pushed
  const diff = computePushDiff(handoff.workingPath);

  if (diff.added.length === 0 && diff.modified.length === 0 && diff.deleted.length === 0) {
    p.note('No changes detected.', 'Push');
    p.outro('Everything is up to date.');
    return;
  }

  // Show the changes summary
  const changeLines: string[] = [];
  if (diff.added.length > 0) {
    changeLines.push(chalk.green(`  + ${diff.added.length} new file(s)`));
    for (const f of diff.added.slice(0, 10)) {
      changeLines.push(chalk.dim(`    + ${f}`));
    }
    if (diff.added.length > 10) {
      changeLines.push(chalk.dim(`    ... and ${diff.added.length - 10} more`));
    }
  }
  if (diff.modified.length > 0) {
    changeLines.push(chalk.yellow(`  ~ ${diff.modified.length} modified file(s)`));
    for (const f of diff.modified.slice(0, 10)) {
      changeLines.push(chalk.dim(`    ~ ${f}`));
    }
    if (diff.modified.length > 10) {
      changeLines.push(chalk.dim(`    ... and ${diff.modified.length - 10} more`));
    }
  }
  if (diff.deleted.length > 0) {
    changeLines.push(chalk.red(`  - ${diff.deleted.length} deleted file(s)`));
    for (const f of diff.deleted.slice(0, 10)) {
      changeLines.push(chalk.dim(`    - ${f}`));
    }
    if (diff.deleted.length > 10) {
      changeLines.push(chalk.dim(`    ... and ${diff.deleted.length - 10} more`));
    }
  }

  p.note(changeLines.join('\n'), 'Changes to push');

  // Confirm unless --force
  if (!force) {
    const confirmed = await p.confirm({
      message: 'Push these changes?',
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Push cancelled.');
      process.exit(0);
    }
  }

  const spinner = p.spinner();

  try {
    spinner.start('Pushing changes...');

    const result = await pushProject(baseUrl, token, projectId, handoff.workingPath, {
      force,
      onProgress: (msg) => spinner.message(msg),
    });

    spinner.stop('Push complete.');

    // Separate excluded-path warnings from real errors
    const excludedErrors = result.errors.filter((e) => /excluded\s*path/i.test(e));
    const realErrors = result.errors.filter((e) => !/excluded\s*path/i.test(e));

    const summary = [
      `Uploaded: ${chalk.green(String(result.uploaded.length))} file(s)`,
      `Deleted: ${chalk.red(String(result.deleted.length))} file(s)`,
      `Sync version: ${chalk.cyan(String(result.version))}`,
    ];

    if (excludedErrors.length > 0) {
      summary.push(chalk.yellow(`${excludedErrors.length} path(s) not synced (excluded by server)`));
    }

    if (realErrors.length > 0) {
      summary.push(`Errors: ${chalk.red(String(realErrors.length))}`);
      for (const err of realErrors) {
        summary.push(chalk.red(`  ! ${err}`));
      }
    }

    p.note(summary.join('\n'), 'Push Summary');
    p.outro('Remote project updated.');
  } catch (err: any) {
    spinner.stop('Push failed.');

    if (err instanceof PlatformApiError && err.statusCode === 409) {
      p.cancel(
        [
          'Version conflict! The remote project has changed since your last pull.',
          `Run ${chalk.cyan('handoff-app platform:pull')} first, then try pushing again.`,
        ].join('\n')
      );
    } else {
      p.cancel(err.message || 'Push failed');
    }

    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Config helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Update the local handoff config file with platformProjectId and platformUrl
 * after a successful create-push. Reuses the same injection logic as platform:init.
 */
async function updateLocalConfig(workingDir: string, projectId: string, platformUrl: string): Promise<void> {
  const existingConfigFile = CONFIG_FILES.find((file) => fs.existsSync(path.resolve(workingDir, file)));

  if (existingConfigFile) {
    const configPath = path.resolve(workingDir, existingConfigFile);
    const ext = path.extname(configPath);

    if (ext === '.json') {
      const config = fs.readJsonSync(configPath);
      config.platformProjectId = projectId;
      config.platformUrl = platformUrl;
      fs.writeJsonSync(configPath, config, { spaces: 2 });
    } else {
      let content = fs.readFileSync(configPath, 'utf8');
      content = upsertConfigField(content, 'platformProjectId', JSON.stringify(projectId));
      content = upsertConfigField(content, 'platformUrl', JSON.stringify(platformUrl));
      fs.writeFileSync(configPath, content, 'utf8');
    }
  } else {
    // Create a minimal config
    const configPath = path.resolve(workingDir, 'handoff.config.js');
    fs.writeFileSync(
      configPath,
      `module.exports = {\n  platformProjectId: ${JSON.stringify(projectId)},\n  platformUrl: ${JSON.stringify(platformUrl)},\n};\n`
    );
  }
}

/**
 * Insert or replace a top-level field in a JS config export.
 */
function upsertConfigField(source: string, fieldName: string, value: string): string {
  const existingPattern = new RegExp(`(${fieldName}\\s*:\\s*)([^,}\\n]+)(,?)`);
  if (existingPattern.test(source)) {
    return source.replace(existingPattern, `$1${value}$3`);
  }

  const closingBrace = /(\n)(};?\s*$)/;
  if (closingBrace.test(source)) {
    source = ensureTrailingComma(source);
    return source.replace(closingBrace, `$1  ${fieldName}: ${value},\n$2`);
  }

  return source + `\n// Added by platform:push — could not auto-inject:\n// ${fieldName}: ${value}\n`;
}

/**
 * Ensure the last property line before the closing brace has a trailing comma.
 */
function ensureTrailingComma(source: string): string {
  const lines = source.split('\n');

  let closingIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^};?\s*$/.test(lines[i])) {
      closingIdx = i;
      break;
    }
  }

  if (closingIdx <= 0) return source;

  let lastPropIdx = closingIdx - 1;
  while (lastPropIdx >= 0 && (/^\s*$/.test(lines[lastPropIdx]) || /^\s*\/\//.test(lines[lastPropIdx]))) {
    lastPropIdx--;
  }

  if (lastPropIdx < 0) return source;

  const stripped = lines[lastPropIdx].replace(/\s*\/\/.*$/, '').trimEnd();
  if (stripped.length > 0 && !stripped.endsWith(',') && !stripped.endsWith('{')) {
    lines[lastPropIdx] = lines[lastPropIdx].replace(/(\S)(\s*(?:\/\/.*)?)$/, '$1,$2');
  }

  return lines.join('\n');
}

export default command;
