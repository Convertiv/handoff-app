import spawn from 'cross-spawn';
import esbuild from 'esbuild';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { buildComponents } from '../pipeline/components';
import { buildPatterns } from '../pipeline/patterns';
import processComponents from '../transformers/preview/component/builder';
import { buildMainCss } from '../transformers/preview/component/css';
import { buildMainJS } from '../transformers/preview/component/javascript';
import { resolveDatabaseUrlEnv, resolveRegistryAdapter } from '../registry/db/adapter';
import type { RuntimeMode } from '../types/config';
import { Logger } from '../utils/logger';
import { generateTokensApi, persistClientConfig } from './client-config';
import { getAppPath, syncPublicFiles } from './paths';
import { materializeDocsReadModel, validateReferencedArtifacts } from './static-export';
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
 * Resolved build target (technical design §4). Bare `handoff-app build` resolves to `static`. The
 * target — not `NODE_ENV` — drives whether Next runs a static export, so a future non-static
 * `next build` path (registry, #11) does not get conflated with static export.
 */
export type BuildTarget = 'static' | 'registry';

/** The default build target when none is supplied on the CLI. */
export const DEFAULT_BUILD_TARGET: BuildTarget = 'static';

const escapeForSingleQuotedJsString = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * Guard the static build target against a registry-only runtime configuration. A static export
 * builds and serves the local workspace; a `runtime.mode: 'registry'` project has no local workspace
 * to export, so the build fails clearly rather than producing an empty or misleading site.
 */
const assertStaticBuildAllowed = (handoff: Handoff): void => {
  const mode = handoff.config?.runtime?.mode ?? 'workspace';
  if (mode === 'registry') {
    throw new Error(
      'Cannot run the static build target with a registry-only runtime (runtime.mode: "registry"). ' +
        'The static target builds and exports the local workspace; switch runtime.mode to "workspace" ' +
        'or package the registry app with `handoff-app build --target registry`.'
    );
  }
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
  const escapedRegistryAdapter = escapeForSingleQuotedJsString(resolveRegistryAdapter(handoff.config));
  const escapedDatabaseUrlEnv = escapeForSingleQuotedJsString(resolveDatabaseUrlEnv(handoff.config));
  const placeholderValues: Record<string, string> = {
    '%HANDOFF_PROJECT_ID%': escapedProjectId,
    '%HANDOFF_APP_BASE_PATH%': escapedAppBasePath,
    '%HANDOFF_WORKING_PATH%': escapedWorkingPath,
    '%HANDOFF_MODULE_PATH%': escapedModulePath,
    '%HANDOFF_EXPORT_PATH%': escapedExportPath,
    '%HANDOFF_WEBSOCKET_PORT%': escapedWebsocketPort,
    '%HANDOFF_RUNTIME_MODE%': escapedRuntimeMode,
    '%HANDOFF_REGISTRY_ADAPTER%': escapedRegistryAdapter,
    '%HANDOFF_REGISTRY_DATABASE_URL_ENV%': escapedDatabaseUrlEnv,
  };
  let nextConfigContent = await fs.readFile(nextConfigPath, 'utf-8');
  for (const [placeholder, value] of Object.entries(placeholderValues)) {
    nextConfigContent = nextConfigContent.split(placeholder).join(value);
  }
  await fs.writeFile(targetPath, nextConfigContent);
  return appPath;
};

/**
 * Build the Next.js documentation application for the resolved target. The `static` target builds
 * and exports the local workspace (default); the `registry` target packages the deployable dynamic
 * registry app via {@link buildRegistryApp} (issue #11).
 */
const buildApp = async (handoff: Handoff, target: BuildTarget = DEFAULT_BUILD_TARGET, skipComponents?: boolean): Promise<void> => {
  if (target === 'registry') {
    await buildRegistryApp(handoff);
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
  const buildResult = spawn.sync('npx', ['next', 'build'], {
    cwd: appPath,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HANDOFF_BUILD_TARGET: target,
    },
  });

  Logger.childProcessBuffer(buildResult.stdout);
  Logger.childProcessBuffer(buildResult.stderr);

  if (buildResult.status !== 0) {
    let errorMsg = `Next.js build failed with exit code ${buildResult.status}`;
    if (buildResult.error) {
      errorMsg += `\nSpawn error: ${buildResult.error.message}`;
    }
    throw new Error(errorMsg);
  }

  // Reproduce the docs read API (`/api/docs/*`) as route-shaped static files in the export output,
  // since `output: 'export'` disables the live API routes.
  await materializeDocsReadModel(handoff, path.resolve(appPath, 'out'));

  // Ensure output root directory exists
  const outputRoot = path.resolve(handoff.workingPath, handoff.sitesDirectory);
  await fs.ensureDir(outputRoot);

  // Clean the project output directory (if exists)
  const output = path.resolve(outputRoot, handoff.getProjectId());
  if (fs.existsSync(output)) {
    await fs.remove(output);
  }

  // Copy the build files into the project output directory
  await fs.copy(path.resolve(appPath, 'out'), output);
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
- \`HANDOFF_REGISTRY_API_TOKEN\` — bearer token for registry management mutations (if used).

## Database migrations (run from this artifact)

This bundle ships a self-contained migration runner (\`migrate.cjs\`) and the package-owned
migrations (\`drizzle/\`), so you can migrate the database directly from the deployed artifact —
no \`handoff-app\` CLI or workspace required. Run it once against the target database before (or as
part of) the deploy:

\`\`\`bash
${databaseUrlEnv}="postgres://…" node migrate.cjs
\`\`\`

The runner uses the same database adapter and env-var name the app was built with. It is independent
of starting the server, so run it as a release/one-shot job.

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
 * Bundle the self-contained registry migration runner into the packaged artifact and ship the
 * package-owned migrations beside it (issue #11). The deployed standalone app has no handoff-app CLI
 * or workspace, so `handoff-app db:migrate` cannot run there; instead the operator runs
 * `node migrate.cjs` from the artifact (with the DB connection string supplied via env at deploy
 * time). Mode/adapter and the DB env-var *name* are baked here via esbuild `define`, mirroring the
 * app bundle; the connection-string value is still read from the env var at runtime, never baked.
 *
 * npm deps are left external so the runner resolves the Drizzle client + driver from the standalone's
 * traced `node_modules` (the registry runtime already imports them, so they are present) rather than
 * re-bundling driver internals.
 */
const packageRegistryMigrator = async (handoff: Handoff, entryDir: string): Promise<void> => {
  const entryPoint = path.resolve(handoff.modulePath, 'src', 'registry', 'db', 'migrate-standalone.ts');
  if (!fs.existsSync(entryPoint)) {
    Logger.warn('Registry migration runner source was not found; skipping migrator packaging.');
    return;
  }

  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: path.join(entryDir, 'migrate.cjs'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    packages: 'external',
    define: {
      'process.env.HANDOFF_REGISTRY_ADAPTER': JSON.stringify(resolveRegistryAdapter(handoff.config)),
      'process.env.HANDOFF_REGISTRY_DATABASE_URL_ENV': JSON.stringify(resolveDatabaseUrlEnv(handoff.config)),
    },
    logLevel: 'silent',
  });

  // The runner resolves migrations relative to itself (`./drizzle`); ship the package-owned set.
  const migrationsSrc = path.resolve(handoff.modulePath, 'drizzle');
  if (fs.existsSync(migrationsSrc)) {
    await fs.copy(migrationsSrc, path.join(entryDir, 'drizzle'), { overwrite: true });
  } else {
    Logger.warn(`Packaged registry migrations were not found at "${migrationsSrc}"; the artifact will ship without them.`);
  }
};

/**
 * Package the deployable dynamic registry app (technical design §4, issue #11).
 *
 * Unlike the static target this never builds or bundles workspace component/pattern source and the
 * resulting artifact has no workspace-source runtime dependency — it ships the app/runtime needed to
 * serve the docs read API and registry API from the database and published docs read-model
 * artifacts. Next runs a `standalone` build (no static export); the traced bundle plus the static
 * assets, public files, and resolved runtime config are assembled (flattened) under the sites output
 * directory (`<project>/<sitesOutputDirectory>/registry`, default `out/registry`) as the documented
 * Next.js standalone layout — a self-hosting artifact for containers, custom Node servers, and VPS,
 * started with `node server.js`. (Vercel
 * ignores `output: 'standalone'` and builds via its own adapter, so it is deployed from source, not
 * from this bundle — see the generated README.)
 */
const buildRegistryApp = async (handoff: Handoff): Promise<void> => {
  // The registry build target *defines* a registry deployment, so the packaged artifact always runs
  // in registry mode regardless of the source project's `runtime.mode`. Mode stays config-only at
  // runtime — it is fixed here by the build target, never inferred from the deploy environment — so
  // a workspace project can produce a registry app without flipping its own runtime mode.
  const sourceMode = handoff.config?.runtime?.mode ?? 'workspace';
  if (sourceMode !== 'registry') {
    Logger.info(`Source runtime.mode is "${sourceMode}"; forcing "registry" mode in the packaged registry app.`);
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

  // Build the dynamic app. `output: 'standalone'` (driven by HANDOFF_BUILD_TARGET) traces the runtime
  // and the selected Postgres/Neon driver into a self-contained bundle — never a static export.
  const buildResult = spawn.sync('npx', ['next', 'build'], {
    cwd: appPath,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HANDOFF_BUILD_TARGET: 'registry',
    },
  });

  Logger.childProcessBuffer(buildResult.stdout);
  Logger.childProcessBuffer(buildResult.stderr);

  if (buildResult.status !== 0) {
    let errorMsg = `Registry app build failed with exit code ${buildResult.status}`;
    if (buildResult.error) {
      errorMsg += `\nSpawn error: ${buildResult.error.message}`;
    }
    throw new Error(errorMsg);
  }

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

  const output = getRegistryBuildOutputPath(handoff);
  await fs.remove(output);
  await fs.ensureDir(output);
  await fs.copy(standaloneRoot, output, { overwrite: true });

  // Locate the server entry within the assembled package: deterministically from the tracing-root
  // relative app dir, with a recursive fallback if Next's layout differs.
  const relAppDir = path.relative(handoff.modulePath, appPath);
  let serverDir = path.resolve(output, relAppDir);
  if (!fs.existsSync(path.join(serverDir, 'server.js'))) {
    const located = findStandaloneServerDir(output);
    if (!located) {
      throw new Error(
        `Could not locate the standalone "server.js" in the packaged registry app at "${output}". ` +
          'The Next standalone layout may have changed.'
      );
    }
    serverDir = located;
  }

  // Standalone tracing (rooted at the package) mirrors the staged app's path, so the server entry
  // lands nested under `<output>/<relAppDir>` (e.g. `.handoff/<projectId>/server.js`). The project id
  // is irrelevant to the deployable artifact, so flatten the entry up to the package root — the
  // traced `node_modules` already live there — and drop the now-empty nesting.
  if (path.resolve(serverDir) !== path.resolve(output)) {
    for (const entry of fs.readdirSync(serverDir)) {
      await fs.move(path.join(serverDir, entry), path.join(output, entry), { overwrite: true });
    }
    const [nestingRoot] = path.relative(output, serverDir).split(path.sep);
    if (nestingRoot && nestingRoot !== '..') {
      await fs.remove(path.join(output, nestingRoot));
    }
  }
  const entryDir = output;

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

  // Ship a self-contained migration runner + the package-owned migrations so the deployed artifact
  // can apply migrations without the handoff-app CLI or a workspace (issue #11). The runner is
  // compiled from package source with npm deps left external — it resolves the Drizzle client and the
  // selected Postgres/Neon driver from the standalone's traced `node_modules` at the package root.
  await packageRegistryMigrator(handoff, entryDir);

  const entryRelativePath = path.relative(output, path.join(entryDir, 'server.js')).split(path.sep).join('/');
  await writeRegistryDeploymentReadme(output, entryRelativePath, resolveDatabaseUrlEnv(handoff.config));

  Logger.success(`Packaged registry app at ${output} (start: \`node ${entryRelativePath}\`, migrate: \`node migrate.cjs\`).`);
};

/**
 * Watch the Next.js application.
 * Starts a custom dev server with Handoff-specific watchers and hot-reloading.
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  // Build the shared/global artifacts first so component/pattern preview HTML references them only
  // when present (technical design §7), then process components with caching enabled (which skips
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
