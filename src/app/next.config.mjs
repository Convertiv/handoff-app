import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

const resolveBasePath = (rawBasePath) => {
  if (!rawBasePath || rawBasePath.startsWith('%HANDOFF_')) {
    return '';
  }
  const trimmed = rawBasePath.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
};

// Resolved build target drives Next's output mode (technical design §4). The target — not NODE_ENV
// — decides static export vs. dynamic packaging, so workspace dev, the static snapshot, and the
// registry app never get conflated:
//   - `static`   → `output: 'export'` (a self-contained static snapshot).
//   - `registry` → `output: 'standalone'` (a deployable dynamic Next.js app + traced node_modules).
//   - otherwise  → a normal server (workspace `next dev`/`start`).
const handoffBuildTarget = process.env.HANDOFF_BUILD_TARGET;
const handoffModulePath = path.resolve('%HANDOFF_MODULE_PATH%');

const resolveOutputMode = (target) => {
  if (target === 'static') {
    // Static export disables Next API routes, which the workspace docs read API (`/api/docs/*`)
    // depends on, so the static build materializes that read model into route-shaped files instead.
    return 'export';
  }
  if (target === 'registry') {
    // The registry app is a deployable dynamic server (DB-backed docs/registry APIs). Standalone
    // traces the runtime + selected DB driver into a self-contained bundle for Vercel/Node/containers
    // and never runs a static export (issue #11).
    return 'standalone';
  }
  return undefined;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: resolveOutputMode(handoffBuildTarget),
  // The registry app is staged under the package's `.handoff/<projectId>` while its node_modules live
  // at the package root; standalone tracing must root at the package so the traced bundle captures
  // the runtime and the selected Postgres/Neon driver. Only set for the registry target so workspace
  // dev/static tracing is unchanged.
  outputFileTracingRoot: handoffBuildTarget === 'registry' ? handoffModulePath : undefined,
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  trailingSlash: true,
  experimental: {
    externalDir: true,
  },
  eslint: {
    dirs: ['pages', 'utils'],
  },
  transpilePackages: ['handoff-app', 'react-syntax-highlighter'],
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  //distDir: 'out',
  basePath: resolveBasePath('%HANDOFF_APP_BASE_PATH%'),
  env: {
    HANDOFF_PROJECT_ID: '%HANDOFF_PROJECT_ID%',
    HANDOFF_APP_BASE_PATH: '%HANDOFF_APP_BASE_PATH%',
    HANDOFF_WORKING_PATH: '%HANDOFF_WORKING_PATH%',
    HANDOFF_MODULE_PATH: '%HANDOFF_MODULE_PATH%',
    HANDOFF_EXPORT_PATH: '%HANDOFF_EXPORT_PATH%',
    HANDOFF_WEBSOCKET_PORT: '%HANDOFF_WEBSOCKET_PORT%',
    // Resolved runtime mode + registry connection *inputs* (names only, never secrets), baked at
    // build time so the deployed registry app resolves its mode and DB env-var name without any
    // build-machine filesystem (the absolute paths above do not exist on the deploy host). Mode stays
    // config-only — these are derived from `runtime.*`, not inferred from env at runtime. The DB
    // connection string itself is read from the named env var at request time (deployment-supplied).
    HANDOFF_RUNTIME_MODE: '%HANDOFF_RUNTIME_MODE%',
    HANDOFF_REGISTRY_ADAPTER: '%HANDOFF_REGISTRY_ADAPTER%',
    HANDOFF_REGISTRY_DATABASE_URL_ENV: '%HANDOFF_REGISTRY_DATABASE_URL_ENV%',
    HANDOFF_REGISTRY_API_TOKEN_ENV: '%HANDOFF_REGISTRY_API_TOKEN_ENV%',
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
        HANDOFF_PROJECT_ID: '%HANDOFF_PROJECT_ID%',
        HANDOFF_APP_BASE_PATH: '%HANDOFF_APP_BASE_PATH%',
        HANDOFF_WORKING_PATH: '%HANDOFF_WORKING_PATH%',
        HANDOFF_MODULE_PATH: '%HANDOFF_MODULE_PATH%',
        HANDOFF_EXPORT_PATH: '%HANDOFF_EXPORT_PATH%',
        HANDOFF_WEBSOCKET_PORT: '%HANDOFF_WEBSOCKET_PORT%',
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
      '@': path.resolve('.'),
    },
    resolveExtensions: [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
    ],
  },
  webpack: (config, { isServer }) => {
    // Add aliases for webpack (mirrors turbopack.resolveAlias)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@handoff': path.resolve('%HANDOFF_MODULE_PATH%/src'),
      '@': path.resolve('.'),
    };
    return config;
  },
};

export default nextConfig;
