import { ComponentListObject, ComponentType, PageListObject, PatternListObject } from '@handoff/transformers/preview/types';
import { ClientConfig, RuntimeConfig } from '@handoff/types/config';
import { ComponentDocumentationOptions, PreviewObject } from '@handoff/types/preview';
import * as fs from 'fs-extra';
import matter from 'gray-matter';
import { Types as CoreTypes } from 'handoff-core';
import { groupBy, startCase, uniq } from 'lodash';
import path from 'path';
import { ParsedUrlQuery } from 'querystring';
import { resolveDocsBackend } from '../../lib/docs-api/backend';
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

// Define what a section link looks like
export interface SectionLink {
  title: string;
  weight: number;
  external?: string | boolean;
  path: string;
  subSections: {
    title: string;
    path: string;
    image: string;
    menu?: {
      title: string;
      path: string;
      image: string;
    }[];
    /**
     * Marks a submenu whose contents are mode-aware registry entities (components/patterns). In
     * registry mode the client nav refreshes these slots at request time from the live docs read
     * API; the build-time `menu` is the workspace/static-export snapshot.
     */
    dynamic?: { kind: 'components' | 'patterns'; type?: string };
  }[];
}
// Documentation Page Properties
export interface DocumentationProps {
  metadata: Metadata;
  content?: string;
  options?: ComponentDocumentationOptions;
  menu: SectionLink[];
  current: SectionLink;
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
 * List the default paths
 */
export const knownPaths = [
  'assets',
  'assets/fonts',
  'assets/icons',
  'assets/logos',
  'foundations',
  'foundations/colors',
  'foundations/icons',  
  'foundations/effects',
  'foundations/logos',
  'foundations/logo',
  'foundations/typography',
  'system',
  'system/component',
  'system/tokens',
  'system/tokens/foundations',
  'system/tokens/foundations/colors',
  'system/tokens/foundations/effects',
  'system/tokens/foundations/typography',
  'system/tokens/components',
  'system/pattern',
];

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
 * Recursively collect all .md files from a directory, returning their
 * path segments relative to the root (without the .md extension).
 */
const collectMarkdownPaths = (rootDir: string, relativeParts: string[] = []): string[][] => {
  if (!fs.existsSync(rootDir)) return [];
  const entries = fs.readdirSync(rootDir);
  const results: string[][] = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry);
    if (fs.lstatSync(fullPath).isDirectory()) {
      results.push(...collectMarkdownPaths(fullPath, [...relativeParts, entry]));
    } else if (entry.endsWith('.md') && entry !== 'index.md') {
      results.push([...relativeParts, entry.replace('.md', '')]);
    }
  }
  return results;
};

/**
 * Build catch-all static paths for all markdown pages at any depth.
 * Excludes paths in knownPaths (those have dedicated route files).
 */
export const buildCatchAllStaticPaths = (includeWorkspacePages = true) => {
  const docRoot = path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', 'config/docs');
  const pageRoot = path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages');

  const docPaths = collectMarkdownPaths(docRoot);
  const pagePaths = includeWorkspacePages ? collectMarkdownPaths(pageRoot) : [];

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

  return allPaths
    .filter((segments) => knownPaths.indexOf(segments.join('/')) < 0)
    .map((segments) => ({ params: { slug: segments } }));
};

/**
 * Recursively build menu entries from .md files in a directory.
 * Returns sub-section items with nested menu items for subdirectories.
 */
const buildMenuFromDirectory = (dirPath: string, urlPrefix: string): any[] => {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath);
  const items: any[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    if (fs.lstatSync(fullPath).isDirectory()) {
      const nestedItems = buildMenuFromDirectory(fullPath, `${urlPrefix}/${entry}`);
      if (nestedItems.length > 0) {
        items.push({
          title: startCase(entry),
          path: `${urlPrefix}/${entry}`,
          menu: nestedItems,
        });
      }
    } else if (entry.endsWith('.md') && entry !== 'index.md') {
      const slug = entry.replace('.md', '');
      const fullSlugPath = `${urlPrefix}/${slug}`.replace(/^\/+/, '');
      if (knownPaths.indexOf(fullSlugPath) >= 0) continue;

      const contents = fs.readFileSync(fullPath, 'utf-8');
      const { data: metadata } = matter(contents);
      if (metadata.enabled === false) continue;

      items.push({
        title: metadata.menuTitle ?? metadata.title ?? startCase(slug),
        path: `/${fullSlugPath}`,
        weight: metadata.weight ?? 0,
      });
    }
  }

  return items.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
};

