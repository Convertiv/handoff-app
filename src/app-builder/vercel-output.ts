import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { HOME_PAGE_PATH } from '../registry/content-kinds';
import { Logger } from '../utils/logger';

/**
 * Vercel Build Output API layout.
 *
 * `--package vercel` emits the Vercel Build Output API directory (`.vercel/output`) instead of the
 * sites-directory deliverable. This module is the single seam that produces that layout; it is
 * invoked as the final-assembly branch from the build functions and never re-stages or re-runs Next.
 *
 * Hard constraint: `.vercel/output` must live at the **repo root** (`handoff.workingPath`) with that
 * exact name. Vercel ignores any `sitesOutputDirectory`-style override for this packaging.
 */

/** Build Output API config version emitted in `.vercel/output/config.json`. */
const BUILD_OUTPUT_API_VERSION = 3;

/** Absolute path of the `.vercel/output` directory at the repo root. */
export const getVercelOutputPath = (handoff: Handoff): string => path.resolve(handoff.workingPath, '.vercel', 'output');

/**
 * Resolve the app base path exactly as `next.config.mjs`'s `resolveBasePath` does, so the emitted
 * `config.json` reflects the same `basePath` the static export was built with. Empty string means no
 * base path (the Build Output API omits the field rather than carrying an empty value).
 */
const resolveBasePath = (rawBasePath: string | undefined): string => {
  if (!rawBasePath) {
    return '';
  }
  const trimmed = rawBasePath.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
};

/**
 * Lay a materialized static export under `.vercel/output/static/` and write a minimal Build Output
 * API v3 `config.json` carrying the app's `trailingSlash` and resolved `basePath`. Pure CDN files —
 * no functions, no database.
 *
 * @param exportDir Absolute path of the materialized static export (the same content the static
 *   target writes to `out/<projectId>`).
 */
