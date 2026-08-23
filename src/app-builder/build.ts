import * as p from '@clack/prompts';
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { buildComponents } from '../pipeline/components';
import { buildPatterns } from '../pipeline/patterns';
import { resolveAssetStorageFromConfig } from '../registry/asset-storage/resolve';
import { resolveDatabaseUrlEnv, resolveRegistryDriver } from '../registry/db/driver';
import processComponents from '../transformers/preview/component/builder';
import { buildMainCss } from '../transformers/preview/component/css';
import { buildMainJS } from '../transformers/preview/component/javascript';
import type { RuntimeMode } from '../types/config';
import { Logger } from '../utils/logger';
import { generateTokensApi, persistClientConfig } from './client-config';
import { generateDefaultPages, generateNavShell } from './nav-shell';
import { getAppPath, syncPublicFiles } from './paths';
import { materializeDocsReadModel, validateReferencedArtifacts } from './static-export';
import { getVercelOutputPath, writeRegistryVercelOutput, writeStaticVercelOutput } from './vercel-output';
import {
  WatcherState,
  getRuntimeComponentsPathsToWatch,
  watchAppSource,
  watchComponentDirectories,
  watchGlobalEntries,
  watchPages,
  watchPatternDirectories,
  watchPublicDirectory,
  watchRuntimeComponents,
  watchRuntimeConfiguration,
} from './watchers';
import { createWebSocketServer } from './websocket';

/**
 * Resolved build target. Bare `handoff-app build` resolves to `static`. The
 * target — not `NODE_ENV` — drives whether Next runs a static export, so a future non-static
 * `next build` path (registry) does not get conflated with static export.
 */
export type BuildTarget = 'static' | 'registry';

/** The default build target when none is supplied on the CLI. */
export const DEFAULT_BUILD_TARGET: BuildTarget = 'static';

/**
 * Resolved packaging axis — orthogonal to {@link BuildTarget}. It
 * selects *how* the build is packaged, not *what* is built:
 *   - `standalone` → the existing sites-directory deliverable (`out/<projectId>` for static, the
 *     Node standalone bundle `out/registry` for registry).
 *   - `vercel`     → the Vercel Build Output API directory (`.vercel/output`) at the repo root.
 *
 * `--package` never implies a {@link BuildTarget}; it is optional and additive. When omitted, the
 * effective package is target-specific (`standalone` for both targets) so existing behavior is
 * unchanged.
 */
export type BuildPackage = 'standalone' | 'vercel';

/**
 * An expected build configuration / flow failure surfaced to the CLI — an invalid `(target,
 * package)` combination, an unsupported runtime mode for the target, or a not-yet-available
 * deliverable. These are actionable user-facing conditions, not bugs, so the CLI prints the message
 * on its own (no stack trace). Genuine/unexpected failures stay plain `Error`s and keep their stack.
 */
export class HandoffBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandoffBuildError';
  }
}

/**
 * Resolve and validate the effective `(target, package)` pair.
 *
 * `--package` is optional and never implies a target. When omitted the effective package is
 * `standalone` for both targets, preserving today's `out/<projectId>` / `out/registry` deliverables.
 * The one rejected combination is `static + standalone`: a static snapshot has no server to package
 * as a Node standalone bundle.
 */
const resolveBuildPackage = (target: BuildTarget, buildPackage?: BuildPackage): BuildPackage => {
  const resolved: BuildPackage = buildPackage ?? 'standalone';
  if (target === 'static' && buildPackage === 'standalone') {
    throw new HandoffBuildError(
      'Cannot package the static target as a Node standalone bundle (`--target static --package standalone`). ' +
        'A static snapshot has no server to run; omit `--package` for the static export, or use ' +
        '`--package vercel` for the Vercel Build Output API, or build `--target registry` for the standalone server bundle.'
    );
  }
  return resolved;
};

const escapeForSingleQuotedJsString = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * Guard the static build target against a registry-only runtime configuration. A static export
 * builds and serves the local workspace; a `runtime.mode: 'registry'` project has no local workspace
 * to export, so the build fails clearly rather than producing an empty or misleading site.
 */
const assertStaticBuildAllowed = (handoff: Handoff): void => {
  const mode = handoff.config?.runtime?.mode ?? 'workspace';
  if (mode === 'registry') {
    throw new HandoffBuildError(
      'Cannot run the static build target with a registry-only runtime (runtime.mode: "registry"). ' +
        'The static target builds and exports the local workspace; switch runtime.mode to "workspace" ' +
        'or package the registry app with `handoff-app build --target registry`.'
    );
  }
};

/**
 * Run the Next.js production build while keeping its delayed output out of the successful CLI flow.
 * Captured output is replayed only when the child fails so compiler diagnostics remain available.
 */
