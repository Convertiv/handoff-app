import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  trailingSlash: true,
  experimental: {
    externalDir: true,
    turbopack: true, // Enable Turbopack
  },
  eslint: {
    dirs: ['pages', 'utils'],
  },
  transpilePackages: ['handoff-app', 'react-syntax-highlighter'],
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  //distDir: 'out',
  basePath: '',
  env: {
    HANDOFF_PROJECT_ID: '',
    HANDOFF_APP_BASE_PATH: '',
    HANDOFF_WORKING_PATH: '',
    HANDOFF_MODULE_PATH: '',
    HANDOFF_EXPORT_PATH: '',
    HANDOFF_WEBSOCKET_PORT: '',
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
        HANDOFF_PROJECT_ID: '',
        HANDOFF_APP_BASE_PATH: '',
        HANDOFF_WORKING_PATH: '',
        HANDOFF_MODULE_PATH: '',
        HANDOFF_EXPORT_PATH: '',
        HANDOFF_WEBSOCKET_PORT: '',
      };

      // Check if client configuration exists
      const clientConfigPath = path.resolve(env.HANDOFF_WORKING_PATH, 'handoff.config.json');
      if (fs.existsSync(clientConfigPath)) {
        // Load client configuration
        const clientConfigRaw = fs.readFileSync(clientConfigPath);
        const clientConfig = JSON.parse(clientConfigRaw);
        // Check if client configuration is a valid object
        if (typeof clientConfig === 'object' && !Array.isArray(clientConfig) && clientConfig !== null) {
          // Check if the client configuration specifies a theme
          // If the theme is specified, check if the theme exists in the 'themes' folder
          if (
            clientConfig.hasOwnProperty('app') &&
            clientConfig['app'].hasOwnProperty('theme') &&
            fs.existsSync(path.resolve(env.HANDOFF_WORKING_PATH, 'theme', `${clientConfig['app']['theme']}.scss`))
          ) {
            // Use custom theme
            foundTheme = true;
            content = content + `\n@import '${path.resolve(env.HANDOFF_WORKING_PATH, 'theme', clientConfig['app']['theme'])}';`;
            console.log(
              `- ${chalk.cyan('info')} Using custom app theme (name: ${clientConfig['app']['theme']}, path: ${path.resolve(
                env.HANDOFF_WORKING_PATH,
                'theme',
                clientConfig['app']['theme']
              )}.scss)`
            );
          }
        }
      }

      if (!foundTheme) {
        // Check if there is a custom version of the default theme
        if (fs.existsSync(path.resolve(env.HANDOFF_WORKING_PATH, 'theme', `default.scss`))) {
          // Use custom theme
          content = content + `\n@import 'theme/default';`;
          console.log(
            `- ${chalk.cyan('info')} Using default app theme override (path: ${path.resolve(
              env.HANDOFF_WORKING_PATH,
              'theme',
              `default.scss`
            )})`
          );
        } else {
          // Use default theme
          content = content + `\n@import 'themes/default';`;
          console.log(`- ${chalk.cyan('info')} Using default app theme`);
        }
      }

      return content;
    },
  },
  turbopack: { 
    resolveAlias: {
      '@handoff': path.resolve('%HANDOFF_MODULE_PATH%/src'),
    },
    resolveModules: [
      path.resolve('dist/app'),
      path.resolve('node_modules'),
    ],
    resolveLoaders: [
      path.resolve('node_modules'),
    ],
    resolveRules: [
      {
        test: /\.svg$/i,
        type: 'asset',
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
    ],
    resolveFallback: {
      fs: false,
    },
    resolveExtensions: [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
    ],
    resolveLoaderExtensions: [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
    ],
    resolveLoaderRules: [
      {
        test: /\.svg$/i,
        type: 'asset',
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
    ],
    resolveLoaderFallback: {
      fs: false,
    },
    resolveLoaderExtensions: [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
    ],
  }
};

export default nextConfig;
