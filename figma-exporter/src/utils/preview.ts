import webpack from 'webpack';
import path from 'path';
import chalk from 'chalk';

export const buildClientFiles = () => {
  webpack(
    {
      mode: 'production',
      entry: path.resolve(__dirname, '../../templates/main.js'),
      resolve: {
        modules: [
          path.resolve(__dirname, '../..'),
          path.resolve(__dirname, '../../..'),
          path.resolve(__dirname, '../../node_modules'),
          path.resolve(__dirname, '../../../../node_modules'),
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
    },
    (err, stats) => {
      if (err || stats?.hasErrors()) {
        // ...
        console.log(chalk.red('Client styles failed'));
        throw err;
      }
      console.log(chalk.green('Client Styles Built'));
      // Done processing
    }
  );
};