const runNextBuild = async (appPath: string, target: BuildTarget, errorLabel: string): Promise<void> => {
  const spinner = p.spinner();
  spinner.start('Building Next.js app...');

  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    const buildProcess = spawn('npx', ['next', 'build'], {
      cwd: appPath,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'production',
        HANDOFF_BUILD_TARGET: target,
      },
    });

    buildProcess.stdout?.on('data', (chunk: Buffer) => stdout.push(Buffer.from(chunk)));
    buildProcess.stderr?.on('data', (chunk: Buffer) => stderr.push(Buffer.from(chunk)));

    let settled = false;

    const fail = (message: string): void => {
      if (settled) return;
      settled = true;

      spinner.stop('Next.js app build failed');
      Logger.childProcessBuffer(Buffer.concat(stdout));
      Logger.childProcessBuffer(Buffer.concat(stderr));
      reject(new Error(message));
    };

    buildProcess.once('error', (error) => {
      fail(`${errorLabel} failed to start\nSpawn error: ${error.message}`);
    });

    buildProcess.once('close', (code, signal) => {
      if (settled) return;

      if (code === 0) {
        settled = true;
        spinner.stop('Next.js app built successfully');
        resolve();
        return;
      }

      const reason = signal ? ` because it was terminated by signal ${signal}` : ` with exit code ${code}`;
      fail(`${errorLabel} failed${reason}`);
    });
  });
};

/**
 * Output directory for the packaged registry app. Lives under the configurable sites output
 * directory (`sitesOutputDirectory`, default `out`) alongside the static target's `out/<projectId>`
 * deliverable — both build targets emit to one discoverable, gitignored output root, keeping the
 * package's `.handoff` for internal build/staging only. The registry artifact is a single
 * deployable, so it is not keyed by project id.
 */
export const getRegistryBuildOutputPath = (handoff: Handoff): string =>
  path.resolve(handoff.workingPath, handoff.sitesDirectory, 'registry');

/**
 * Performs cleanup of the application directory by removing the existing app directory if it exists.
 */
const cleanupAppDirectory = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);

  // Clean project app dir
  if (fs.existsSync(appPath)) {
    await fs.remove(appPath);
  }
};

/**
 * Options controlling how the project app is staged for a build target.
 */
interface InitializeProjectAppOptions {
  /**
   * Whether to stage workspace-derived artifacts (generated tokens API + the workspace `public`
   * tree). The static target serves these from the exported site; the registry target must never
   * depend on workspace source, so it skips them and serves everything from the database instead.
   * Defaults to `true` (workspace dev/static behavior).
   */
  includeWorkspaceArtifacts?: boolean;
  /**
   * Force the runtime mode baked into the app bundle, irrespective of the source project's
   * `runtime.mode`. The registry build sets this to `registry` so the packaged artifact always runs
   * as a registry deployment even when built from a workspace-mode project (mode stays config-only
   * at runtime — it is fixed here by the build target, not inferred from the deploy environment).
   */
  runtimeModeOverride?: RuntimeMode;
}

/**
 * Prepares the project application by copying source files and configuring Next.js.
 *
 * @returns The path to the prepared application directory
 */
