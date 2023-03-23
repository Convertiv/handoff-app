#!/usr/bin/env node

const spawn = require('cross-spawn');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Hide the Prompt
 * @param {string} query
 * @returns
 */
const maskPrompt = (query) =>
  new Promise((resolve) => {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.stdoutMuted = true;

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted) rl.output.write('\x1B[2K\x1B[200D' + query + `${'*'.repeat(rl.line.length)}`);
      else rl.output.write(stringToWrite);
      return false;
    };
    return rl.question(query, resolve);
  });

/**
 * Install the application
 */
(async () => {
  try {
    let requirements = false;
    const result = process.versions;
    if (result && result.node) {
      if (parseInt(result.node) >= 16) {
        requirements = true;
      }
    } else {
      // couldn't find the right version, but ...
    }
    if (!requirements) {
      console.log(chalk.redBright('Handoff Installation failed'));
      console.log(chalk.yellow('- Please update node to at least Node 16 https://nodejs.org/en/download. \n- You can read more about installing handoff at https://www.handoff.com/docs/'));
      process.exit(0);
    }
    // Get a folder name
    const welcome = `\n==============================\nThe Handoff App installer will ask a couple of questions to set up the project.  
Only the project name is required. The rest can be supplied via a .env file or env vars.\n==============================\n`;
    console.log(welcome);
    // Ask the user for a project name
    const project = await prompt(chalk.green('Project name: (lower case, no spaces) '));
    if (project === '') {
      // You've got to give us a project name
      console.log('Sorry, Project name is required.');
      rl.close();
    }
    // The project name has to be a filename
    if (!project.match(/^[a-zA-Z0-9_-]+$/)) {
      console.log('Project name should be a valid filename');
      rl.close();
    }

    // Fetch figma file id
    console.log(`\n==============================\nNext we need the Figma file id. You can find this by looking at the url of your Figma file. \nIf the url is ${chalk.blue(`https://www.figma.com/file/IGYfyraLDa0BpVXkxHY2tE/Starter-%5BV2%5D`)}\nyour id would be IGYfyraLDa0BpVXkxHY2tE\n==============================\n`)
    const figmaIdSupplied = await prompt(chalk.green('Figma File Id (optional): '));
    // Fetch a masked developer key
    console.log(`\n==============================\nFinally we need a developer token so we can access Figma on your behalf. \n Use these instructions to generate them ${chalk.blue(`https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens`)} \n==============================\n`)
    
    const developerKeySupplied = await maskPrompt(chalk.green('Figma Developer Key (optional): '));

    // Get the current directory
    const currentDir = process.cwd();
    const projectDir = path.resolve(currentDir, project);
    // Make the new directory
    fs.mkdirSync(projectDir, { recursive: true });

    // Copy the template into the destination
    const templateDir = path.resolve(__dirname, 'template');
    fs.cpSync(templateDir, projectDir, { recursive: true });

    // Fix the names of the dotfiles
    fs.renameSync(path.join(projectDir, 'gitignore'), path.join(projectDir, '.gitignore'));
    fs.renameSync(path.join(projectDir, 'env.example'), path.join(projectDir, '.env.example'));

    // Setting defaults or using the supplied
    let figmaId = figmaIdSupplied !== '' ? figmaIdSupplied : '<copy figma project id>';
    let developerKey = developerKeySupplied !== '' ? developerKeySupplied : '<your figma dev access token>';

    // Generate the ENV data
    const envContents = `FIGMA_BASE_URL="https://api.figma.com/v1/"\nFIGMA_PROJECT_ID="${figmaId}"\nDEV_ACCESS_TOKEN="${developerKey}"`;
    fs.writeFileSync(path.join(projectDir, '.env'), envContents);

    // Build a package json
    const projectPackageJson = require(path.join(projectDir, 'package.json'));
    projectPackageJson.name = project;
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(projectPackageJson, null, 2));
    spawn.sync('npm', ['install'], { cwd: projectDir, stdio: 'inherit' });

    // Tell people about it
    console.log(chalk.green('Success! The handoff app has been built.'));
    console.log(chalk.green(`Created ${project} at ${projectDir}`));

    // Close the prompt
    rl.close();
  } catch (e) {
    console.error(chalk.red('Installation Failed'), e);
    process.exit(0);
  }
})();

// When done reading prompt, exit program
rl.on('close', () => process.exit(0));
