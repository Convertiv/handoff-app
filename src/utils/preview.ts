import webpack from 'webpack';
import path from 'path';
import chalk from 'chalk';
// import { pluginTransformer } from '../transformers/plugin';
import { fileURLToPath } from 'url';
import { getIntegrationEntryPoint } from '../transformers/integration/index.js';

export const buildClientFiles = async (): Promise<string> => {
  const entry = getIntegrationEntryPoint();
  const handoff = global.handoff;
  if (!handoff) {
    throw Error('Handoff not initialized');
  }
  return new Promise((resolve, reject) => {
    console.log(path.resolve(handoff?.modulePath, 'node_modules'));
    let config: webpack.Configuration = {
      mode: 'production',
      entry,
      resolve: {
        modules: [path.resolve(handoff?.modulePath, 'src'), path.resolve(handoff?.modulePath, 'node_modules')],
      },
      output: {
        path: path.resolve(handoff?.workingPath, 'public/components'),
        filename: 'bundle.js',
      },
      resolveLoader: {
        modules: [path.resolve(handoff?.modulePath, 'node_modules')],
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
              'sass-loader',
            ],
          },
        ],
      },
    };
    //const newConfig = plugin.modifyWebpackConfig(config);
    const compile = webpack(config);
    compile.run((err, stats) => {
      if (err) {
        let error = 'Errors encountered trying to build preview styles1.\n';
        if (process.argv.indexOf('--debug') > 0) {
          error += err.stack || err;
        }
        return reject(error);
      }

      if (stats) {
        if (stats.hasErrors()) {
          let buildErrors = stats.compilation.errors?.map((err) => err.message);
          let error = 'Errors encountered trying to build preview styles2.\n';
          if (process.argv.indexOf('--debug') > 0) {
            error += buildErrors;
          }
          return reject(error);
        }

        if (stats.hasWarnings()) {
          let buildWarnings = stats.compilation.warnings?.map((err) => err.message);
          let error = 'Warnings encountered when building preview styles.\n';
          if (process.argv.indexOf('--debug') > 0) {
            error += buildWarnings;
            console.error(chalk.yellow(error));
          }
        }
      }
      return resolve('Preview template styles built');
    });
  });
};
