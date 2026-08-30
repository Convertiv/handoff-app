import { ComponentListObject, ComponentType, PatternListObject } from '@handoff/transformers/preview/types';
import { ClientConfig, RuntimeConfig } from '@handoff/types/config';
import { ComponentDocumentationOptions, PreviewObject } from '@handoff/types/preview';
import * as fs from 'fs-extra';
import matter from 'gray-matter';
import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import { ParsedUrlQuery } from 'querystring';
import { KNOWN_PATHS } from '@handoff/utils/menu-shell';
import { collectPageSlugSegments } from '@handoff/utils/pages';
import { getRegistryNavData, getWorkspaceNavData, type NavData, type NavTokenSet, type SectionLink } from '@handoff/nav';
import { resolveDocsBackend } from '../../lib/docs-api/backend';
import { tokenFormatStrings } from '../../lib/docs-api/token-detail';
// Build-time-baked navigation shell. Imported statically (same as `pages/api/docs/nav.json.ts`) so
// it is bundled into the route chunk and readable at request time in the Vercel registry lambda,
// where the markdown it is derived from is not traceable. See src/utils/menu-shell.ts.
import navShell from '@/generated/nav-shell.json';
// Get the parsed url string type
export interface IParams extends ParsedUrlQuery {
  slug: string | string[];
}

// Type for the metadata from frontmatter
export interface Metadata {
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
}

export type { SectionLink } from '@handoff/nav';
// Documentation Page Properties
export interface DocumentationProps {
  metadata: Metadata;
  content?: string;
  options?: ComponentDocumentationOptions;
  menu: SectionLink[];
  current: SectionLink;
  navData: NavData;
  currentSectionId: string;
  config: ClientConfig;
}

export interface DocumentationWithTokensProps extends DocumentationProps {
  css: string;
  scss: string;
  styleDictionary: string;
  types: string;
}

export interface FontDocumentationProps extends DocumentationProps {
  customFonts: string[];
  design: CoreTypes.IDocumentationObject['localStyles'];
}

export interface AssetDocumentationProps extends DocumentationProps {
  assets: CoreTypes.IDocumentationObject['assets'];
}

export interface ComponentDocumentationProps extends DocumentationWithTokensProps {
  id: string;
  component: CoreTypes.IFileComponentObject;
  // definitions: DocumentComponentDefinitions;
  previews: PreviewObject[];
  componentOptions: CoreTypes.IHandoffConfigurationComponentOptions;
}

export interface FoundationDocumentationProps extends DocumentationWithTokensProps {
  design: CoreTypes.IDocumentationObject['localStyles'];
}
/**
 * Default paths that have dedicated route files (excluded from auto-scanned submenus). Single source
 * of truth lives in `@handoff/utils/menu-shell` (shared with the build-time shell builder).
 */
export const knownPaths = KNOWN_PATHS;

/**
 * Get the plural name of a component
 * @param singular
 * @returns
 */
export const pluralizeComponent = (singular: string): string => {
  return (
    {
      button: 'buttons',
      select: 'selects',
      checkbox: 'checkboxes',
      radio: 'radios',
      input: 'inputs',
      tooltip: 'tooltips',
      alert: 'alerts',
      switch: 'switches',
      pagination: 'pagination',
      modal: 'modal',
    }[singular] ?? singular
  );
};

/**
 * Build catch-all static paths for all markdown pages at any depth.
 * Excludes paths in knownPaths (those have dedicated route files).
 */
export const buildCatchAllStaticPaths = (includeWorkspacePages = true) => {
  const docRoot = path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', 'config/docs');
  const pageRoot = path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages');

  const docPaths = collectPageSlugSegments(docRoot);
  const pagePaths = includeWorkspacePages ? collectPageSlugSegments(pageRoot) : [];

  const seen = new Set<string>();
  const allPaths: string[][] = [];

  // Pages override docs (working copy wins)
  for (const segments of [...pagePaths, ...docPaths]) {
    const key = segments.join('/');
    if (!seen.has(key)) {
      seen.add(key);
      allPaths.push(segments);
    }
  }

  return allPaths.filter((segments) => knownPaths.indexOf(segments.join('/')) < 0).map((segments) => ({ params: { slug: segments } }));
};

/**
 * Fetch patterns from the mode-aware docs read API.
 *
 * Resolves through {@link resolveDocsBackend}, so the active `runtime.mode` decides the source:
 * generated workspace artifacts in workspace mode, the registry database in registry mode.
 */
