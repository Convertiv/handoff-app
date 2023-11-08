const fs = require('fs-extra');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['handoff-app', 'react-syntax-highlighter'],
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  distDir: 'out',
  basePath: '__HANDOFF.BASE_PATH__',
  env: {
    HANDOFF_EXPORT_PATH: '__HANDOFF.EXPORT_PATH__',
    NEXT_BASE_PATH: '__HANDOFF.BASE_PATH__',
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: path.resolve('public'),
  },
  images: {
    unoptimized: true,
  },
  sassOptions: {
    additionalData: (content, loaderContext) => {
      let foundTheme = false;
      // Check if client configuration exists
      const clientConfigPath = path.resolve('__HANDOFF.WORKING_PATH__', 'handoff.config.json');
      if (fs.existsSync(clientConfigPath)) {
        // Load client configuration
        const clientConfig = require(clientConfigPath);
        // Check if client configuration is a valid object
        if (typeof clientConfig === 'object' && !Array.isArray(clientConfig) && clientConfig !== null) {
          // Check if the client configuration specifies a theme
          // If the theme is specified, check if the theme exists in the 'themes' folder
          if (clientConfig.hasOwnProperty('app') && clientConfig['app'].hasOwnProperty('theme') && fs.existsSync(path.resolve('__HANDOFF.WORKING_PATH__', 'theme', `${clientConfig['app']['theme']}.scss`))) {
            // Use custom theme
            foundTheme = true;
            content = content + `\n@import './theme/${clientConfig['app']['theme']}';`;
          }
        }
      }

      if (!foundTheme) {
        // Check if there is a custom version of the default theme
        if (fs.existsSync(path.resolve('__HANDOFF.WORKING_PATH__', 'theme', `default.scss`))) {
          // Use custom theme
          content = content + `\n@import 'theme/default';`;
        } else {
          // Use default theme
          content = content + `\n@import 'themes/default';`;
        }
      }

      return content;
    },
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    config.resolve.modules.push(path.resolve('dist/app'));
    config.resolve.modules.push(path.resolve('node_modules'));
    config.resolveLoader.modules.push(path.resolve('node_modules'));
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset',
    });
    config.module.rules.push({
      test: /\.html$/i,
      loader: 'html-loader',
    });
    return config;
  },
};
module.exports = nextConfig;