export const writeStaticVercelOutput = async (handoff: Handoff, exportDir: string): Promise<void> => {
  const outputPath = getVercelOutputPath(handoff);
  await fs.remove(outputPath);
  await fs.ensureDir(outputPath);

  // Lay the export under static/ — pure CDN files, served directly by Vercel.
  const staticDir = path.join(outputPath, 'static');
  await fs.copy(exportDir, staticDir, { overwrite: true });

  // The staged Next app sets `trailingSlash: true` (src/app/next.config.mjs); the registry/static
  // exports inherit it. Carry it and the resolved base path so the static deploy serves correct URLs.
  const basePath = resolveBasePath(handoff.config?.app?.base_path);
  const config: { version: number; trailingSlash: boolean; basePath?: string } = {
    version: BUILD_OUTPUT_API_VERSION,
    trailingSlash: true,
  };
  if (basePath) {
    config.basePath = basePath;
  }
  await fs.writeFile(path.join(outputPath, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);

  Logger.success(`Packaged static Vercel Build Output API artifact at ${outputPath} (static/ + config.json).`);
};

/**
 * Node.js runtime identifier baked into the registry function's `.vc-config.json`. The `pg` driver
 * (and the Neon serverless driver in its Node fallback) need the Node.js runtime, not the edge
 * runtime — this is the required baseline. Vercel resolves the patch
 * version within this major; pinning the major keeps the artifact stable.
 */
const VERCEL_NODE_RUNTIME = 'nodejs20.x';

/** Name (sans `.func`) of the single registry function. Served at `/` and the catch-all route. */
const REGISTRY_FUNCTION_NAME = 'index';

/** Handler file the Node launcher executes; wraps the Next standalone server as a request listener. */
const REGISTRY_FUNCTION_HANDLER = 'index.js';

/** Catch-all docs pages may be overridden by registry records and must always reach the function. */
const MUTABLE_REGISTRY_PAGE_SRC_ROUTE = '/[...slug]';

/**
 * Node launcher emitted into the registry function directory. The Next `standalone` `server.js`
 * binds a port via `startServer`, which is not the Vercel Node function contract (a module exporting
 * a `(req, res)` request listener). This launcher reuses the exact same request pipeline that
 * `startServer` boots — the router-server handler from `next/dist/server/lib/start-server` — but
 * without the port bind, so it serves requests identically to `node server.js`.
 *
 * Why not the public `next().getRequestHandler()`: that handler resolves page/document and `/api`
 * routes, but does NOT resolve on-demand `/_next/data/<buildId>/…json` requests for
 * `fallback:'blocking'` pages — it 404s them. That broke client-side `<Link>` navigation to the
 * component/pattern detail pages (their data fetch went to the function and came back 404, which the
 * Next router then turns into a hard navigation). `getRequestHandlers` returns the full router-server
 * handler (data-route resolution, dynamic param extraction, `trailingSlash` redirects), so on-demand
 * data routes resolve the same way they do under the standalone server. `minimalMode:false` keeps
 * the function doing full in-process routing (the catch-all route forwards everything here).
 *
 * Runtime mode, driver, and the DB env-var *name* are already baked into the resolved config the
 * standalone build wrote to `.next/required-server-files.json`; the connection-string value is still
 * read from the named env var at request time, never baked.
 */
const REGISTRY_FUNCTION_LAUNCHER = `// Generated by handoff-app (\`build --target registry --package vercel\`). Do not edit.
// Wraps the Next.js standalone server as a Vercel Build Output API Node function.
process.env.NODE_ENV = 'production';
process.chdir(__dirname);

const requiredServerFiles = require('./.next/required-server-files.json');
const nextConfig = requiredServerFiles.config;

// The standalone runtime reads its resolved config from this env var (mirrors standalone server.js).
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

// require('next') first so its module hooks are installed before pulling the internal server lib,
// matching the require order of the generated standalone server.js.
require('next');
const { getRequestHandlers } = require('next/dist/server/lib/start-server');

// Initialize the router-server handler once on cold start and reuse it across warm invocations.
// This is the same handler the standalone server.js uses; it does NOT bind a port (the port bind
// lives in startServer, which we never call), so it fits the (req, res) Node function contract.
let handlersPromise;
const ready = () =>
  (handlersPromise =
    handlersPromise ||
    getRequestHandlers({
      dir: __dirname,
      port: parseInt(process.env.PORT, 10) || 3000,
      hostname: process.env.HOSTNAME || 'localhost',
      isDev: false,
      minimalMode: false,
    }));

module.exports = async (req, res) => {
  const { requestHandler } = await ready();
  return requestHandler(req, res);
};
`;

/** Build Output API Node serverless-function config (`.vc-config.json`). */
interface VercelNodeFunctionConfig {
  runtime: string;
  handler: string;
  launcherType: 'Nodejs';
}

/**
 * Options for {@link writeRegistryVercelOutput}. The build module owns the standalone assembly (entry
 * flattening + static/public/config layout) and passes it in, keeping this seam free of any
 * standalone-layout knowledge and avoiding a circular import.
 */
export interface RegistryVercelOutputOptions {
  /** Absolute path of the staged Next app (source of `.next/static` + `public`). */
  appPath: string;
  /** Absolute path of the Next `standalone` build root (`<appPath>/.next/standalone`). */
  standaloneRoot: string;
  /**
   * Lay the standalone bundle out under the given entry dir (flatten the server entry, copy static
   * assets, public tree, and runtime config beside it) and return the absolute server-entry path.
   * Shared with the standalone deliverable so both layouts stay identical.
   */
  assembleStandalone: (handoff: Handoff, appPath: string, standaloneRoot: string, entryDir: string) => Promise<string>;
}

/**
 * Copy the genuinely-static prerendered pages into the Edge CDN layer (`static/`) so their HTML and
 * `_next/data` JSON are served directly by the CDN instead of invoking the single registry function.
 * This is a load/latency optimization, not a correctness requirement: the function (see the launcher)
 * now resolves on-demand data routes itself, so anything not copied here still resolves via the
 * catch-all.
 *
 * Routes materialized from the mutable docs catch-all also appear in `routes` when package defaults
 * are prerendered. They are identified by `srcRoute` and deliberately left behind the function so a
 * published DB record can override the fallback. The root page is also mutable and stays behind the
 * function. Other `fallback:'blocking'` dynamic routes are absent and naturally reach the function.
 *
 * No-op when nothing is prerendered (empty `routes`). Paths are emitted base-path-less, matching the
 * existing `_next/static` copy and the registry route table.
 */
const copyPrerenderedStaticPages = async (appPath: string, staticOutDir: string): Promise<void> => {
  const nextDir = path.resolve(appPath, '.next');
  const manifestPath = path.join(nextDir, 'prerender-manifest.json');
  const buildIdPath = path.join(nextDir, 'BUILD_ID');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(buildIdPath)) {
    return;
  }

  const manifest = (await fs.readJson(manifestPath)) as {
    routes?: Record<string, { dataRoute?: string | null; srcRoute?: string | null }>;
  };
  const routes = manifest.routes ?? {};
  const serverPages = path.join(nextDir, 'server', 'pages');

  let copied = 0;
  for (const [route, routeConfig] of Object.entries(routes)) {
    // A static copy would win at the Build Output API filesystem route and permanently hide a
    // published override (and its on-demand revalidation) from the registry function.
    if (route === HOME_PAGE_PATH || routeConfig.srcRoute === MUTABLE_REGISTRY_PAGE_SRC_ROUTE) {
      continue;
    }

    // `.next/server/pages/<rel>.{html,json}` — `/` maps to `index`, nested routes keep their path.
    const rel = route === '/' ? 'index' : route.replace(/^\/+/, '');
    const htmlSrc = path.join(serverPages, `${rel}.html`);
    const jsonSrc = path.join(serverPages, `${rel}.json`);

    if (fs.existsSync(htmlSrc)) {
      // trailingSlash:true → serve as `<route>/index.html`; `/` → `static/index.html`.
      const htmlDestDir = route === '/' ? staticOutDir : path.join(staticOutDir, rel);
      await fs.ensureDir(htmlDestDir);
      await fs.copy(htmlSrc, path.join(htmlDestDir, 'index.html'), { overwrite: true });
    }

    // The data URL (with the build's BUILD_ID baked in) comes from the manifest's `dataRoute`.
    const dataRoute = routeConfig.dataRoute;
    if (dataRoute && fs.existsSync(jsonSrc)) {
      const jsonDest = path.join(staticOutDir, dataRoute.replace(/^\/+/, ''));
      await fs.ensureDir(path.dirname(jsonDest));
      await fs.copy(jsonSrc, jsonDest, { overwrite: true });
      copied += 1;
    }
  }

  Logger.info(`Copied ${copied} prerendered static page data file(s) into the Edge CDN layer.`);
};

