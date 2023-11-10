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
  basePath: '',
  env: {
    HANDOFF_BASE_PATH: '',
    HANDOFF_WORKING_PATH: '',
    HANDOFF_EXPORT_PATH: '',
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: path.resolve('public'),
  },
  images: {
    unoptimized: true,
  },
  sassOptions: {
    additionalData: (content, _) => {
      // Local state
      let foundTheme = false;

      // Local environment
      const env = {
        HANDOFF_BASE_PATH: '',
        HANDOFF_WORKING_PATH: '',
        HANDOFF_EXPORT_PATH: '',
      };
      
      // Check if client configuration exists
      const clientConfigPath = path.resolve(env.HANDOFF_WORKING_PATH, 'handoff.config.json');
      if (fs.existsSync(clientConfigPath)) {
        // Load client configuration
        const clientConfig = require(clientConfigPath);
        // Check if client configuration is a valid object
        if (typeof clientConfig === 'object' && !Array.isArray(clientConfig) && clientConfig !== null) {
          // Check if the client configuration specifies a theme
          // If the theme is specified, check if the theme exists in the 'themes' folder
          if (clientConfig.hasOwnProperty('app') && clientConfig['app'].hasOwnProperty('theme') && fs.existsSync(path.resolve(env.HANDOFF_WORKING_PATH, 'theme', `${clientConfig['app']['theme']}.scss`))) {
            // Use custom theme
            foundTheme = true;
            content = content + `\n@import './theme/${clientConfig['app']['theme']}';`;
          }
        }
      }

      if (!foundTheme) {
        // Check if there is a custom version of the default theme
        if (fs.existsSync(path.resolve(env.HANDOFF_WORKING_PATH, 'theme', `default.scss`))) {
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
