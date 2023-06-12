import webpack from 'webpack';
import path from 'path';
import chalk from 'chalk';
// import { pluginTransformer } from '../transformers/plugin';
import { fileURLToPath } from 'url';
import { getIntegrationEntryPoint } from '../transformers/integration/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(process.cwd());;

export const buildClientFiles = async (): Promise<string> => {
  const entry = getIntegrationEntryPoint();
  return new Promise((resolve, reject) => {
    let config: webpack.Configuration = {
      mode: 'production',
      entry,
      resolve: {
        modules: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules'),
        ],
      },
      output: {
        path: path.resolve(__dirname, '../../public/components'),
        filename: 'bundle.js',
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