const initializeProjectApp = async (handoff: Handoff, options: InitializeProjectAppOptions = {}): Promise<string> => {
  const includeWorkspaceArtifacts = options.includeWorkspaceArtifacts ?? true;
  const runtimeMode = options.runtimeModeOverride ?? handoff.config?.runtime?.mode ?? 'workspace';
  const srcPath = path.resolve(handoff.modulePath, 'src', 'app');
  const appPath = getAppPath(handoff);

  // Publish tokens API (workspace-derived; skipped for the registry target which serves from the DB).
  if (includeWorkspaceArtifacts) {
    await generateTokensApi(handoff);
  }

  // Prepare project app dir
  await fs.ensureDir(appPath);
  await fs.copy(srcPath, appPath, { overwrite: true, filter: (file) => !file.includes('next.config.mjs') });
  if (includeWorkspaceArtifacts) {
    await syncPublicFiles(handoff);
  }

  // Copy custom theme CSS if it exists in the user's project
  const customThemePath = path.resolve(handoff.workingPath, 'theme.css');
  const destPath = path.resolve(appPath, 'css', 'theme.css');
  if (fs.existsSync(customThemePath)) {
    await fs.copy(customThemePath, destPath, { overwrite: true });
    Logger.success(`Custom theme.css loaded`);
  } else {
    // create a empty theme.css file
    await fs.writeFile(destPath, '');
  }

  // Prepare project app configuration using stable placeholder replacement.
  const handoffProjectId = handoff.getProjectId();
  const handoffAppBasePath = handoff.config.app.base_path ?? '';
  const handoffWorkingPath = path.resolve(handoff.workingPath);
  const handoffModulePath = path.resolve(handoff.modulePath);
  const handoffExportPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId());
  const nextConfigPath = path.resolve(srcPath, 'next.config.mjs');
  const targetPath = path.resolve(appPath, 'next.config.mjs');
  const handoffWebsocketPort = handoff.config.app.ports?.websocket ?? 3001;
  const escapedAppBasePath = escapeForSingleQuotedJsString(handoffAppBasePath);
  const escapedProjectId = escapeForSingleQuotedJsString(handoffProjectId);
  const escapedWorkingPath = escapeForSingleQuotedJsString(handoffWorkingPath);
  const escapedModulePath = escapeForSingleQuotedJsString(handoffModulePath);
  const escapedExportPath = escapeForSingleQuotedJsString(handoffExportPath);
  const escapedWebsocketPort = escapeForSingleQuotedJsString(String(handoffWebsocketPort));
  // Resolved runtime mode + registry connection inputs (names only) baked into the Next bundle so the
  // deployed registry app resolves its mode/DB env-var name without any build-machine filesystem.
  const escapedRuntimeMode = escapeForSingleQuotedJsString(runtimeMode);
  const escapedRegistryDriver = escapeForSingleQuotedJsString(resolveRegistryDriver(handoff.config));
  const escapedDatabaseUrlEnv = escapeForSingleQuotedJsString(resolveDatabaseUrlEnv(handoff.config));
  // Asset storage selection baked (provider + module + env-var names + non-secret options JSON).
  const assetStorage = resolveAssetStorageFromConfig(handoff.config);
  const escapedAssetStorageAdapter = escapeForSingleQuotedJsString(assetStorage.adapterKind);
  const escapedAssetStorageModule = escapeForSingleQuotedJsString(assetStorage.module ?? '');
  const escapedAssetStorageTokenEnv = escapeForSingleQuotedJsString(assetStorage.tokenEnv);
  const escapedAssetStorageMaxInline = escapeForSingleQuotedJsString(String(assetStorage.maxInlineBytes));
  const escapedAssetStorageOptions = escapeForSingleQuotedJsString(JSON.stringify(assetStorage.options ?? {}));
  const placeholderValues: Record<string, string> = {
    '%HANDOFF_PROJECT_ID%': escapedProjectId,
    '%HANDOFF_APP_BASE_PATH%': escapedAppBasePath,
    '%HANDOFF_WORKING_PATH%': escapedWorkingPath,
    '%HANDOFF_MODULE_PATH%': escapedModulePath,
    '%HANDOFF_EXPORT_PATH%': escapedExportPath,
    '%HANDOFF_WEBSOCKET_PORT%': escapedWebsocketPort,
    '%HANDOFF_RUNTIME_MODE%': escapedRuntimeMode,
    '%HANDOFF_REGISTRY_DRIVER%': escapedRegistryDriver,
    '%HANDOFF_REGISTRY_DATABASE_URL_ENV%': escapedDatabaseUrlEnv,
    '%HANDOFF_ASSET_STORAGE_ADAPTER%': escapedAssetStorageAdapter,
    '%HANDOFF_ASSET_STORAGE_MODULE%': escapedAssetStorageModule,
    '%HANDOFF_ASSET_STORAGE_TOKEN_ENV%': escapedAssetStorageTokenEnv,
    '%HANDOFF_ASSET_STORAGE_MAX_INLINE_BYTES%': escapedAssetStorageMaxInline,
    '%HANDOFF_ASSET_STORAGE_OPTIONS%': escapedAssetStorageOptions,
  };
  let nextConfigContent = await fs.readFile(nextConfigPath, 'utf-8');
  for (const [placeholder, value] of Object.entries(placeholderValues)) {
    nextConfigContent = nextConfigContent.split(placeholder).join(value);
  }
  await fs.writeFile(targetPath, nextConfigContent);

  // Bake the markdown-driven navigation shell before `next build` so the docs read API can import it
  // statically (it is unreadable at runtime in the Vercel registry function). Generated for every
  // target; only registry-mode clients fetch it.
  // Registry builds must not bake workspace pages into the shell — they come from the DB at runtime.
  await generateNavShell(handoff, appPath, runtimeMode !== 'registry');
  await generateDefaultPages(handoff, appPath);

  return appPath;
};

/**
 * Build the Next.js documentation application for the resolved target. The `static` target builds
 * and exports the local workspace (default); the `registry` target packages the deployable dynamic
 * registry app via {@link buildRegistryApp}.
 */
