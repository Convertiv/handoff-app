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
      if (fs.existsSync('handoff.config.json')) {
        // Load client configuration
        const clientConfig = require(path.resolve('handoff.config.json'));
        // Check if client configuration is a valid object
        if (typeof clientConfig === 'object' && !Array.isArray(clientConfig) && clientConfig !== null) {
          // Check if the client configuration specifies a theme
          // If the theme is specified, check if the theme exists in the 'themes' folder
          if (clientConfig.hasOwnProperty('theme') && fs.existsSync(path.resolve('theme', `${clientConfig['theme']}.scss`))) {
            // Use custom theme
            foundTheme = true;
            content = content + `\n@import './theme/${clientConfig['theme']}';`;
          }
        }
      }

      if (!foundTheme) {
        // Use default theme
        content = content + `\n@import 'themes/default';`;
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