/**
 * Build the static menu for rendering pages.
 *
 * Component and pattern submenus are sourced from the mode-aware docs read API
 * ({@link fetchComponents}/{@link fetchPatterns}) so navigation always reflects the active
 * `runtime.mode` — registry mode lists the registry's entities, workspace mode lists the local
 * workspace, and never the other way around. Tokens are not yet on the registry read path (out of
 * scope), so the tokens submenu retains its local, build-time behavior.
 *
 * @returns SectionLink[]
 */
export const staticBuildMenu = async (): Promise<SectionLink[]> => {
  const docRoot = path.join(process.env.HANDOFF_MODULE_PATH ?? '', 'config/docs');
  if (!fs.existsSync(docRoot)) {
    return [];
  }
  // Resolve the mode-aware entity lists once so every submenu agrees on the same set for the
  // active runtime mode (the data source the rest of the docs UI already reads from).
  const components = (await fetchComponents()) ?? [];
  const patterns = (await fetchPatterns()) ?? [];
  const files = fs.readdirSync(docRoot);
  let list = files;
  const includeWorkspacePages = !isRegistryRuntime();
  const workingPages = path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages');
  let pages: string[] = [];
  if (includeWorkspacePages && fs.existsSync(workingPages)) {
    pages = fs.readdirSync(workingPages);
    list = list.concat(pages);
  }
  const sections: SectionLink[] = [];
  const custom = uniq(list)
    .map((fileName: string) => {
      let search = '';
      if (pages.includes(fileName)) {
        search = path.resolve(workingPages, fileName);
      } else {
        search = path.resolve(docRoot, fileName);
      }
      if (
        !fs.lstatSync(search).isDirectory() &&
        search !== path.resolve(docRoot, 'index.md') &&
        search !== path.resolve(workingPages, 'index.md') &&
        fileName.endsWith('md')
      ) {
        const contents = fs.readFileSync(search, 'utf-8');
        const { data: metadata } = matter(contents);
        if (metadata.enabled === false) {
          return undefined;
        }

        const filepath = `/${fileName.replace('.md', '')}`;
        let subSections = [];

        if (metadata.menu) {
          subSections = Object.keys(metadata.menu)
            .map((key) => {
              const sub = metadata.menu[key];
              if (sub.components) {
                // Omit `type` entirely when there is no filter: `undefined` is not JSON-serializable
                // and this menu is returned from `getStaticProps`.
                const dynamic =
                  typeof sub.components === 'string'
                    ? { kind: 'components' as const, type: sub.components }
                    : { kind: 'components' as const };
                return {
                  title: sub.title,
                  menu: buildComponentMenu(components, sub.components),
                  dynamic,
                };
              }
              if (sub.tokens) {
                return {
                  title: 'Tokens',
                  menu: staticBuildTokensMenu(),
                };
              }
              if (sub.patterns) {
                const patternMenu = buildPatternMenu(patterns);
                // In registry mode the patterns submenu is filled at request time by the client nav,
                // so keep the (possibly empty) slot and tag it; otherwise preserve the workspace
                // behavior of omitting an empty patterns submenu.
                if (patternMenu.length > 0 || isRegistryRuntime()) {
                  return {
                    title: sub.title || 'Patterns',
                    menu: patternMenu,
                    dynamic: { kind: 'patterns' as const },
                  };
                }
                return undefined;
              }
              if (sub.enabled !== false) {
                return sub;
              }
            })
            .filter(filterOutUndefined);
        } else {
          // Only auto-scan directories when no frontmatter menu is defined
          const dirName = fileName.replace('.md', '');
          const docDir = path.resolve(docRoot, dirName);
          const pagesDir = path.resolve(workingPages, dirName);
          const nestedFromDocs = buildMenuFromDirectory(docDir, `/${dirName}`);
          const nestedFromPages = includeWorkspacePages ? buildMenuFromDirectory(pagesDir, `/${dirName}`) : [];

          const seenPaths = new Set<string>();
          const children: any[] = [];
          for (const item of [...nestedFromPages, ...nestedFromDocs]) {
            if (item.path && !seenPaths.has(item.path)) {
              seenPaths.add(item.path);
              children.push(item);
            }
          }
          // Wrap the scanned children under one labeled group (no `path`) so the side nav renders them
          // as links — a flat subsection carrying a `path` but no `menu` renders nothing. Mirrors the
          // registry-mode `buildPagesMenu` shape so all modes produce identical nesting.
          if (children.length > 0) {
            subSections.push({ title: metadata.menuTitle ?? metadata.title, menu: children });
          }
        }

        let external: string | boolean = false;
        if (
          typeof metadata.external === 'string' &&
          (metadata.external.startsWith('http://') || metadata.external.startsWith('https://') || metadata.external.startsWith('/'))
        ) {
          external = metadata.external;
        }

        return {
          title: metadata.menuTitle ?? metadata.title,
          external,
          weight: metadata.weight ?? 0,
          path: `${filepath}`,
          subSections,
        };
      }
    })
    .filter(filterOutUndefined);
  return sections.concat(custom).sort((a: SectionLink, b: SectionLink) => a.weight - b.weight);
};

