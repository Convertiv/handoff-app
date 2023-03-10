// @ts-check

const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const spawnPromise = require('./spawn-promise');

// Package directory is the code as it lives in the npm dir
const packageRootDir = path.resolve(__dirname, '..', '..');
// Project directory is the current root directory
const projectRootDir = process.cwd();
// Create a temp directory
const tmpDir = path.resolve(projectRootDir, '.handoff-app');
const clientConfigPath = path.resolve(projectRootDir, 'config.js');

dotenv.config({ path: path.resolve(projectRootDir, '.env') });

/**
 * Validate that the project is configured correctly
 */
const validateProject = async () => {
  // Make sure that user gets good error message if config.js is not readable
  try {
    await fs.access(clientConfigPath, fs.constants.R_OK);
  } catch (error) {
    console.error(`Can't access "${clientConfigPath}" config file. Please create it and make sure that it has right file permissions.`);
    throw error;
  }
};
/**
 * Copy the code from the package dir
 * into our new tmp dir to work on it.
 */
const prepareTmpDir = async () => {
  console.log('Preparing tmp dir...');
  await fs.emptyDir(tmpDir);
  await fs.copy(packageRootDir, tmpDir);
  console.log('Tmp dir prepared.');
};
/**
 * At the core of each project is a config.  Read that config and write it to
 * the temp directory
 */
const copyProjectConfig = async () => {
  // Copy project's config.js to tmp dir's client-config.js
  console.log('Copying project config...');
  await fs.writeFile(path.resolve(tmpDir, 'client-config.js'), await fs.readFile(clientConfigPath, 'utf8'));
  console.log('Project config copied.');
};

/**
 * Run the exporter from figma with the configured settings.
 */
const runFigmaExporter = async () => {
  // Run figma-exporter in the project root
  console.log('Running figma exporter...');
  await spawnPromise('node', [path.resolve(tmpDir, 'figma-exporter', 'dist', 'figma-exporter.cjs.js')], {
    cwd: projectRootDir,
    env: process.env,
    stdio: 'inherit',
  });
  console.log('Figma exporter finished.');
};

/**
 * Run only the preview exporter
 */
const runPreviewExporter = async () => {
  // Run figma-exporter in the project root
  console.log('Running preview transformer...');
  await spawnPromise('node', [path.resolve(tmpDir, 'figma-exporter', 'dist', 'figma-exporter.cjs.js'), 'preview'], {
    cwd: projectRootDir,
    env: process.env,
    stdio: 'inherit',
  });
  console.log('Preview transformer finished.');
};

/**
 * Run only the preview exporter
 */
const runStyleExporter = async () => {
  // Run figma-exporter in the project root
  console.log('Running style transformer...');
  await spawnPromise('node', [path.resolve(tmpDir, 'figma-exporter', 'dist', 'figma-exporter.cjs.js'), 'styles'], {
    cwd: projectRootDir,
    env: process.env,
    stdio: 'inherit',
  });
  console.log('Style transformer finished.');
};

/**
 * Copy the figma exports
 */
const copyFigmaExportedFiles = async () => {
  // Copy exported folder
  console.log('Copying exported files...');
  await fs.remove(path.resolve(tmpDir, 'exported'));
  await fs.copy(path.resolve(projectRootDir, 'exported'), path.resolve(tmpDir, 'exported'));
  console.log('Exported files copied.');
};

/**
 * Merge a single package file 
 * @param {string} file Relative path to dir.
 * @param {string} dir The directory to merge on top
 */
const mergePackageFile = async (file, dir) => {
  const packageFilePath = path.resolve(packageRootDir, dir, file);
  if (await fs.pathExists(packageFilePath)) {
    return fs.copySync(packageFilePath, path.resolve(tmpDir, dir, file), {
      // Overwrite assets folder if added in the project repo
      overwrite: false,
    });
  }
};

/**
 * Merge a single package file 
 * @param {string} file Relative path to dir.
 * @param {string} target The directory to merge on top
 */
const mergeProjectFile = async (file, target) => {
  
  const projectFilePath = path.resolve(projectRootDir, file);
  const filename = path.basename(file);
  
  if (await fs.pathExists(projectFilePath)) {
    return fs.copy(projectFilePath, path.resolve(tmpDir, target, filename), {
      // Things coming from the project should always overwrite if possible
      overwrite: true,
    });
  }
};

