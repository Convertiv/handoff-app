// Path utils
const path = require('path');
// Chokidar for watching file changes
const chokidar = require('chokidar');
// File pattern globs
const globby = require('globby');
// File system + extra utils
const fs = require('fs-extra');
// SVG spriter
const SVGSpriter = require('svg-sprite');
// Vinyl virtual file
const VirtualFile = require('vinyl');

/**
 * @typedef {{
 *   source: string;
 *   destination: string;
 *   mode: 'build' | 'watch';
 * }} ValidatedConfig
 * @typedef {Partial<Omit<ValidatedConfig, 'mode'> & { mode: string }>} Config
 */

/**
 * Returns Promise.resolve with validated config or Promise.reject if config is
 * not valid.
 *
 * @param {Config} config Config recived from `@runforest/run`.
 * @return {Promise<ValidatedConfig>}
 */
function validate({ source = 'src/html/svg/', destination = 'public/assets/', mode = 'build' }) {
  if (!source) {
    return Promise.reject(new Error('Source is required!'));
  }

  if (!destination) {
    return Promise.reject(new Error('Destination is required!'));
  }

  return Promise.resolve({
    source,
    destination,
    mode: mode === 'watch' ? 'watch' : 'build',
  });
}

/**
 * Creates spriter.
 *
 * @param {string} destination Sprite destination dir
 */
function createSpriter(destination) {
  return new SVGSpriter({
    shape: {
      id: {
        // Add suffix so ID don't conflict with page ids on older IE
        generator: 'icon-%s',
      },
      transform: [{
        svgo: {
          plugins: [{
            name: 'preset-default',
            params: {
              overrides: {
                inlineStyles: false,
                removeViewBox: false,
              }
            }
          }]
        }
      }]
    },
    mode: {
      // symbol mode to build the SVG
      symbol: {
        render: {
          // CSS output option for icon sizing
          css: false,
          // SCSS output option for icon sizing
          scss: false,
        },
        // Destination configured in config
        dest: destination,
        // CSS BEM-style prefix if styles rendered
        prefix: '.svg--%s',
        // Generated sprite name
        sprite: 'icons.svg',
        // Build a sample page, please!
        example: {
          dest: 'icons.html',
        },
      },
    },
  });
}

/**
 * @param {SVGSpriter.SVGSpriter} spriter
 * @returns {Promise<void>}
 */
function compile(spriter) {
  return new Promise((resolve, reject) => {
    spriter.compile((error, result) => {
      if (error) {
        return reject(error);
      }

      return Promise.all(
        Object.keys(result.symbol).map((type) => {
          const filePath = result.symbol[type].path;

          return fs.ensureDir(path.dirname(filePath)).then(() => fs.writeFile(filePath, result.symbol[type].contents));
        })
      )
        .then(() => resolve())
        .catch((fsError) => reject(fsError));
    });
  });
}

/**
 * Transforms folder with svg files to svg sprite file.
 *
 * @param  {ValidatedConfig} config
 * @return {Promise<ValidatedConfig>}
 */
function build(config) {
  const { source, destination } = config;
  const cwd = process.cwd();
  const sourceAbsolutePath = path.join(cwd, source);

  return globby('**/*.svg', { cwd: sourceAbsolutePath })
    .then((paths) => {
      const spriter = createSpriter(destination);

      // Read all files and add them to spriter.
      return (
        Promise.all(
          paths.map((filePath) => {
            const absolutePath = path.join(sourceAbsolutePath, filePath);

            return fs.readFile(absolutePath).then((data) => {
              // Adding vinyl file because svg-sprite will allways
              // transform any file to it
              spriter.add(
                new VirtualFile({
                  path: absolutePath,
                  base: sourceAbsolutePath,
                  contents: data,
                })
              );
            });
          })
        )
          // Finally if everything is okay, compile and save svg sprite
          .then(() => compile(spriter))
      );
    })
    .then(() => config);
}

/**
 * Sync files from source to destination.
 *
 * @param  {ValidatedConfig}   config   Config recived from `@runforest/run`.
 * @return {Promise<ValidatedConfig>}
 */
function watch(config) {
  const { source } = config;
  const cwd = process.cwd();
  const sourceAbsolutePath = path.join(cwd, source);

  return new Promise((resolve, reject) => {
    // watch for file changes and sync them over
    const watcher = chokidar.watch('**/*.svg', {
      // Ignore dot-files.
      ignored: /(^|[/\\])\../,
      // Current working directory is source
      cwd: sourceAbsolutePath,
    });

    const queue = Promise.resolve();

    /** @type {NodeJS.Timeout | undefined} */
    let timeout;

    /**
     * Debounce and add build to queue.
     *
     * @return {void}
     */
    const buildFn = function buildFn() {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        queue.then(() => {
            console.log(`Compiling svg sprite ...`);

          return (
            build(config)
              .then(() => {
                console.log(`Compiled svg sprite.`);

                return config;
              })
              // This will catch error, show it and watcher will keep going.
              .catch((error) => {
                console.log(`Error happend while building svg sprite.\n${error}`);

                return config;
              })
          );
        });
      }, 300);
    };

    watcher
      .on('add', buildFn)
      .on('addDir', buildFn)
      .on('unlink', buildFn)
      .on('unlinkDir', buildFn)
      .on('change', buildFn)
      .on('error', (error) => {
        watcher.close();

        console.log(`Unhandled watcher exception`);
        reject(error);
      });
  });
}

/**
 * @param {Config} config
 * @returns {Promise<any>}
 */
module.exports = function runSvg(config) {
  return new Promise((resolve, reject) => {
    return validate(config)
      .then((validatedConfig) => {
        const { mode } = validatedConfig;

        if (mode === 'watch') {
          return watch(validatedConfig);
        }

        return build(validatedConfig);
      })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.log(error)
        reject(error);
      });
  });
};