const buildBasePath = () => {
  if (!process.env.HANDOFF_APP_BASE_PATH) {
    return '';
  }
  return (process.env.HANDOFF_APP_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '') + '/';
};

/**
 * Build the nested menu items for a section's child pages from the page records. Mirrors the
 * filesystem auto-scan (`buildMenuFromDirectory`) but operates on records since the registry has no
 * markdown to walk: each immediate slug segment under `parentId` becomes a leaf link, or a
 * collapsible group when it has descendants of its own.
 */
const buildChildPageItems = (parentId: string, pages: PageListObject[]): any[] => {
  const prefix = `${parentId}/`;
  const descendants = pages.filter((page) => page.id.startsWith(prefix));
  const segments = uniq(descendants.map((page) => page.id.slice(prefix.length).split('/')[0]));

  return segments
    .map((segment) => {
      const id = `${parentId}/${segment}`;
      const record = pages.find((page) => page.id === id);
      const nested = buildChildPageItems(id, pages);
      const item: any = {
        title: record?.menuTitle ?? record?.title ?? startCase(segment),
        path: record?.path ?? `/${id}`,
        weight: record?.weight ?? 0,
      };
      if (nested.length > 0) {
        item.menu = nested;
      }
      return item;
    })
    .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0) || a.title.localeCompare(b.title));
};

/**
 * Build navigation sections from published page records (registry mode). Mirrors the section shape
 * {@link staticBuildMenu} produces from the filesystem, but sourced from records since the registry
 * has no markdown to scan. Top-level pages (ids without `/`) become sections; a page's `menu`
 * frontmatter declares submenus (including dynamic component/pattern/token slots), otherwise child
 * pages (`<id>/…`) are nested by slug under a single labeled group. Disabled pages are dropped.
 */
export const buildPagesMenu = (
  pages: PageListObject[],
  components: ComponentListObject[],
  patterns: PatternListObject[]
): SectionLink[] => {
  const enabled = (pages ?? []).filter((page) => page.enabled !== false);
  const tops = enabled.filter((page) => !page.id.includes('/'));

  return tops
    .map((top): SectionLink | undefined => {
      let subSections: any[] = [];

      if (top.menu) {
        subSections = Object.keys(top.menu)
          .map((key) => {
            const sub = top.menu[key];
            if (sub.components) {
              const dynamic =
                typeof sub.components === 'string' ? { kind: 'components' as const, type: sub.components } : { kind: 'components' as const };
              return { title: sub.title, menu: buildComponentMenu(components, sub.components), dynamic };
            }
            if (sub.tokens) {
              return { title: 'Tokens', menu: staticBuildTokensMenu() };
            }
            if (sub.patterns) {
              return { title: sub.title || 'Patterns', menu: buildPatternMenu(patterns), dynamic: { kind: 'patterns' as const } };
            }
            if (sub.enabled !== false) {
              return sub;
            }
          })
          .filter(filterOutUndefined);
      } else {
        const children = buildChildPageItems(top.id, enabled);
        // A labeled group (no `path`) so the side nav renders the child links beneath the section.
        subSections = children.length > 0 ? [{ title: top.menuTitle ?? top.title, menu: children }] : [];
      }

      let external: string | boolean = false;
      if (
        typeof top.external === 'string' &&
        (top.external.startsWith('http://') || top.external.startsWith('https://') || top.external.startsWith('/'))
      ) {
        external = top.external;
      }

      return {
        title: top.menuTitle ?? top.title,
        external,
        weight: top.weight ?? 0,
        path: `/${top.id}`,
        subSections,
      };
    })
    .filter(filterOutUndefined);
};

/**
 * Build the component submenu from a mode-resolved component list. The list is supplied by the
 * caller (sourced from the mode-aware docs read API), so this builder is pure and storage-agnostic:
 * in registry mode it groups the registry's components, in workspace mode the local workspace's.
 */
const buildComponentMenu = (components: ComponentListObject[], type?: boolean | string) => {
  const basePath = buildBasePath();
  let menu = [];
  let filtered = components ?? [];
  if (typeof type === 'string' && type !== '') {
    filtered = filtered.filter((component) => component.type == type);
  }
  // Build the submenu of exportables (components)
  const groupedComponents = groupBy(filtered, (e) => e.group ?? '');
  Object.keys(groupedComponents).forEach((group) => {
    const menuGroup = { title: group || 'Uncategorized', menu: [] };
    groupedComponents[group].forEach((component) => {
      const docs = fetchDocPageMetadataAndContent('docs/system/', component.id);
      let title = startCase(component.id);
      if (docs.metadata.title) {
        title = docs.metadata.title;
      }
      if (component.title) {
        title = component.title;
      }
      menuGroup.menu.push({ path: `${basePath}system/component/${component.id}`, title });
    });
    // sort the menu group by name alphabetical
    menuGroup.menu = menuGroup.menu.sort((a, b) => a.title.localeCompare(b.title));
    menu.push(menuGroup);
  });
  // sort the menu by name alphabetical
  menu = menu.sort((a, b) => a.title.localeCompare(b.title));
  return menu;
};