export const fetchPatterns = async (): Promise<PatternListObject[]> => {
  try {
    const backend = await resolveDocsBackend();
    return (await backend.listPatterns()) ?? [];
  } catch {
    return [];
  }
};

/**
 * Filter the menus by the current path
 * @param menu
 * @param path
 * @returns SectionLink | null
 */
export const getCurrentSection = (menu: SectionLink[], path: string): SectionLink | null =>
  menu.filter((section) => section.path === path)[0];

/**
 * Resolve the render-ready first-paint navigation for every page. Registry initial delivery is
 * deliberately shell-only; workspace delivery fills the same canonical tree from local records.
 * The legacy `menu`/`current` aliases remain page-layout props while all navigation consumers read
 * `navData` through `NavProvider`.
 */
export const getNavProps = async (
  currentSectionId: string
): Promise<{ navData: NavData; currentSectionId: string; menu: SectionLink[]; current: SectionLink | null }> => {
  let navData: NavData;
  if (isRegistryRuntime()) {
    navData = await getRegistryNavData({
      shell: navShell as unknown as SectionLink[],
      load: 'initial',
      basePath: process.env.HANDOFF_APP_BASE_PATH,
      fetchRecords: async () => ({ components: [], patterns: [], pages: [], tokenSets: [] }),
    });
  } else {
    const backend = await resolveDocsBackend();
    navData = await getWorkspaceNavData({
      docRoot: path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', 'config/docs'),
      workingPagesDir: path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages'),
      basePath: process.env.HANDOFF_APP_BASE_PATH,
      load: 'initial',
      loaders: {
        components: () => backend.listComponents(),
        patterns: () => backend.listPatterns(),
        pages: () => backend.listPages(),
        tokenSets: async () => (await backend.listTokenSets()) as NavTokenSet[],
      },
    });
  }
  return {
    navData,
    currentSectionId,
    menu: navData.shell,
    current: getCurrentSection(navData.shell, currentSectionId) ?? null,
  };
};

/**
 * Build a static object for rending markdown pages
 * @param path
 * @param slug
 * @returns
 */
export const fetchDocPageMarkdown = async (path: string, slug: string | undefined, id: string, runtimeConfig?: RuntimeConfig) => {
  const nav = await getNavProps(id);
  const { metadata, content, options } = fetchDocPageMetadataAndContent(path, slug, runtimeConfig);
  // Return props
  return {
    props: {
      metadata,
      content,
      options,
      menu: nav.menu,
      current: nav.current,
      navData: nav.navData,
      currentSectionId: nav.currentSectionId,
    },
  };
};

/**
 * Fetch Component Doc Page Markdown
 * @param path
 * @param slug
 * @param id
 * @returns
 */
export const fetchCompDocPageMarkdown = async (path: string, slug: string | undefined, id: string, runtimeConfig?: RuntimeConfig) => {
  return {
    props: {
      ...(await fetchDocPageMarkdown(path, slug, id, runtimeConfig)).props,
      scss: slug ? fetchTokensString(slug, 'scss') : '',
      css: slug ? fetchTokensString(slug, 'css') : '',
      styleDictionary: slug ? fetchTokensString(slug, 'styleDictionary') : '',
      types: slug ? fetchTokensString(slug, 'types') : '',
    },
  };
};

/**
 * Fetch components from the mode-aware docs read API.
 *
 * Resolves through {@link resolveDocsBackend}, so the active `runtime.mode` decides the source:
 * generated workspace artifacts in workspace mode, the registry database in registry mode. This is
 * the entity list the navigation, detail, and preview views all share, so they agree on the same
 * set for the active mode.
 */
export const fetchComponents = async (): Promise<ComponentListObject[]> => {
  try {
    const backend = await resolveDocsBackend();
    return (await backend.listComponents()) ?? [];
  } catch {
    return [];
  }
};

/** A component token set resolved for a docs page: the token object + the four download strings. */
export interface ComponentTokensResult {
  component: CoreTypes.IFileComponentObject;
  css: string;
  scss: string;
  styleDictionary: string;
  types: string;
}

/**
 * Fetch a component's token set through the mode-aware docs read API. Resolves through
 * {@link resolveDocsBackend}, so registry mode reads the DB-backed `component/<id>` set (mutable,
 * publishable after deploy) while workspace mode reads the generated files. Returns `null` when the
 * set does not exist.
 */
