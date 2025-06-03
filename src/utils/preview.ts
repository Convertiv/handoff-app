import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import webpack from 'webpack';
import Handoff from '../index';
import { getIntegrationEntryPoint } from '../transformers/integration/index';
const { createFsFromVolume, Volume } = require('memfs');

export const buildClientFiles = async (handoff: Handoff): Promise<string> => {
  if (!handoff) {
    throw Error('Handoff not initialized');
  }

  const entry = getIntegrationEntryPoint(handoff);

  if (!entry) {
    return Promise.resolve('');
  }

  return new Promise((resolve, reject) => {
    const compile = webpack(generateWebpackConfig(entry, handoff));
    compile.run((err, stats) => {
      if (err) {
        let error =
          chalk.red('Errors encountered trying to build preview styles.') +
          "\n  The integration sass expects a token that isn't found in your Figma component.\n";
        if (handoff.debug) {
          error += chalk.yellow('\n\n---------- Sass Build Error Trace ---------- \n') + err.stack || err;
        } else {
          error += 'Add the --debug flag to see the full error trace\n\n';
        }
        return reject(error);
      }

      if (stats) {
        if (stats.hasErrors()) {
          let buildErrors = stats.compilation.errors?.map((err) => err.message);
          let error =
            chalk.red('Errors encountered trying to build preview styles.') +
            "\nThe integration sass expects a token that isn't found in your Figma component.\n";
          if (handoff.debug) {
            error += chalk.yellow('\n\n---------- Sass Build Error Trace ---------- \n') + buildErrors;
          } else {
            error += 'Add the --debug flag to see the full error trace\n\n';
          }
          return reject(error);
        }

        if (stats.hasWarnings()) {
          let buildWarnings = stats.compilation.warnings?.map((err) => err.message);
          let error = 'Warnings encountered when building preview styles.\n';
          if (handoff.debug) {
            error += buildWarnings;
            console.error(chalk.yellow(error));
          }
        }
      }
      compile.close((closeErr) => {});

      return resolve('Preview styles successfully built.');
    });
  });
};

export const bundleJSWebpack = async (target: string, handoff: Handoff, mode?: 'none' | 'development' | 'production'): Promise<string> => {
  const fs = createFsFromVolume(new Volume());
  return new Promise((resolve, reject) => {
    const filename = target.split('/').pop();
    const output = {
      path: '/',
      filename,
    };
    const compiler = webpack(generateWebpackConfig(target, handoff, output, mode));

    compiler.outputFileSystem = fs;
    compiler.run((err, stats) => {
      // Read the output later:
      const content = fs.readFileSync('/' + output.filename, 'utf-8');
      compiler.close((closeErr) => {
        if (err) {
          reject(err);
        }
        if (closeErr) {
          reject(closeErr);
        }
        resolve(content);
      });
    });
  });
};

export const generateWebpackConfig = (
  entry: string,
  handoff: Handoff,
  output?: {
    path: string;
    filename: string;
  },
  mode?: 'none' | 'development' | 'production'
): webpack.Configuration => {
  if (!output) {
    output = {
      path: path.resolve(handoff?.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'components'),
      filename: 'bundle.js',
    };
  }
  if (!mode) {
    mode = 'production';
  }
  let config: webpack.Configuration = {
    mode,
    entry,
    resolve: {
      alias: {
        '@exported': path.join(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration'),
        '@integration': path.join(handoff.workingPath, handoff.config.integrationPath ?? 'integration', 'sass'),
      },
      modules: [
        path.resolve(handoff?.modulePath, 'src'),
        path.resolve(handoff?.modulePath, 'node_modules'),
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(handoff?.workingPath, 'node_modules'),
        path.resolve(handoff?.workingPath, handoff.config.integrationPath ?? 'integration', 'sass'),
        path.resolve(handoff?.workingPath, 'exported', handoff?.config.figma_project_id),
      ],
    },
    output,
    resolveLoader: {
      modules: [
        path.resolve(handoff?.modulePath),
        path.resolve(handoff?.workingPath),
        path.resolve(handoff?.modulePath, 'node_modules'),
        path.resolve(handoff?.workingPath, 'node_modules'),
        path.resolve(process.cwd(), 'node_modules'),
      ],
    },
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  indentWidth: 4,
                  includePaths: [
                    path.resolve(handoff?.workingPath, 'node_modules'),
                    path.resolve(handoff?.modulePath, 'node_modules'),
                    path.resolve(process.cwd(), 'node_modules'),
                    path.resolve(handoff?.modulePath),
                    path.resolve(handoff?.workingPath),
                  ],
                },
                additionalData: async (content, loaderContext) => {
                  const integrationPath = path.join(handoff.workingPath, handoff.config.integrationPath ?? 'integration', 'sass');

                  if (fs.existsSync(integrationPath)) {
                    fs.readdirSync(integrationPath)
                      .filter((file) => {
                        return path.extname(file).toLowerCase() === '.scss' && file !== 'main.scss';
                      })
                      .forEach((file) => {
                        content = content + `\n @import "@integration/${file}";`;
                      });
                  }
                  return content;
                },
              },
            },
          ],
        },
      ],
    },
  };
  config = handoff.integrationHooks.hooks.webpack(handoff, config);
  config = handoff.hooks.webpack(config);
  return config;
};
