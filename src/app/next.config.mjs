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

// Resolved build target drives Next's output mode. The target — not NODE_ENV
// — decides static export vs. dynamic packaging, so workspace dev, the static snapshot, and the
// registry app never get conflated:
//   - `static`   → `output: 'export'` (a self-contained static snapshot).
//   - `registry` → `output: 'standalone'` (a deployable dynamic Next.js app + traced node_modules).
//   - otherwise  → a normal server (workspace `next dev`/`start`).
const handoffBuildTarget = process.env.HANDOFF_BUILD_TARGET;
const handoffWorkingPath = path.resolve('%HANDOFF_WORKING_PATH%');

// A configured custom asset-storage adapter module (relative to the consumer project). It is loaded
// by a variable dynamic import at runtime, which nft cannot statically trace, so force it (and its
// resolvable deps) into the registry bundle. Empty/unset for the built-in database/Vercel adapters.
const handoffAssetStorageModule = '%HANDOFF_ASSET_STORAGE_MODULE%';
const resolveAssetStorageInclude = () => {
  if (handoffBuildTarget !== 'registry' || !handoffAssetStorageModule || handoffAssetStorageModule.startsWith('%HANDOFF_')) {
    return undefined;
  }
  const abs = path.isAbsolute(handoffAssetStorageModule) ? handoffAssetStorageModule : path.resolve(handoffWorkingPath, handoffAssetStorageModule);
  return { '/api/**': [abs] };
};

const resolveOutputMode = (target) => {
  if (target === 'static') {
    // Static export disables Next API routes, which the workspace docs read API (`/api/docs/*`)
    // depends on, so the static build materializes that read model into route-shaped files instead.
    return 'export';
  }
  if (target === 'registry') {
    // The registry app is a deployable dynamic server (DB-backed docs/registry APIs). Standalone
    // traces the runtime + selected DB driver into a self-contained bundle for Vercel/Node/containers
    // and never runs a static export.
    return 'standalone';
  }
  return undefined;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: resolveOutputMode(handoffBuildTarget),
  // The tracer only copies files inside its root, so root it at the consumer project — the common
  // ancestor of the staged app (`node_modules/handoff-app/.handoff/<projectId>`) and the runtime deps
  // hoisted to the top-level `node_modules`. Rooting at the package dir would trace an empty
  // `node_modules` and ship a non-bootable bundle. Registry-only; workspace dev/static is unchanged.
  outputFileTracingRoot: handoffBuildTarget === 'registry' ? handoffWorkingPath : undefined,
  // nft speculatively traces the export-only paths the app references (`export-detail.json` and the
  // materializer's `.next/export/**` targets) as runtime deps. They never exist in a `standalone`
  // build, and `copyTracedFiles` copies traced files with no existence guard, so leaving them in
  // fails the build with `ENOENT`. Exclude them (`**` matches the server + every per-page trace).
  // Registry-only; static export, which legitimately produces these files, is untouched.
  outputFileTracingExcludes:
    handoffBuildTarget === 'registry' ? { '**': ['**/export-detail.json', '**/.next/export/**'] } : undefined,
  // Force a configured custom asset-storage module into the registry trace (dynamic import is opaque
  // to nft). Its SDK deps are additionally asserted via `getRequiredRegistryRuntimeModules`.
  outputFileTracingIncludes: resolveAssetStorageInclude(),
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  trailingSlash: true,
  experimental: {
    externalDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['handoff-app', 'react-syntax-highlighter'],
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
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
    HANDOFF_REGISTRY_DRIVER: '%HANDOFF_REGISTRY_DRIVER%',
    HANDOFF_REGISTRY_DATABASE_URL_ENV: '%HANDOFF_REGISTRY_DATABASE_URL_ENV%',
    HANDOFF_REGISTRY_API_TOKEN_ENV: '%HANDOFF_REGISTRY_API_TOKEN_ENV%',
    // Asset storage selection (provider + non-secret options + env-var names). Secret values (Blob
    // token, custom credentials) are read from their named env var at request time, never baked.
    HANDOFF_ASSET_STORAGE_ADAPTER: '%HANDOFF_ASSET_STORAGE_ADAPTER%',
    HANDOFF_ASSET_STORAGE_MODULE: '%HANDOFF_ASSET_STORAGE_MODULE%',
    HANDOFF_ASSET_STORAGE_TOKEN_ENV: '%HANDOFF_ASSET_STORAGE_TOKEN_ENV%',
    HANDOFF_ASSET_STORAGE_MAX_INLINE_BYTES: '%HANDOFF_ASSET_STORAGE_MAX_INLINE_BYTES%',
    HANDOFF_ASSET_STORAGE_OPTIONS: '%HANDOFF_ASSET_STORAGE_OPTIONS%',
  },
  images: {
    unoptimized: true,
  },
  sassOptions: {
    additionalData: (content, _) => {
      let foundTheme = false;

      const env = {
        HANDOFF_PROJECT_ID: '%HANDOFF_PROJECT_ID%',
        HANDOFF_APP_BASE_PATH: '%HANDOFF_APP_BASE_PATH%',
        HANDOFF_WORKING_PATH: '%HANDOFF_WORKING_PATH%',
        HANDOFF_MODULE_PATH: '%HANDOFF_MODULE_PATH%',
        HANDOFF_EXPORT_PATH: '%HANDOFF_EXPORT_PATH%',
        HANDOFF_WEBSOCKET_PORT: '%HANDOFF_WEBSOCKET_PORT%',
      };

      const clientConfigPath = path.resolve(env.HANDOFF_WORKING_PATH, 'handoff.config.json');
      if (fs.existsSync(clientConfigPath)) {
        const clientConfigRaw = fs.readFileSync(clientConfigPath);
        const clientConfig = JSON.parse(clientConfigRaw);
        if (typeof clientConfig === 'object' && !Array.isArray(clientConfig) && clientConfig !== null) {
          if (
            clientConfig.hasOwnProperty('app') &&
            clientConfig['app'].hasOwnProperty('theme') &&
            fs.existsSync(path.resolve(env.HANDOFF_WORKING_PATH, 'theme', `${clientConfig['app']['theme']}.scss`))
          ) {
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
        if (fs.existsSync(path.resolve(env.HANDOFF_WORKING_PATH, 'theme', `default.scss`))) {
          content = content + `\n@import 'theme/default';`;
          console.log(
            `- ${chalk.cyan('info')} Using default app theme override (path: ${path.resolve(
              env.HANDOFF_WORKING_PATH,
              'theme',
              `default.scss`
            )})`
          );
        } else {
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