/**
 * Merge the files from the package into the tmp directory
 * @param {string} dir The directory to merge on top
 */
const mergePackageDir = async (dir, target) => {
  if(!target){
    target = dir;
  }
  // Copy over package's public dir content
  const packagePublicFiles = await fs.readdir(path.resolve(packageRootDir, target));
  for (const file of packagePublicFiles) {
    await mergePackageFile(file, target);
  }
};

/**
 * Merge a directory
 * @param {string} dir The directory name in the root of the project
 */
const mergeProjectDir = async (dir, target) => {
  if(!target){
    target = dir;
  }
  console.log(`Merging project ${dir} dir into ${target}...`);
  // Remove public dir
  if (fs.existsSync(path.resolve(tmpDir, target))){
    await fs.remove(path.resolve(tmpDir, target));
  }

  // Copy project's public dir
  if (await fs.pathExists(path.resolve(projectRootDir, dir))) {
    await fs.copy(path.resolve(projectRootDir, dir), path.resolve(tmpDir, target));
  } else {
    await fs.ensureDir(path.resolve(tmpDir, target));
  }

  await mergePackageDir(dir, target);
  console.log(`Project ${dir} dir merged.`);
};

/**
 * Get the exports and copy them to the zip directory
 */
const moveExportedZipFilesToPublicDir = async () => {
  console.log('Moving exported zip files to public dir...');
  const zipFiles = (await fs.readdir(path.resolve(tmpDir, 'exported'))).filter((filename) => filename.endsWith('.zip'));
  try{
    await Promise.all(zipFiles.map((filename) => fs.rm(path.join(tmpDir, 'public', filename))));
  }catch(err) {
    console.log('No files to remove');
  }
  await Promise.all(zipFiles.map((filename) => fs.move(path.join(tmpDir, 'exported', filename), path.join(tmpDir, 'public', filename))));
  console.log('Exported zip files moved to public dir.');
};

/**
 * Install unmet dependencies
 */
const installNpmDependencies = async () => {
  // Install npm dependencies in tmpDir
  await spawnPromise('npm', ['install'], {
    cwd: tmpDir,
    env: process.env,
    stdio: 'inherit',
  });
  await spawnPromise('npm', ['run', 'install:lib:no-dev'], {
    cwd: tmpDir,
    env: process.env,
    stdio: 'inherit',
  });
};

/**
 * In the temp dir, lets build the static site
 */
const buildStaticSite = async () => {
  // Build static site
  console.log('Building static site app...');
  await spawnPromise('npx', ['next', 'build'], { cwd: tmpDir, env: process.env, stdio: 'inherit' });
  console.log('Static site app built.');
  console.log('Exporting static files...');
  await spawnPromise('npx', ['next', 'export'], { cwd: tmpDir, env: process.env, stdio: 'inherit' });
  console.log('Static files exported.');

  // Move static site to project's dist dir
  console.log('Moving static site to dist dir...');
  await fs.remove(path.resolve(projectRootDir, 'dist'));
  await fs.copy(path.resolve(tmpDir, 'out'), path.resolve(projectRootDir, 'dist'));
  console.log(`Static site generated successfully! Files written to ${path.resolve(projectRootDir, 'dist')}`);
};

/**
 * Build the resources in the tmp dir
 */
const buildTmpDir = async () => {
  await validateProject();
  await prepareTmpDir();
  await installNpmDependencies();
  await copyProjectConfig();
  await mergeProjectDir('templates', 'templates');
  await mergeProjectDir('public', 'public');
  await mergeProjectDir('pages', 'docs');
  await mergeProjectDir('sass', 'sass');
  if (process.env.SKIP_FIGMA_EXPORTER !== 'yes') {
    await runFigmaExporter();
  }
  await copyFigmaExportedFiles();
  await moveExportedZipFilesToPublicDir();
};

module.exports = {
  mergePackageFile,
  mergePackageDir,
  buildTmpDir,
  buildStaticSite,
  mergeProjectFile,
  runPreviewExporter,
  runStyleExporter,
};
