#!/usr/bin/env node

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Get the current handoff-app version from package.json
 */
const getVersion = (): string => {
  try {
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
};

interface CreateOptions {
  projectName: string;
  figmaProjectId: string;
  figmaAccessToken: string;
  [key: string]: string; // Allow dynamic access for template replacement
}

class CreateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateError';
  }
}

/**
 * Check if directory exists
 */
const directoryExists = (dirPath: string): boolean => {
  try {
    return fs.existsSync(dirPath);
  } catch {
    return false;
  }
};

/**
 * Create directory recursively
 */
const createDirectory = (dirPath: string): void => {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (error) {
    throw new CreateError(`Failed to create directory: ${error}`);
  }
};

interface TemplateConfig {
  source: string;
  destination: string;
  isExample?: boolean; // Flag to indicate if this is an example file
}

/**
 * Get mandatory templates based on whether examples are included
 * Uses different handoff config templates for blank vs. with-examples projects
 */
const getMandatoryTemplates = (includeExamples: boolean): TemplateConfig[] => [
  { source: 'package.json.tpl', destination: 'package.json' },
  { 
    source: includeExamples ? 'handoff.config.with-examples.js.tpl' : 'handoff.config.js.tpl', 
    destination: 'handoff.config.js' 
  },
  { source: 'tsconfig.json.tpl', destination: 'tsconfig.json' },
  { source: 'gitignore.tpl', destination: '.gitignore' },
  { source: 'env.tpl', destination: '.env' },
  { source: 'README.md.tpl', destination: 'README.md' },
];

// Example component files (only included when user opts for examples)
const exampleTemplates: TemplateConfig[] = [
  { source: 'components/button/Button.tsx.tpl', destination: 'components/button/Button.tsx', isExample: true },
  { source: 'components/button/button.js.tpl', destination: 'components/button/button.js', isExample: true },
];

/**
 * Render a template string by replacing placeholders with values
 */
const renderTemplate = (content: string, data: CreateOptions): string => {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in data)) {
      console.warn(chalk.yellow(`Warning: Unknown template placeholder '{{${key}}}'`));
    }
    return data[key] || '';
  });
};

/**
 * Execute npm install
 */
const runNpmInstall = async (projectPath: string): Promise<void> => {
  const spinner = p.spinner();
  spinner.start('Installing dependencies...');

  return new Promise((resolve, reject) => {
    const npmProcess = spawn('npm', ['install'], {
      cwd: projectPath,
      stdio: 'pipe',
      shell: true,
    });

    let stderr = '';

    npmProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    npmProcess.on('close', (code) => {
      if (code === 0) {
        spinner.stop('Dependencies installed successfully');
        resolve();
      } else {
        spinner.stop('Failed to install dependencies');
        reject(new CreateError(`npm install failed: ${stderr}`));
      }
    });

    npmProcess.on('error', (error) => {
      spinner.stop('Failed to install dependencies');
      reject(new CreateError(`Failed to run npm install: ${error.message}`));
    });
  });
};

/**
 * Validate project name
 */
const validateProjectName = (name: string): boolean => {
  const validNameRegex = /^[a-zA-Z0-9-_]+$/;
  return validNameRegex.test(name) && name.length > 0;
};

/**
 * Main create function
 */