/**
 * Package the dynamic registry app as the Vercel Build Output API directory. Lays the traced
 * standalone bundle into a single Node function (`functions/index.func/`)
 * wrapping the Next standalone server, copies the immutable static assets + public tree under
 * `static/` for the Edge CDN, and writes a route table that serves static files first and routes
 * everything else (SSR pages, the docs read API, the registry API) to the function.
 *
 * Hard constraint: `.vercel/output` lives at the repo root with that exact name (see module header).
 */
export const writeRegistryVercelOutput = async (handoff: Handoff, options: RegistryVercelOutputOptions): Promise<void> => {
  const { appPath, standaloneRoot, assembleStandalone } = options;

  const outputPath = getVercelOutputPath(handoff);
  await fs.remove(outputPath);
  await fs.ensureDir(outputPath);

  // The function directory *is* the standalone bundle root: the traced server + node_modules, the
  // server entry flattened to its root, and `.next/static` + public + runtime config beside it. The
  // launcher constructs a NextServer from this directory, so it needs the full standalone layout.
  const functionDir = path.join(outputPath, 'functions', `${REGISTRY_FUNCTION_NAME}.func`);
  await fs.ensureDir(functionDir);
  await assembleStandalone(handoff, appPath, standaloneRoot, functionDir);

  // The standalone `server.js` binds a port; replace the entry with the Build Output API Node
  // launcher (a `(req, res)` request listener) and declare the Node runtime so the pg/Neon drivers
  // work. `server.js` is left in place (harmless, unused) to keep the bundle a valid standalone too.
  await fs.writeFile(path.join(functionDir, REGISTRY_FUNCTION_HANDLER), REGISTRY_FUNCTION_LAUNCHER);
  const functionConfig: VercelNodeFunctionConfig = {
    runtime: VERCEL_NODE_RUNTIME,
    handler: REGISTRY_FUNCTION_HANDLER,
    launcherType: 'Nodejs',
  };
  await fs.writeFile(path.join(functionDir, '.vc-config.json'), `${JSON.stringify(functionConfig, null, 2)}\n`);

  // Serve the app's immutable assets straight from the Edge CDN. `_next/static` is content-hashed and
  // public files sit at the URL root; copying them under `static/` lets the route table satisfy them
  // via `handle: filesystem` before the catch-all reaches the function.
  const staticOutDir = path.join(outputPath, 'static');
  await fs.ensureDir(staticOutDir);
  const nextStaticSrc = path.resolve(appPath, '.next', 'static');
  if (fs.existsSync(nextStaticSrc)) {
    await fs.copy(nextStaticSrc, path.join(staticOutDir, '_next', 'static'), { overwrite: true });
  }
  const publicSrc = path.resolve(appPath, 'public');
  if (fs.existsSync(publicSrc)) {
    await fs.copy(publicSrc, staticOutDir, { overwrite: true });
  }

  // Serve genuinely-static prerendered pages (HTML + `_next/data` JSON) from the CDN as an
  // optimization so they skip the function. Dynamic `fallback:'blocking'` pages are not copied (their
  // data is live), and the function now resolves their on-demand `_next/data` routes itself.
  await copyPrerenderedStaticPages(appPath, staticOutDir);

  // Route table: try static files first (`handle: filesystem` serves anything copied into static/),
  // then route every remaining request — SSR/on-demand pages, their `/_next/data/*` routes,
  // /api/docs/*, /api/registry/* — to the single function. The `.func` suffix is dropped from the
  // URL, so `index.func` is reached via `/index`.
  const config = {
    version: BUILD_OUTPUT_API_VERSION,
    routes: [{ handle: 'filesystem' }, { src: '/(.*)', dest: `/${REGISTRY_FUNCTION_NAME}` }],
  };
  await fs.writeFile(path.join(outputPath, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);

  Logger.success(
    `Packaged registry Vercel Build Output API artifact at ${outputPath} ` +
      `(functions/${REGISTRY_FUNCTION_NAME}.func + static/ + config.json).`
  );
};