const buildApp = async (
  handoff: Handoff,
  target: BuildTarget = DEFAULT_BUILD_TARGET,
  skipComponents?: boolean,
  buildPackage?: BuildPackage
): Promise<void> => {
  // Resolve + validate the (target, package) pair once, before any work.
  const resolvedPackage = resolveBuildPackage(target, buildPackage);

  if (target === 'registry') {
    await buildRegistryApp(handoff, resolvedPackage);
    return;
  }

  // A registry-only runtime has no local workspace to export — fail clearly before any work.
  assertStaticBuildAllowed(handoff);

  skipComponents = skipComponents ?? false;
  // Perform cleanup
  await cleanupAppDirectory(handoff);

  // Build components, then patterns (patterns depend on component output)
  if (!skipComponents) {
    await buildComponents(handoff);
    await buildPatterns(handoff);
  }

  // Prepare app
  const appPath = await initializeProjectApp(handoff);

  await persistClientConfig(handoff);

  // Fail before export if generated HTML references a required artifact that cannot be materialized.
  validateReferencedArtifacts(handoff);

  // Build app. The static target drives Next's `output: 'export'` via HANDOFF_BUILD_TARGET so the
  // export gate is tied to the resolved target, not to NODE_ENV.
  await runNextBuild(appPath, target, 'Next.js build');

  // Reproduce the docs read API (`/api/docs/*`) as route-shaped static files in the export output,
  // since `output: 'export'` disables the live API routes.
  const exportDir = path.resolve(appPath, 'out');
  await materializeDocsReadModel(handoff, exportDir);

  // Final assembly branches on the resolved package. `vercel` lays the materialized export
  // under `.vercel/output/static/` at the repo root (not the sites directory) — a hard Vercel
  // constraint; `standalone` keeps writing the `out/<projectId>` export.
  if (resolvedPackage === 'vercel') {
    await writeStaticVercelOutput(handoff, exportDir);
    return;
  }

  // Ensure output root directory exists
  const outputRoot = path.resolve(handoff.workingPath, handoff.sitesDirectory);
  await fs.ensureDir(outputRoot);

  // Clean the project output directory (if exists)
  const output = path.resolve(outputRoot, handoff.getProjectId());
  if (fs.existsSync(output)) {
    await fs.remove(output);
  }

  // Copy the build files into the project output directory
  await fs.copy(exportDir, output);
};

/**
 * Recursively locate the directory containing the standalone `server.js` entry, used as a fallback
 * when the deterministic (tracing-root-relative) location does not resolve — e.g. if Next changes
 * the standalone layout. Returns the first match (breadth-first), or `null` when none is found.
 */
const findStandaloneServerDir = (root: string): string | null => {
  if (!fs.existsSync(root)) {
    return null;
  }
  const queue: string[] = [root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    if (entries.some((entry) => entry.isFile() && entry.name === 'server.js')) {
      return current;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        queue.push(path.join(current, entry.name));
      }
    }
  }
  return null;
};

/**
 * Write a deployment guide next to the packaged registry app describing how to run it on Vercel,
 * a custom Node server, or in a container, and which env vars it requires at deploy time.
 */