const staticBuildTokensMenu = () => {
  const basePath = buildBasePath();

  const menu = [
    {
      title: `Foundations`,
      path: `${basePath}system/tokens/foundations`,
      menu: [
        {
          title: `Colors`,
          path: `${basePath}system/tokens/foundations/colors`,
        },
        {
          title: `Effects`,
          path: `${basePath}system/tokens/foundations/effects`,
        },
        {
          title: `Typography`,
          path: `${basePath}system/tokens/foundations/typography`,
        },
      ],
    },
  ];

  const componentMenuItems = [];
  // Tokens are not yet on the registry read path (out of scope), so the tokens submenu keeps its
  // current local, build-time behavior regardless of runtime mode.
  const components = fetchLocalComponents({ includeApi: false });
  // Build the submenu of exportables (components)
  const groupedComponents = groupBy(components, (e) => e.group ?? '');
  Object.keys(groupedComponents).forEach((group) => {
    groupedComponents[group].forEach((component) => {
      const docs = fetchDocPageMetadataAndContent('docs/system/', component.id);
      let title = startCase(component.id);
      if (docs.metadata.title) {
        title = docs.metadata.title;
      }
      if (component.name) {
        title = component.name;
      }
      componentMenuItems.push({ path: `${basePath}system/tokens/components/${component.id}`, title });
    });
  });

  if (componentMenuItems.length > 0) {
    menu.push({
      title: `Components`,
      path: `${basePath}system/tokens/components`,
      menu: componentMenuItems,
    });
  }

  return menu;
};

const staticBuildTokenMenu = () => {
    const basePath = buildBasePath();

  let subSections = {
    title: 'Tokens',
    path: `${basePath}system/tokens`,
    menu: [],
  };
  const tokens = getTokens();

  return subSections;
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
 * Build the pattern submenu from a mode-resolved pattern list supplied by the caller. Pure and
 * storage-agnostic: it reflects whichever set the active runtime mode produced.
 */
const buildPatternMenu = (patterns: PatternListObject[]) => {
  const basePath = buildBasePath();

  if (!patterns || patterns.length === 0) return [];

  const grouped = groupBy(patterns, (p) => p.group ?? '');
  let menu: { title: string; menu: { path: string; title: string }[] }[] = [];

  Object.keys(grouped).forEach((group) => {
    const menuGroup = { title: group || 'Uncategorized', menu: [] as { path: string; title: string }[] };
    grouped[group].forEach((pattern) => {
      menuGroup.menu.push({
        path: `${basePath}system/pattern/${pattern.id}`,
        title: pattern.title || startCase(pattern.id),
      });
    });
    menuGroup.menu.sort((a, b) => a.title.localeCompare(b.title));
    menu.push(menuGroup);
  });

  menu.sort((a, b) => a.title.localeCompare(b.title));
  return menu;
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
 * Build a static object for rending markdown pages
 * @param path
 * @param slug
 * @returns
 */
export const fetchDocPageMarkdown = async (path: string, slug: string | undefined, id: string, runtimeConfig?: RuntimeConfig) => {
  const menu = await staticBuildMenu();
  const { metadata, content, options } = fetchDocPageMetadataAndContent(path, slug, runtimeConfig);
  // Return props
  return {
    props: {
      metadata,
      content,
      options,
      menu,
      current: getCurrentSection(menu, `${id}`) ?? null,
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
    path.resolve(
      process.env.HANDOFF_MODULE_PATH ?? '',
      '.handoff',
      process.env.HANDOFF_PROJECT_ID ?? '',
      'client.config.json'
    ),
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
    const connected = bakedMode === 'registry' ? false : cache.config.runtime?.connected ?? false;
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
  return {
    props: {
      ...(await fetchDocPageMarkdown(path, slug, id)).props,
      scss: slug ? fetchTokensString(pluralizeComponent(slug), 'scss') : '',
      css: slug ? fetchTokensString(pluralizeComponent(slug), 'css') : '',
      styleDictionary: slug ? fetchTokensString(pluralizeComponent(slug), 'styleDictionary') : '',
      types: slug ? fetchTokensString(pluralizeComponent(slug), 'types') : '',
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