export const fetchComponentTokens = async (componentId: string): Promise<ComponentTokensResult | null> => {
  try {
    const backend = await resolveDocsBackend();
    const detail = await backend.getTokenSetDetail(`component/${componentId}`);
    if (!detail) {
      return null;
    }
    return { component: detail.record as CoreTypes.IFileComponentObject, ...tokenFormatStrings(detail.artifacts) };
  } catch {
    return null;
  }
};

type FetchLocalComponentsOptions = {
  includeTokens?: boolean;
  includeApi?: boolean;
};

/**
 * Fetch components from the local, build-time workspace artifacts (`tokens.json` and the generated
 * `components.json`). This is the legacy, mode-independent local read used **only** by the tokens
 * views, which are not yet covered by the registry read path (out of scope); it intentionally stays
 * local so token behavior is preserved exactly until tokens are migrated.
 *
 * @param options - Configuration object to specify which component sources to include
 * @param options.includeTokens - Include components from tokens.json (default: true)
 * @param options.includeApi - Include components from components.json API (default: true)
 * @returns Array of component objects with id, type, group, name, and description
 */
export const fetchLocalComponents = (options?: FetchLocalComponentsOptions) => {
  const includeTokens = options?.includeTokens ?? true;
  const includeApi = options?.includeApi ?? true;

  let components: Record<
    string,
    Omit<CoreTypes.IFileComponentObject, 'instances'> & { type?: ComponentType; group?: string; description?: string; name?: string }
  > = {};

  // Include components from tokens.json if requested
  if (includeTokens) {
    const tokens = getTokens();
    components = tokens?.components ?? {};
  }

  // Include components from components.json API if requested
  if (includeApi) {
    const componentsFileExists = fs.existsSync(
      path.resolve(
        process.env.HANDOFF_MODULE_PATH ?? '',
        '.handoff',
        `${process.env.HANDOFF_PROJECT_ID}`,
        'public',
        'api',
        'components.json'
      )
    );

    if (componentsFileExists) {
      const componentList = JSON.parse(
        fs.readFileSync(
          path.resolve(
            process.env.HANDOFF_MODULE_PATH ?? '',
            '.handoff',
            `${process.env.HANDOFF_PROJECT_ID}`,
            'public',
            'api',
            'components.json'
          ),
          'utf-8'
        )
      ) as ComponentListObject[];

      componentList.forEach((component) => {
        components[component.id] = {
          type: (component.type as ComponentType) || ComponentType.Element,
          group: component.group || '',
          description: component.description || '',
          name: component.title || '',
        };
      });
    }
  }

  const items =
    Object.entries(components).map(([id, obj]) => ({
      id,
      type: obj.type || 'Components',
      group: obj.group || '',
      name: obj.name || '',
      description: obj.description || '',
    })) ?? [];

  try {
    return items;
  } catch (e) {
    return null;
  }
};

type ClientConfigCache = { config: ClientConfig };

let cachedClientConfig: ClientConfigCache | null = null;

const getDefaultClientConfig = (): ClientConfigCache => {
  return {
    config: { runtime: { mode: 'workspace', connected: false } } as ClientConfig,
  };
};

/**
 * Resolve the persisted client config path. Workspace dev/static reads it from the build-machine
 * `.handoff/<projectId>` staging dir; the packaged registry app reads it from the entry
 * dir the build copies it into (the standalone server's cwd), since the build-machine path does not
 * exist on the deploy host.
 */