const writeRegistryDeploymentReadme = async (
  outputRoot: string,
  entryRelativePath: string,
  databaseUrlEnv: string
): Promise<void> => {
  const readme = `# Handoff Registry App

A self-contained, deployable Next.js **standalone** build produced by
\`handoff-app build --target registry\`. It serves the docs read API (\`/api/docs/*\`) and the
registry API from a PostgreSQL database and the published docs read-model artifacts — it never
builds or depends on local workspace component/pattern source, and never runs a static export.

This is the [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output):
\`server.js\` and the trimmed \`node_modules\` it needs sit at this directory's root, with \`public/\`
and \`.next/static/\` already copied alongside so the server serves them.

## Required environment variables (supplied at deploy time, never baked in)

- \`${databaseUrlEnv}\` — PostgreSQL/Neon connection string, read at request time.
- \`AUTH_SECRET\` — a long, random secret used to sign browser sessions.
- \`AUTH_URL\` — the canonical public registry URL, including the configured base path.

Optional email delivery uses \`RESEND_API_KEY\` and \`AUTH_FROM_EMAIL\`. Without them, invitation
links are shown once to an administrator for manual delivery.

## Database migrations

Apply migrations from the \`handoff-app\` CLI as a controlled release step (e.g. in your CI/CD
pipeline) before deploying new code:

\`\`\`bash
${databaseUrlEnv}="postgres://…" handoff-app db:migrate
\`\`\`

\`db:migrate\` reads your project config + DB env vars, resolves the same database driver the app was
built with, and applies the package-owned migration set. It runs independently of \`build\` and of
starting the server, so run it as a release/one-shot job.

## Complete the one-time installation

After migrations and deployment, open \`/install\` immediately and create the initial administrator.
The installer verifies the deployment but never changes the schema. An exposed, uninstalled registry
can be claimed by its first visitor, so do not leave this step unattended.

Once installation completes, sign in and authorize a workspace:

\`\`\`bash
handoff-app login --url https://registry.example.com
\`\`\`

The browser approval issues a revocable, user-owned credential. The former
\`HANDOFF_REGISTRY_API_TOKEN\` fixed server secret is no longer accepted.

## Run it (self-hosting)

Standalone is the documented artifact for self-hosting on a Node.js server, VPS, Docker, or
Kubernetes. Start the bundled server from this directory:

\`\`\`bash
${databaseUrlEnv}="postgres://…" node ${entryRelativePath}
\`\`\`

The server listens on \`PORT\` (default \`3000\`) and \`HOSTNAME\` (default \`localhost\`). **In a
container, set \`HOSTNAME=0.0.0.0\`** so the server is reachable from outside the container:

\`\`\`bash
PORT=3000 HOSTNAME=0.0.0.0 ${databaseUrlEnv}="postgres://…" node ${entryRelativePath}
\`\`\`

### Docker (sketch)

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["node", "${entryRelativePath}"]
\`\`\`

For multi-instance self-hosting, front \`/_next/static\` with a CDN and configure a shared
\`cacheHandler\` if you rely on ISR.

## Deploying to Vercel

Vercel does **not** use \`output: 'standalone'\` — it ignores that setting and builds with its own
adapter, so this pre-built bundle is **not** the artifact you deploy there. For Vercel, deploy the
registry app via Vercel's Git/CLI source build (it produces and serves the dynamic app itself) and
supply the same environment variables above as project env vars. Use this standalone bundle for
containers, custom Node servers, and other non-Vercel hosts.
`;
  await fs.writeFile(path.join(outputRoot, 'README.md'), readme);
};

/**
 * Resolve the set of npm packages the packaged registry app must be able to `require`/`import` at
 * runtime, given the configured database driver. `next`/`react`/`react-dom` run the server and React
 * runtime; `drizzle-orm` backs both the request-time DB client and the migration runner; the driver
 * package is driver-specific (the Neon serverless driver also needs `ws` for its Node WebSocket transport).
 */
const getRequiredRegistryRuntimeModules = (handoff: Handoff): string[] => {
  const base = ['next', 'next-auth', 'react', 'react-dom', 'drizzle-orm'];
  const driver = resolveRegistryDriver(handoff.config);
  const driverModules = driver === 'neon' ? ['@neondatabase/serverless', 'ws'] : ['pg'];
  // Asset-storage SDKs the deployed registry must be able to load at request time. The pre-packaged
  // Vercel Blob adapter needs `@vercel/blob`; a custom adapter may declare its installed SDK
  // package(s) via `assetStorage.options.sdkModules` so the trace/assertion covers them.
  const assetStorage = resolveAssetStorageFromConfig(handoff.config);
  const storage: string[] = [];
  if (assetStorage.adapterKind === 'vercel-blob') {
    storage.push('@vercel/blob');
  }
  const sdkModules = assetStorage.options?.sdkModules;
  if (Array.isArray(sdkModules)) {
    storage.push(...sdkModules.filter((mod): mod is string => typeof mod === 'string'));
  }
  return [...base, ...driverModules, ...storage];
};

/**
 * Build-time guard against the empty-`node_modules` regression (the artifact would otherwise boot-fail
 * with `Cannot find module 'next'` only on a real, isolated deploy). After assembly, assert every
 * required runtime module resolves under `<entryDir>/node_modules`. `fs.existsSync` follows symlinks,
 * so this also catches a dangling pnpm symlink (the hoisted link traced without its `.pnpm` target),
 * not just an absent directory.
 *
 * `handoff-app` itself is intentionally not asserted: the app inlines it via the `@handoff` alias and
 * `transpilePackages`, so it is not required by its bare specifier at runtime and may be absent.
 */
const assertRegistryRuntimeDepsTraced = (handoff: Handoff, entryDir: string): void => {
  const required = getRequiredRegistryRuntimeModules(handoff);
  const missing = required.filter((mod) => !fs.existsSync(path.join(entryDir, 'node_modules', ...mod.split('/'), 'package.json')));
  if (missing.length === 0) {
    return;
  }
  throw new HandoffBuildError(
    `The packaged registry app is missing required runtime dependencies in its bundled node_modules: ` +
      `${missing.join(', ')}. The Next file trace did not capture them, so the artifact would fail at ` +
      `startup with "Cannot find module '${missing[0]}'".\n` +
      `This usually means the runtime dependencies are installed *above* the build's tracing root ` +
      `(\`outputFileTracingRoot\`, currently the project root "${handoff.workingPath}"). In a ` +
      `workspace/monorepo the package manager may hoist them to the monorepo root; the tracing root ` +
      `must be the nearest ancestor of *both* the staged app and the resolved node_modules. Ensure ` +
      `${missing.join(', ')} are installed and resolvable from "${handoff.workingPath}".`
  );
};

