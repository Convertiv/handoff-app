import webpack from 'webpack';
import path from 'path';
import chalk from 'chalk';
// import { pluginTransformer } from '../transformers/plugin';
import { fileURLToPath } from 'url';
import { getIntegrationEntryPoint } from '../transformers/integration/index';

export const buildClientFiles = async (): Promise<string> => {
  const entry = getIntegrationEntryPoint();
  const handoff = global.handoff;
  if (!handoff) {
    throw Error('Handoff not initialized');
  }
  return new Promise((resolve, reject) => {
    let config: webpack.Configuration = {
      mode: 'production',
      entry,
      resolve: {
        modules: [
          path.resolve(handoff?.modulePath, 'src'),
          path.resolve(handoff?.modulePath, 'node_modules'),
          path.resolve(handoff?.workingPath, 'node_modules'),
        ],
      },
      output: {
        path: path.resolve(handoff?.modulePath, 'src/app/public/components'),
        filename: 'bundle.js',
      },
      resolveLoader: {
        modules: [
          path.resolve(handoff?.modulePath, 'node_modules'), 
          path.resolve(handoff?.workingPath, 'node_modules')
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
                    includePaths: [ path.resolve(handoff?.workingPath, 'node_modules'),path.resolve(handoff?.modulePath, 'node_modules')],
                  },
                },
              },
            ],
          },
        ],
      },
    };
    config = handoff.integrationHooks.hooks.webpack(config);
    config = handoff.hooks.webpack(config);
    const compile = webpack(config);
    compile.run((err, stats) => {
      if (err) {
        let error = 'Errors encountered trying to build preview styles1.\n';
        if (handoff.debug) {
          error += err.stack || err;
        }
        return reject(error);
      }

      if (stats) {
        if (stats.hasErrors()) {
          let buildErrors = stats.compilation.errors?.map((err) => err.message);
          let error = 'Errors encountered trying to build preview styles2.\n';
          if (handoff.debug) {
            error += buildErrors;
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
      return resolve('Preview template styles built');
    });
  });
};