const create = async (): Promise<void> => {
  const version = getVersion();
  p.intro(chalk.bgCyan.black(` Handoff App Creator (v${version}) `));

  try {
    // Get project name
    const projectName = await p.text({
      message: 'Enter project name:',
      placeholder: 'my-handoff-project',
      validate: (value) => {
        if (!value.trim()) return 'Project name is required';
        if (!validateProjectName(value)) {
          return 'Invalid project name. Use only letters, numbers, hyphens, and underscores.';
        }
      },
    });

    if (p.isCancel(projectName)) {
      p.cancel('Project creation cancelled.');
      process.exit(0);
    }

    const projectPath = path.resolve(process.cwd(), projectName as string);

    // Check if directory exists
    if (directoryExists(projectPath)) {
      const overwrite = await p.confirm({
        message: `Directory "${projectName}" already exists. Do you want to overwrite it?`,
        initialValue: false,
      });

      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel('Project creation cancelled.');
        process.exit(0);
      }

      // Remove existing directory
      p.log.info('Removing existing directory...');
      fs.rmSync(projectPath, { recursive: true, force: true });
    }

    // Create project directory
    p.log.info('Creating project directory...');
    createDirectory(projectPath);

    // Ask if user wants a blank project or one with examples
    p.log.step(chalk.blue('Project Configuration'));
    const projectType = await p.select({
      message: 'What type of project would you like to create?',
      options: [
        { value: 'with-examples', label: 'Project with sample components', hint: 'Includes example components to get started' },
        { value: 'blank', label: 'Blank project', hint: 'Only mandatory files, no examples' },
      ],
      initialValue: 'with-examples',
    });

    if (p.isCancel(projectType)) {
      p.cancel('Project creation cancelled.');
      process.exit(0);
    }

    const includeExamples = projectType === 'with-examples';

    // Get Figma project ID
    p.log.step(chalk.blue('Figma Configuration'));
    const figmaProjectId = await p.text({
      message: 'Enter Figma project ID:',
      placeholder: 'Optional - can be configured later',
    });

    if (p.isCancel(figmaProjectId)) {
      p.cancel('Project creation cancelled.');
      process.exit(0);
    }

    // Get Figma access token
    let figmaAccessToken: string | boolean | symbol = '';

    if (figmaProjectId) {
      figmaAccessToken = await p.password({
        message: 'Enter Figma developer access token:',
      });

      if (p.isCancel(figmaAccessToken)) {
        p.cancel('Project creation cancelled.');
        process.exit(0);
      }
    }

    const options: CreateOptions = {
      projectName: projectName as string,
      figmaProjectId: ((figmaProjectId as string) || '').trim(),
      figmaAccessToken: ((figmaAccessToken as string) || '').trim(),
    };

    // Create files
    const spinner = p.spinner();
    spinner.start('Creating project files...');

    const templateDir = path.resolve(__dirname, '../templates/default');

    if (!fs.existsSync(templateDir)) {
      throw new CreateError(`Template directory not found at ${templateDir}. This may indicate a packaging issue.`);
    }

    // Combine mandatory templates with example templates based on user choice
    const templates = [
      ...getMandatoryTemplates(includeExamples),
      ...(includeExamples ? exampleTemplates : []),
    ];

    try {
      for (const template of templates) {
        const templatePath = path.join(templateDir, template.source);
        const destinationPath = path.join(projectPath, template.destination);

        try {
          const content = fs.readFileSync(templatePath, 'utf8');
          const rendered = renderTemplate(content, options);
          fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
          fs.writeFileSync(destinationPath, rendered);
        } catch (err) {
          throw new CreateError(`Failed to create file ${template.destination}: ${err}`);
        }
      }
      spinner.stop('Project files created');
    } catch (err) {
      spinner.stop('Failed to create project files');
      throw err;
    }

    // Install dependencies
    await runNpmInstall(projectPath);

    // Success message
    const nextSteps = [`cd ${projectName}`];
    if (figmaProjectId && figmaAccessToken) {
      nextSteps.push('npm run fetch');
    }
    nextSteps.push('npm run start');

    p.note(nextSteps.join('\n'), 'Next steps');

    const outroMessage = includeExamples
      ? 'Project created successfully with sample components! First, fetch your Figma data (optional), then start the documentation site.'
      : 'Blank project created successfully! First, fetch your Figma data, then start the documentation site.';

    p.outro(chalk.green(outroMessage));
  } catch (error) {
    if (error instanceof CreateError) {
      p.cancel(chalk.red(`Error: ${error.message}`));
    } else {
      p.cancel(chalk.red(`Unexpected error: ${error}`));
    }
    process.exit(1);
  }
};

// Run the create function if this file is executed directly
if (require.main === module) {
  create();
}

export default create;