/**
 * Lay the Next `standalone` build out as the documented standalone layout under `entryDir`: copy the
 * traced bundle, flatten the package-rooted server entry up to `entryDir`, and copy the untraced
 * static assets + public tree + resolved runtime config beside the server entry. Shared by both
 * registry deliverables — the `standalone` package emits this as `out/registry`, and the `vercel`
 * package emits it inside the Build Output API function directory.
 *
 * @returns the absolute path of the server entry (`<entryDir>/server.js`).
 */
const assembleRegistryStandalone = async (
  handoff: Handoff,
  appPath: string,
  standaloneRoot: string,
  entryDir: string
): Promise<string> => {
  await fs.copy(standaloneRoot, entryDir, { overwrite: true });

  // Locate the server entry within the assembled package. Standalone tracing is rooted at the
  // consumer project root (`workingPath`, see next.config.mjs), so every traced file is laid out at
  // its path *relative to `workingPath`*. The staged app lives at `<workingPath>/node_modules/
  // handoff-app/.handoff/<projectId>`, so the server entry lands nested at that same relative path
  // *underneath* the traced `node_modules`. Resolve it deterministically; the recursive fallback
  // skips `node_modules` (so it cannot find this nested entry) and only covers a hypothetical
  // non-nested layout.
  const relAppDir = path.relative(handoff.workingPath, appPath);
  let serverDir = path.resolve(entryDir, relAppDir);
  if (!fs.existsSync(path.join(serverDir, 'server.js'))) {
    const located = findStandaloneServerDir(entryDir);
    if (!located) {
      throw new Error(
        `Could not locate the standalone "server.js" in the packaged registry app at "${entryDir}". ` +
          'The Next standalone layout may have changed.'
      );
    }
    serverDir = located;
  }

  // The project id (and the `.handoff` staging nesting) are irrelevant to the deployable artifact, so
  // flatten the server entry up to `entryDir` — the traced `node_modules` already live there.
  if (path.resolve(serverDir) !== path.resolve(entryDir)) {
    for (const entry of fs.readdirSync(serverDir)) {
      await fs.move(path.join(serverDir, entry), path.join(entryDir, entry), { overwrite: true });
    }
    // Drop the now-empty staging nesting. The entry nests under `node_modules/handoff-app/.handoff`,
    // so we must NOT remove the first path segment (`node_modules`) — that would delete every traced
    // dependency. Remove only the `.handoff` staging container (the parent of the staged app dir),
    // leaving `node_modules/` and the real `node_modules/handoff-app/` package intact.
    const stagingContainer = path.resolve(entryDir, path.relative(handoff.workingPath, path.dirname(appPath)));
    if (path.basename(stagingContainer) === '.handoff' && fs.existsSync(stagingContainer)) {
      await fs.remove(stagingContainer);
    }
  }

  // Static assets and the app's public tree are not traced into standalone — copy them next to the
  // server entry where the Next standalone server expects them.
  const staticSrc = path.resolve(appPath, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    await fs.copy(staticSrc, path.join(entryDir, '.next', 'static'), { overwrite: true });
  }
  const publicSrc = path.resolve(appPath, 'public');
  if (fs.existsSync(publicSrc)) {
    await fs.copy(publicSrc, path.join(entryDir, 'public'), { overwrite: true });
  }

  // Ship the resolved runtime config beside the entry so the deployed server (cwd = entry dir) can
  // read the full client config; runtime mode + DB env-var name are also baked into the bundle.
  for (const configFile of ['client.config.json', 'runtime.server.json']) {
    const src = path.resolve(appPath, configFile);
    if (fs.existsSync(src)) {
      await fs.copy(src, path.join(entryDir, configFile), { overwrite: true });
    }
  }

  // Fail loudly at build time if the trace did not capture the runtime deps, rather than shipping a
  // broken artifact that only crashes on an isolated deploy. Covers both deliverables (this is the
  // shared assembly step for `standalone` and `vercel`).
  assertRegistryRuntimeDepsTraced(handoff, entryDir);

  return path.join(entryDir, 'server.js');
};