const resolveClientConfigPath = (): string | null => {
  const candidates = [
    path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', '.handoff', process.env.HANDOFF_PROJECT_ID ?? '', 'client.config.json'),
    path.resolve(process.cwd(), 'client.config.json'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
};

/**
 * Apply the build-time-baked runtime mode over a loaded client config. Mode is
 * config-only and baked into the bundle, so the packaged registry app reports `registry` even when
 * its client.config.json cannot be resolved on the deploy host.
 */
const applyRuntimeModeOverride = (cache: ClientConfigCache): ClientConfigCache => {
  const bakedMode = process.env.HANDOFF_RUNTIME_MODE?.trim();
  if (bakedMode === 'workspace' || bakedMode === 'registry') {
    // A baked registry mode is never a connected workspace, so clear `connected` to keep the
    // projected state internally consistent regardless of the source project's config.
    const connected = bakedMode === 'registry' ? false : (cache.config.runtime?.connected ?? false);
    return { config: { ...cache.config, runtime: { ...cache.config.runtime, mode: bakedMode, connected } } };
  }
  return cache;
};

const loadClientConfig = (): ClientConfigCache => {
  if (cachedClientConfig) {
    return cachedClientConfig;
  }

  const clientConfigPath = resolveClientConfigPath();
  if (!clientConfigPath) {
    // No persisted config: still honor a baked runtime mode so the packaged app reports correctly.
    return applyRuntimeModeOverride(getDefaultClientConfig());
  }

  try {
    const cacheContent = fs.readFileSync(clientConfigPath, 'utf-8');
    cachedClientConfig = applyRuntimeModeOverride(JSON.parse(cacheContent) as ClientConfigCache);
    return cachedClientConfig;
  } catch (e) {
    // Return empty default on error instead of throwing
    return applyRuntimeModeOverride(getDefaultClientConfig());
  }
};

/**
 * Fetch Component Doc Page Markdown
 * @param path
 * @param slug
 * @param id
 * @returns
 */
export const fetchFoundationDocPageMarkdown = async (path: string, slug: string | undefined, id: string) => {
  // In a registry build the download strings must not be frozen from the build machine's generated
  // files; they hydrate at request time from the DB-backed docs read API (`useFoundationTokens`).
  const readTokens = !isRegistryRuntime() && slug;
  return {
    props: {
      ...(await fetchDocPageMarkdown(path, slug, id)).props,
      scss: readTokens ? fetchTokensString(pluralizeComponent(slug), 'scss') : '',
      css: readTokens ? fetchTokensString(pluralizeComponent(slug), 'css') : '',
      styleDictionary: readTokens ? fetchTokensString(pluralizeComponent(slug), 'styleDictionary') : '',
      types: readTokens ? fetchTokensString(pluralizeComponent(slug), 'types') : '',
    },
  };
};

export const getClientRuntimeConfig = (): ClientConfig => {
  const clientConfig = loadClientConfig();
  return clientConfig.config;
};

/**
 * Whether the docs app is running in registry mode. Drives the request-time behaviors (on-demand
 * detail rendering and the live nav fetch) that must not affect the workspace dev or static-export
 * builds. Resolves from the same baked/persisted runtime mode the docs read API uses.
 */
export const isRegistryRuntime = (): boolean => getClientRuntimeConfig().runtime?.mode === 'registry';

/**
 * Build-time foundation `localStyles` for a foundation page's `getStaticProps`. In workspace/static
 * this is the local `tokens.json` snapshot (correct: static exports are immutable). In a **registry**
 * build it is empty — foundation token data must not be frozen into build-time page props from the
 * build machine's `tokens.json`; the page hydrates it at request time from the DB-backed docs read
 * API (`useFoundationTokens`). Without this gate a registry build bakes the builder's local tokens,
 * so foundations would appear before anything is published.
 */
export const buildTimeFoundationDesign = (): CoreTypes.IDocumentationObject['localStyles'] =>
  isRegistryRuntime()
    ? ({ color: [], typography: [], effect: [] } as CoreTypes.IDocumentationObject['localStyles'])
    : getTokens().localStyles;

/**
 * Build-time asset collections for an asset page's `getStaticProps`. Workspace/static bakes the local
 * `tokens.json` assets (correct: static exports are immutable snapshots). A **registry** build returns
 * empty: asset bodies must not be frozen into build-time page props from the build machine; the page
 * hydrates them at request time from the DB-backed docs read API (`useCollectionAssets`). Without this
 * gate a registry build bakes the builder's local assets, so they would appear before any publish.
 */
export const buildTimeAssets = (): CoreTypes.IDocumentationObject['assets'] => (isRegistryRuntime() ? {} : getTokens().assets);

export const getTokens = (): CoreTypes.IDocumentationObject => {
  const exportedFilePath = process.env.HANDOFF_EXPORT_PATH
    ? path.resolve(process.env.HANDOFF_EXPORT_PATH, 'tokens.json')
    : path.resolve(process.cwd(), process.env.HANDOFF_OUTPUT_DIR ?? 'exported', 'tokens.json');

  if (!fs.existsSync(exportedFilePath)) {
    // Return proper default structure to prevent Next.js serialization errors
    // and ensure components can safely access design properties
    return {
      localStyles: {
        color: [],
        typography: [],
        effect: [],
      },
      components: {},
      assets: {},
    } as CoreTypes.IDocumentationObject;
  }

  const data = fs.readFileSync(exportedFilePath, 'utf-8');
  return JSON.parse(data.toString()) as CoreTypes.IDocumentationObject;
};

/**
 * Reduce a slug which can be either an array or string, to just a string by
 * plucking the first element
 * @param slug
 * @returns
 */
export const reduceSlugToString = (slug: string | string[] | undefined): string | undefined => {
  let prop: string | undefined;
  if (Array.isArray(slug)) {
    if (slug[0]) {
      prop = slug[0];
    }
  } else {
    prop = slug;
  }
  return prop;
};

/**
 * Get doc meta and content from markdown
 * @param path
 * @param slug
 * @returns
 */
export const fetchDocPageMetadataAndContent = (localPath: string, slug: string | string[] | undefined, runtimeConfig?: RuntimeConfig) => {
  const pagePath = localPath.replace('docs/', 'pages/');
  const handoffModulePath = process.env.HANDOFF_MODULE_PATH ?? '';
  const handoffWorkingPath = process.env.HANDOFF_WORKING_PATH ?? '';

  let currentContents = '';
  let options = {} as ComponentDocumentationOptions;

  const contentModuleFilePath = path.resolve(handoffModulePath, 'config', `${localPath}${slug}.md`);
  const contentWorkingFilePath = path.resolve(handoffWorkingPath, `${pagePath}${slug}.md`);

  // Registry serves package `config/docs` only; workspace overrides are invisible to it (custom
  // content comes from the DB), so the working-path read is skipped in registry mode.
  if (!isRegistryRuntime() && fs.existsSync(contentWorkingFilePath)) {
    currentContents = fs.readFileSync(contentWorkingFilePath, 'utf-8');
  } else if (!fs.existsSync(contentModuleFilePath)) {
    return { metadata: {}, content: currentContents, options: {} };
  } else {
    currentContents = fs.readFileSync(contentModuleFilePath, 'utf-8');
  }

  const { data: metadata, content } = matter(currentContents);

  if (typeof slug === 'string' && runtimeConfig?.entries?.templates) {
    const viewConfigFilePath = path.resolve(runtimeConfig.entries.templates, slug, 'view.config.json');
    if (fs.existsSync(viewConfigFilePath)) {
      options = JSON.parse(fs.readFileSync(viewConfigFilePath, 'utf-8').toString()) as ComponentDocumentationOptions;
    }
  }

  return { metadata, content, options };
};

/**
 * Filter out undefined elements
 * @param value
 * @returns
 */
export const filterOutUndefined = <T>(value: T): value is NonNullable<T> => value !== undefined;

/**
 * Create a title string from a prefix
 * @param prefix
 * @returns
 */
export const titleString = (prefix: string | null): string => {
  const config = getClientRuntimeConfig();
  const prepend = prefix ? `${prefix} | ` : '';
  return `${prepend}${config?.app?.client} Design System`;
};

/**
 * Get the tokens for a component
 * @param component
 * @param type
 * @returns
 */
export const fetchTokensString = (component: string, type: 'css' | 'scss' | 'styleDictionary' | 'types'): string => {
  let tokens = '';
  const baseSearchPath = process.env.HANDOFF_EXPORT_PATH
    ? path.resolve(process.env.HANDOFF_EXPORT_PATH, 'tokens')
    : path.resolve(process.cwd(), process.env.HANDOFF_OUTPUT_DIR ?? 'exported', 'tokens');
  const scssSearchPath = path.resolve(baseSearchPath, 'sass', `${component}.scss`);
  const typeSearchPath = path.resolve(baseSearchPath, 'types', `${component}.scss`);
  const sdSearchPath = path.resolve(baseSearchPath, 'sd', 'tokens', `${component}.tokens.json`);
  const sdAltSearchPath = path.resolve(baseSearchPath, 'sd', 'tokens', component, `${component}.tokens.json`);
  const cssSearchPath = path.resolve(baseSearchPath, 'css', `${component}.css`);
  if (type === 'scss' && fs.existsSync(scssSearchPath)) {
    tokens = fs.readFileSync(scssSearchPath).toString();
  } else if (type === 'types' && fs.existsSync(typeSearchPath)) {
    tokens = fs.readFileSync(typeSearchPath).toString();
  } else if (type === 'styleDictionary') {
    if (fs.existsSync(sdSearchPath)) {
      // Foundations
      tokens = fs.readFileSync(sdSearchPath).toString();
    } else if (fs.existsSync(sdAltSearchPath)) {
      // Components
      tokens = fs.readFileSync(sdAltSearchPath).toString();
    }
  } else if (fs.existsSync(cssSearchPath)) {
    tokens = fs.readFileSync(cssSearchPath).toString();
  }
  return tokens;
};
