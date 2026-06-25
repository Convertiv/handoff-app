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
const handoffWorkingPath = path.resolve('%HANDOFF_WORKING_PATH%');

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
  // The registry app is staged under the installed package's `.handoff/<projectId>` (inside
  // `<workingPath>/node_modules/handoff-app`), while the runtime deps (next/react/DB driver) are
  // hoisted up to the consumer's top-level `<workingPath>/node_modules`. Next's file tracer copies
  // only files *inside* this root, so it must be the consumer project root — the nearest common
  // ancestor of both the staged app and the hoisted deps. Rooting it at the package dir (above which
  // the hoisted deps live) would trace an empty `node_modules` and ship a non-bootable bundle. Only
  // set for the registry target so workspace dev/static tracing is unchanged.
  outputFileTracingRoot: handoffBuildTarget === 'registry' ? handoffWorkingPath : undefined,
  // With the trace rooted at the project, nft now fully traces the server and the app's own bundled
  // code — which constructs build-time export paths (the static-export materializer's `export/<page>`
  // targets) and references the `export-detail.json` constant. nft speculatively treats those strings
  // as runtime file deps, but they are export-only artifacts that never exist in a `standalone` build
  // and the SSR server never reads them. `copyTracedFiles` copies traced files with no existence
  // guard, so leaving them in the trace fails the build with `ENOENT`. Drop them from the trace; the
  // `**` key matches both the `next-server` trace and every per-page trace. Registry-only so workspace
  // dev/static export (which legitimately produces these files) is untouched.
  outputFileTracingExcludes:
    handoffBuildTarget === 'registry' ? { '**': ['**/export-detail.json', '**/.next/export/**'] } : undefined,
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
    // Resolved build target, baked so the client can tell a self-contained static snapshot apart
    // from a live workspace/registry app (e.g. the header hides the runtime-mode badge in the
    // static export). Read straight from the build env — empty for workspace dev/start.
    HANDOFF_BUILD_TARGET: handoffBuildTarget ?? '',
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