/**
 * Package the deployable dynamic registry app.
 *
 * Unlike the static target this never builds or bundles workspace component/pattern source and the
 * resulting artifact has no workspace-source runtime dependency — it ships the app/runtime needed to
 * serve the docs read API and registry API from the database and published docs read-model
 * artifacts. Next always runs a `standalone` build (no static export); the divergence is the
 * final-assembly step driven by `buildPackage`:
 *   - `standalone` (default) → the documented Next.js standalone layout under the sites output
 *     directory (`<project>/<sitesOutputDirectory>/registry`, default `out/registry`) — a
 *     self-hosting artifact for containers, custom Node servers, and VPS, started with
 *     `node server.js`.
 *   - `vercel` → the Vercel Build Output API directory (`.vercel/output`) at the repo root: the
 *     traced bundle wrapped as a Node function plus CDN static assets and a route table.
 *
 * Mode is forced to `registry`; the database driver is honored from config (single-sourced so build
 * and `db:migrate` never diverge). No connection-string value is ever baked — only env-var *names*.
 */
const buildRegistryApp = async (handoff: Handoff, buildPackage: BuildPackage = 'standalone'): Promise<void> => {
  // The registry build target *defines* a registry deployment, so the packaged artifact always runs
  // in registry mode regardless of the source project's `runtime.mode`. Mode stays config-only at
  // runtime — it is fixed here by the build target, never inferred from the deploy environment — so
  // a workspace project can produce a registry app without flipping its own runtime mode.
  const sourceMode = handoff.config?.runtime?.mode ?? 'workspace';
  if (sourceMode !== 'registry') {
    Logger.info(`Source runtime.mode is "${sourceMode}"; forcing "registry" mode in the packaged registry app.`);
  }

  // The driver stays single-sourced from config (never flipped by the package flag), so build and
  // `db:migrate` always resolve the same one. `pg` uses long-lived TCP connections that pool poorly on
  // serverless; warn (non-fatally) so the operator points DATABASE_URL at a pooled endpoint or selects
  // the Neon driver. The connection-string value is not available at build time, so this cannot be
  // validated — it is guidance only and never fails the build.
  if (buildPackage === 'vercel' && resolveRegistryDriver(handoff.config) === 'pg') {
    Logger.warn(
      'Registry Vercel build uses the "pg" driver (standard TCP connections), which pools poorly on ' +
        'serverless and can exhaust the database connection limit. Point DATABASE_URL at a pooled endpoint ' +
        '(PgBouncer / transaction pooling), or set runtime.registry.database.driver: "neon" for a ' +
        'serverless-native HTTP/WebSocket driver. The build will continue.'
    );
  }

  // Stage the app without any workspace-derived artifacts — the registry serves from the database.
  await cleanupAppDirectory(handoff);
  const appPath = await initializeProjectApp(handoff, {
    includeWorkspaceArtifacts: false,
    runtimeModeOverride: 'registry',
  });

  // Persist the resolved client/server runtime config so the deployed app reports registry mode and
  // resolves its DB env-var name (the connection string itself is read from that env var at runtime).
  await persistClientConfig(handoff, { runtimeModeOverride: 'registry' });

  // Remove prior registry outputs *before* tracing. Both deliverables (`out/registry` and
  // `.vercel/output`) live inside the trace root (the project root), and after this fix each contains
  // a full bundled `node_modules`. A stale prior output left in place could be swept into the new
  // trace (bundle bloat / recursive nesting), so clear both up front. The per-deliverable cleanup in
  // the assembly step remains.
  await fs.remove(getRegistryBuildOutputPath(handoff));
  await fs.remove(getVercelOutputPath(handoff));

  // Build the dynamic app. `output: 'standalone'` (driven by HANDOFF_BUILD_TARGET) traces the runtime
  // and the selected Postgres/Neon driver into a self-contained bundle — never a static export.
  await runNextBuild(appPath, 'registry', 'Registry app build');

  // Assemble the deployable package. Standalone tracing is rooted at the package (modulePath), so the
  // app's traced files land under `<relAppDir>` inside the standalone tree; static assets and public
  // files are not traced and must be copied alongside the server entry.
  const standaloneRoot = path.resolve(appPath, '.next', 'standalone');
  if (!fs.existsSync(standaloneRoot)) {
    throw new Error(
      `Registry build did not produce a standalone bundle at "${standaloneRoot}". Ensure the registry ` +
        'build target sets Next `output: "standalone"`.'
    );
  }

  // Final assembly branches on the resolved package. Both lay out
  // the same traced standalone bundle; they differ only in where it lands and how it is wrapped.
  if (buildPackage === 'vercel') {
    await writeRegistryVercelOutput(handoff, { appPath, standaloneRoot, assembleStandalone: assembleRegistryStandalone });
    return;
  }

  // Standalone bundle (default): the documented self-hosting layout under the sites output directory.
  const output = getRegistryBuildOutputPath(handoff);
  await fs.remove(output);
  await fs.ensureDir(output);
  const serverEntry = await assembleRegistryStandalone(handoff, appPath, standaloneRoot, output);

  // Migrations are intentionally not bundled into the artifact: they are applied from the
  // `handoff-app` source/CLI (`handoff-app db:migrate`) as a controlled release step (e.g. CI/CD),
  // never from the deployed bundle. See the generated README for the migrate-then-deploy flow.

  const entryRelativePath = path.relative(output, serverEntry).split(path.sep).join('/');
  await writeRegistryDeploymentReadme(output, entryRelativePath, resolveDatabaseUrlEnv(handoff.config));

  Logger.success(`Packaged registry app at ${output} (start: \`node ${entryRelativePath}\`, migrate: \`handoff-app db:migrate\`).`);
};

