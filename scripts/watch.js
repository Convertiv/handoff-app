// @ts-check
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const { buildTmpDir, mergePackageFile, mergePackageDir, mergeProjectFile, runPreviewExporter } = require('./build/scripts');
const spawnPromise = require('./build/spawn-promise');
const chalk = require('chalk');

// Package directory is the code as it lives in the npm dir
const packageRootDir = path.resolve(__dirname, '..');
// Project root dir is the current directory
const projectRootDir = process.cwd();
// Temp Dir is what we create to manage the project
const tmpDir = path.resolve(projectRootDir, '.convertiv-motiv');

dotenv.config({ path: path.resolve(projectRootDir, '.env') });

// override NODE_ENV because next dev goes crazy if it is set to something different than development
process.env.NODE_ENV = 'development';

(async function () {
  // Build the temp directory first
  await buildTmpDir();

  // What directories should we watch
  const watcher = chokidar.watch( 
    [
      path.resolve(projectRootDir, 'config.js'),
      path.resolve(projectRootDir, 'exported'),
      path.resolve(projectRootDir, 'public'),
      path.resolve(projectRootDir, 'pages'),
      path.resolve(projectRootDir, 'templates'),
      path.resolve(projectRootDir, 'sass'),
    ],
    { persistent: true, ignoreInitial: true }
  );

  /**
   * Get the destination path relative to the config.js
   * @param {string} inputPath
   */
  const getDestPath = (inputPath) => {
    const relativePath = path.relative(projectRootDir, inputPath);

    if (relativePath === 'config.js') {
      return path.resolve(tmpDir, 'client-config.js');
    }
    if(relativePath.startsWith('pages/')){
      return path.resolve(tmpDir, relativePath.replace('pages/', 'docs/'));
    }

    return path.resolve(tmpDir, relativePath);
  };

  /**
   * Get the destination path relative to the config.js
   * @param {string} inputPath
   */
  const getPackagePath = (inputPath) => {
    return path.resolve(packageRootDir, inputPath);;
  };

  const resetDirectory = async () => {
    await mergePackageDir('pages', 'docs');
    await mergePackageDir('public', 'public');
    await mergePackageDir('templates', 'templates');
    await mergePackageDir('sass', 'sass');
  }
  /**
   * Merge the public directory as files change
   * @param {string} file
   */
  const executePathHooks = async (file) => {
    const relativePath = path.relative(projectRootDir, file);
    if (relativePath.startsWith('public/')) {

    }else if (relativePath.startsWith('templates/')) {
      await runPreviewExporter();
    } else if (relativePath.startsWith('pages/')) {

    } else if (relativePath.startsWith('sass/')) {

    } 
  };

  const knownPaths = [
    'index.md',

    'assets.md',
    'assets/fonts.md',
    'assets/icons.md',
    'assets/logos.md',

    'foundations.md',
    'foundations/colors.md',
    'foundations/effects.md',
    'foundations/logos.md',
    'foundations/typography.md',

    'changelog.md',

    'components.md',
    'components/button.md',
    'components/alert.md',
    'components/modal.md',
    'components/pagination.md',
    'components/tooltip.md',
    'components/switch.md',
    'components/input.md',
    'components/radio.md',
    'components/select.md',
    'components/checkbox.md',
  ];

  /**
   * Delete a file with rules for different kinds of files
   * @param {string} file
   */
  const deleteFile = async (file) => {
    const relativePath = path.relative(projectRootDir, file);
    if (relativePath.startsWith('pages/')) {
      // Is this page deletetable
      file = file.replace('pages', 'docs');
      const uri = relativePath.replace('pages/', '');
      if (fs.existsSync(getDestPath(file)) && knownPaths.indexOf(uri) < 0) {
        fs.rm(getDestPath(file));
      } else {
        console.log(`Reverting ${relativePath} to default`);
        const orginal = getPackagePath(relativePath.replace('pages', 'docs'));
        if (fs.existsSync(orginal)){
          fs.copy(orginal, getDestPath(relativePath.replace('pages', 'docs')))
          console.log(`${relativePath} is reverted to default`);
        }
      }
    } else {
      if (fs.existsSync(getDestPath(file))) {
        fs.rm(getDestPath(file));
      }
    }
  };

  /**
   * Delete a file with rules for different kinds of files
   * @param {string} file
   */
  const deleteDirectory = async (file) => {
    const relativePath = path.relative(projectRootDir, file);
    if (fs.existsSync(getDestPath(file))) {
      fs.rmdirSync(getDestPath(file), { recursive: true });
    }
  };

  // Create a watcher
  console.log('starting watcher')
  watcher
    .on('add', async function (file) {
      console.log('files adding')
      try {
        const relativePath = path.relative(projectRootDir, file);
        console.log(`Added ${relativePath}`);
        fs.copySync(file, getDestPath(file));
        executePathHooks(file);
      } catch (err) {
        console.log(`There was an error adding the file`, err);
      }
    })
    .on('addDir', async function (file) {
      try {
        const relativePath = path.relative(projectRootDir, file);
        console.log(`Added dir ${relativePath}`);
        await resetDirectory();
        fs.copySync(file, getDestPath(file), {overwrite: true});
      } catch (err) {
        console.log(`There was an error adding adding a directory`, err);
      }
    })
    .on('change', async function (file) {
      try {
        const relativePath = path.relative(projectRootDir, file);
        console.log(`Updating ${relativePath}`);
        fs.copySync(file, getDestPath(file));
        executePathHooks(file);
      } catch (err) {
        console.log(`There was an error changing that file`, err);
      }
    })
    .on('unlink', function (file) {
      try {
        const relativePath = path.relative(projectRootDir, file);
        console.log(`Deleting ${relativePath}`);
        deleteFile(file);
        executePathHooks(file);
      } catch (err) {
        console.log(`There was an error deleting the file`, err);
      }
    })
    .on('unlinkDir', async function (file) {
      try {
        const relativePath = path.relative(projectRootDir, file);
        console.log(`Deleted dir ${relativePath}`);
        deleteDirectory(file);
        await resetDirectory();
      } catch (err) {
        console.log(`There was an error deleting that directory`, err);
      }
    })
    .on('error', function (error) {
      console.error('Error happened', error);
    });

    // Create a swawned node promis
  const nodeSpawn = await spawnPromise('npx', ['next', 'dev'], { cwd: tmpDir, env: process.env, stdio: 'inherit' });
})();