/**
 * Watch the Next.js application.
 * Starts a custom dev server with Handoff-specific watchers and hot-reloading.
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  // Build the shared/global artifacts first so component/pattern preview HTML references them only
  // when present, then process components with caching enabled (which skips
  // rebuilding components whose source files haven't changed).
  await buildMainJS(handoff);
  await buildMainCss(handoff);
  await processComponents(handoff, undefined, undefined, { useCache: true });

  // Build patterns after components are ready
  await buildPatterns(handoff);

  const appPath = await initializeProjectApp(handoff);

  // Persist client configuration
  await persistClientConfig(handoff);

  // Watch app source
  watchAppSource(handoff, initializeProjectApp);

  const hostname = 'localhost';
  const port = handoff.config.app.ports?.app ?? 3000;

  // purge out cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    await fs.remove(moduleOutput);
    // create empty directory
    await fs.ensureDir(moduleOutput);
  }
  Logger.info(`Starting Next.js dev server (Turbopack) at http://${hostname}:${port}…`);

  const nextProcess = spawn('npx', ['next', 'dev', '--turbopack', '--port', String(port)], {
    cwd: appPath,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      // Workspace dev is never a static export, even if a static target leaked into the environment.
      HANDOFF_BUILD_TARGET: '',
    },
  });
  Logger.pipeChildStreams(nextProcess.stdout, nextProcess.stderr);

  nextProcess.on('error', (error) => {
    Logger.error(`Next.js dev process failed to start: ${error}`);
    process.exit(1);
  });

  nextProcess.on('close', (code, signal) => {
    if (code === 0) {
      Logger.success(`Next.js dev process exited normally`);
    } else if (signal) {
      Logger.warn(`Next.js dev process stopped (${signal})`);
    } else {
      Logger.error(`Next.js dev process exited with code ${code}`);
    }
    process.exit(code ?? 1);
  });

  const wss = await createWebSocketServer(handoff.config.app.ports?.websocket ?? 3001);

  const chokidarConfig = {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  };

  const state: WatcherState = {
    busy: false,
    pendingHandlers: new Map(),
    runtimeComponentsWatcher: null,
    runtimeConfigurationWatcher: null,
    componentDirectoriesWatcher: null,
    patternDirectoriesWatcher: null,
  };

  watchPublicDirectory(handoff, wss, state, chokidarConfig);
  watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
  watchRuntimeConfiguration(handoff, state);
  watchComponentDirectories(handoff, state, chokidarConfig);
  watchPatternDirectories(handoff, state, chokidarConfig);
  watchGlobalEntries(handoff, state, chokidarConfig);
  watchPages(handoff, chokidarConfig);
};

/**
 * Watch the Next.js application using the standard Next.js dev server.
 * This is useful for debugging the Next.js app itself without the Handoff overlay.
 */
export const devApp = async (handoff: Handoff): Promise<void> => {
  // Prepare app
  const appPath = await initializeProjectApp(handoff);

  // Purge app cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    await fs.remove(moduleOutput);
  }

  // Persist client configuration
  await persistClientConfig(handoff);

  const devPort = handoff.config.app.ports?.app ?? 3000;
  Logger.info(`Starting Next.js dev server (Turbopack) on port ${devPort}…`);

  const devResult = spawn.sync('npx', ['next', 'dev', '--turbopack', '--port', String(devPort)], {
    cwd: appPath,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      // Workspace dev is never a static export, even if a static target leaked into the environment.
      HANDOFF_BUILD_TARGET: '',
    },
  });

  Logger.childProcessBuffer(devResult.stdout);
  Logger.childProcessBuffer(devResult.stderr);

  if (devResult.status !== 0) {
    let errorMsg = `Next.js dev failed with exit code ${devResult.status}`;
    if (devResult.error) {
      errorMsg += `\nSpawn error: ${devResult.error.message}`;
    }
    throw new Error(errorMsg);
  }
};

export default buildApp;
