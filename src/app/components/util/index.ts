import { ChangelogRecord } from '@handoff/changelog';
import { ComponentListObject, ComponentType } from '@handoff/transformers/preview/types';
import { ComponentDocumentationOptions, PreviewObject } from '@handoff/types';
import { ClientConfig, IntegrationObject } from '@handoff/types/config';
import { findFilesByExtension } from '@handoff/utils/fs';
import * as fs from 'fs-extra';
import matter from 'gray-matter';
import { Types as CoreTypes } from 'handoff-core';
import { groupBy, merge, startCase, uniq } from 'lodash';
import path from 'path';
import { ParsedUrlQuery } from 'querystring';
import semver from 'semver';
import { SubPageType } from '../../pages/[level1]/[level2]';

// Get the parsed url string type
export interface IParams extends ParsedUrlQuery {
  slug: string;
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

export interface ChangelogDocumentationProps extends DocumentationProps {
  changelog: ChangelogRecord[];
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
  legacyDefinition: CoreTypes.ILegacyComponentDefinition;
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
  'foundations/effects',
  'foundations/logos',
  'foundations/typography',
  'system',
  'system/component',
  'changelog',
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
 * Build level 1 static path parameters
 * @returns
 */
export const buildL1StaticPaths = () => {
  const docRoot = path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', 'config/docs');
  const files = fs.readdirSync(docRoot);
  const pageRoot = path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages');
  let list = files;
  if (fs.existsSync(pageRoot)) {
    const pages = fs.readdirSync(pageRoot);
    list = files.concat(pages);
  }
  const paths = list
    .filter((fileName) => {
      if (fs.existsSync(path.join(docRoot, fileName))) return !fs.lstatSync(path.join(docRoot, fileName)).isDirectory();
      if (fs.existsSync(path.join(pageRoot, fileName))) return !fs.lstatSync(path.join(pageRoot, fileName)).isDirectory();
      return false;
    })
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const path = fileName.replace('.md', '');
      if (knownPaths.indexOf(path) < 0) {
        return {
          params: {
            level1: path,
          },
        };
      }
    })
    .filter(filterOutUndefined);
  return paths;
};

/**
 * Build static paths for level 2
 * @returns SubPathType[]
 */
export const buildL2StaticPaths = () => {
  const docRoot = path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', 'config/docs');
  const files = fs.readdirSync(docRoot);
  const pageRoot = path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages');
  let list = files;
  if (fs.existsSync(pageRoot)) {
    const pages = fs.readdirSync(pageRoot);
    list = files.concat(pages);
  }
  const paths: SubPageType[] = list
    .flatMap((fileName) => {
      let calculatePath;
      if (fs.existsSync(path.join(pageRoot, fileName))) {
        calculatePath = path.join(pageRoot, fileName);
      } else if (fs.existsSync(path.join(docRoot, fileName))) {
        calculatePath = path.join(docRoot, fileName);
      } else {
        return undefined;
      }
      if (fs.lstatSync(calculatePath).isDirectory()) {
        const subFiles = fs.readdirSync(calculatePath);
        return subFiles
          .filter((subFile) => subFile.endsWith('.md'))
          .flatMap((subFile) => {
            const childPath = fileName.replace('.md', '');
            if (knownPaths.indexOf(childPath) < 0) {
              return {
                params: {
                  level1: fileName,
                  level2: subFile.replace('.md', ''),
                },
              };
            }
          })
          .filter(filterOutUndefined);
      }
    })
    .filter(filterOutUndefined);
  return paths;
};

/**
 * Build the static menu for rendeirng pages
 * @returns SectionLink[]
 */
export const staticBuildMenu = () => {
  // // Contents of docs
  const docRoot = path.join(process.env.HANDOFF_MODULE_PATH ?? '', 'config/docs');
  // Get the file list
  const files = fs.readdirSync(docRoot);
  let list = files;
  const workingPages = path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages');
  let pages: string[] = [];
  if (fs.existsSync(workingPages)) {
    pages = fs.readdirSync(workingPages);
    list = list.concat(pages);
  }
  const sections: SectionLink[] = [];
  // Build path tree
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
        (fileName.endsWith('md') || fileName.endsWith('mdx'))
      ) {
        const contents = fs.readFileSync(search, 'utf-8');
        const { data: metadata } = matter(contents);
        if (metadata.enabled === false) {
          return undefined;
        }

        const filepath = `/${fileName.replace('.mdx', '').replace('.md', '')}`;
        let subSections = [];

        if (metadata.menu) {
          // Build the submenu
          subSections = Object.keys(metadata.menu)
            .map((key) => {
              const sub = metadata.menu[key];
              if (sub.components) {
                // The user wants to inject the component menu here
                return {
                  title: sub.title,
                  menu: staticBuildComponentMenu(sub.components),
                };
              }
              if (sub.tokens) {
                // The user wants to inject the component menu here
                return {
                  title: 'Tokens',
                  menu: staticBuildTokensMenu(),
                };
              }
              if (sub.enabled !== false) {
                return sub;
              }
            })
            .filter(filterOutUndefined);
        }

        return {
          title: metadata.menuTitle ?? metadata.title,
          weight: metadata.weight,
          path: filepath,
          subSections,
        };
      }
    })
    .filter(filterOutUndefined);
  return sections.concat(custom).sort((a: SectionLink, b: SectionLink) => a.weight - b.weight);
};

const staticBuildComponentMenu = (type?: string) => {
  let menu = [];
  let components = fetchComponents({ includeTokens: false });
  if (type) {
    components = components.filter((component) => component.type == type);
  }
  // Build the submenu of exportables (components)
  const groupedComponents = groupBy(components, (e) => e.group ?? '');
  Object.keys(groupedComponents).forEach((group) => {
    const menuGroup = { title: group || 'Uncategorized', menu: [] };
    groupedComponents[group].forEach((component) => {
      const docs = fetchDocPageMetadataAndContent('docs/components/', component.id);
      let title = startCase(component.id);
      if (docs.metadata.title) {
        title = docs.metadata.title;
      }
      if (component.name) {
        title = component.name;
      }
      menuGroup.menu.push({ path: `system/component/${component.id}`, title });
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
  const menu = [
    {
      title: `Foundations`,
      path: `system/tokens/foundations`,
      menu: [
        {
          title: `Colors`,
          path: `system/tokens/foundations/colors`,
        },
        {
          title: `Effects`,
          path: `system/tokens/foundations/effects`,
        },
        {
          title: `Typography`,
          path: `system/tokens/foundations/typography`,
        },
      ],
    },
  ];

  const componentMenuItems = [];
  const components = fetchComponents({ includeApi: false });
  // Build the submenu of exportables (components)
  const groupedComponents = groupBy(components, (e) => e.group ?? '');
  Object.keys(groupedComponents).forEach((group) => {
    groupedComponents[group].forEach((component) => {
      const docs = fetchDocPageMetadataAndContent('docs/components/', component.id);
      let title = startCase(component.id);
      if (docs.metadata.title) {
        title = docs.metadata.title;
      }
      if (component.name) {
        title = component.name;
      }
      componentMenuItems.push({ path: `system/tokens/components/${component.id}`, title });
    });
  });

  if (componentMenuItems.length > 0) {
    menu.push({
      title: `Components`,
      path: `system/tokens/components`,
      menu: componentMenuItems,
    });
  }

  return menu;
};

const staticBuildTokenMenu = () => {
  let subSections = {
    title: 'Tokens',
    path: 'system/tokens',
    menu: [],
  };
  const tokens = getTokens();

  return subSections;
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
export const fetchDocPageMarkdown = (path: string, slug: string | undefined, id: string, integrationObject?: IntegrationObject) => {
  const menu = staticBuildMenu();
  const { metadata, content, options } = fetchDocPageMetadataAndContent(path, slug, integrationObject);
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

export const fetchMdxPageMarkdown = () => {
  //const menu = staticBuildMenu();
  // Return props
  return {
    props: {
      menu: [],
      current: [],
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
export const fetchCompDocPageMarkdown = (path: string, slug: string | undefined, id: string, integrationObject?: IntegrationObject) => {
  return {
    props: {
      ...fetchDocPageMarkdown(path, slug, id, integrationObject).props,
      scss: slug ? fetchTokensString(slug, 'scss') : '',
      css: slug ? fetchTokensString(slug, 'css') : '',
      styleDictionary: slug ? fetchTokensString(slug, 'styleDictionary') : '',
      types: slug ? fetchTokensString(slug, 'types') : '',
    },
  };
};

type FetchComponentsOptions = {
  includeTokens?: boolean;
  includeApi?: boolean;
};

/**
 * Fetch exportables id's from the JSON files in the exportables directory
 * @param options - Configuration object to specify which component sources to include
 * @param options.includeTokens - Include components from tokens.json (default: true)
 * @param options.includeApi - Include components from components.json API (default: true)
 * @returns {string[]} Array of component objects with id, type, group, name, and description
 */
export const fetchComponents = (options?: FetchComponentsOptions) => {
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
    const componentIds = Array.from(
      new Set<string>(
        (
          JSON.parse(
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
          ) as ComponentListObject[]
        ).map((c) => c.id)
      )
    );

    for (const componentId of componentIds) {
      const metadata = getLatestComponentMetadata(componentId);
      if (metadata) {
        components[componentId] = {
          type: metadata.type as ComponentType,
          group: metadata.group || '',
          description: metadata.description || '',
          name: metadata.title || '',
        };
      }
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

type RuntimeCache = IntegrationObject & { config: ClientConfig };

let cachedRuntimeCache: RuntimeCache | null = null;

const getDefaultRuntimeCache = (): RuntimeCache => {
  return {
    config: {} as ClientConfig,
    entries: {
      integration: undefined,
      bundle: undefined,
      components: {},
    },
    options: {},
  } as RuntimeCache;
};

const loadRuntimeCache = (): RuntimeCache => {
  if (cachedRuntimeCache) {
    return cachedRuntimeCache;
  }

  const modulePath = process.env.HANDOFF_MODULE_PATH ?? '';
  const projectId = process.env.HANDOFF_PROJECT_ID ?? '';
  const runtimeCachePath = path.resolve(modulePath, '.handoff', projectId, 'runtime.cache.json');

  if (!fs.existsSync(runtimeCachePath)) {
    // Return empty default instead of throwing to support running without fetch
    return getDefaultRuntimeCache();
  }

  try {
    const cacheContent = fs.readFileSync(runtimeCachePath, 'utf-8');
    cachedRuntimeCache = JSON.parse(cacheContent) as RuntimeCache;
    return cachedRuntimeCache;
  } catch (e) {
    // Return empty default on error instead of throwing
    return getDefaultRuntimeCache();
  }
};

export const getLatestComponentMetadata = (id: string) => {
  const runtimeCache = loadRuntimeCache();

  const components = runtimeCache.entries?.components;

  if (!components || !components[id]) {
    return false;
  }

  const versions = Object.keys(components[id]);

  if (!versions.length) {
    return false;
  }

  // Use natural version sorting (optional improvement below!)
  const latestVersion = semver.rsort(versions).shift();

  if (!latestVersion) {
    return false;
  }

  const latestComponent = components[id][latestVersion];

  return latestComponent || false;
};

/**
 * Returns the legacy component definition for component with the given name.
 * @deprecated Will be removed before 1.0.0 release.
 */
export const getLegacyDefinition = (name: string) => {
  const config = getClientRuntimeConfig();

  const sourcePath = path.resolve(process.env.HANDOFF_WORKING_PATH, 'exportables');

  if (!fs.existsSync(sourcePath)) {
    return null;
  }

  const definitionPaths = (findFilesByExtension(sourcePath, '.json') ?? []).filter((path) => path.split('/').pop() === name);

  if (definitionPaths.length === 0) {
    return null;
  }

  const data = fs.readFileSync(definitionPaths[0], 'utf-8');
  const exportable = JSON.parse(data.toString()) as CoreTypes.ILegacyComponentDefinition;

  const exportableOptions = {};
  merge(exportableOptions, exportable.options);
  exportable.options = exportableOptions as CoreTypes.ILegacyComponentDefinitionOptions;
  return exportable;
};

/**
 * Fetch Component Doc Page Markdown
 * @param path
 * @param slug
 * @param id
 * @returns
 */
export const fetchFoundationDocPageMarkdown = (path: string, slug: string | undefined, id: string) => {
  return {
    props: {
      ...fetchDocPageMarkdown(path, slug, id).props,
      scss: slug ? fetchTokensString(pluralizeComponent(slug), 'scss') : '',
      css: slug ? fetchTokensString(pluralizeComponent(slug), 'css') : '',
      styleDictionary: slug ? fetchTokensString(pluralizeComponent(slug), 'styleDictionary') : '',
      types: slug ? fetchTokensString(pluralizeComponent(slug), 'types') : '',
    },
  };
};

export const getClientRuntimeConfig = (): ClientConfig => {
  const runtimeCache = loadRuntimeCache();
  return runtimeCache.config;
};

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

export const getChangelog = () => {
  const exportedFilePath = process.env.HANDOFF_EXPORT_PATH
    ? path.resolve(process.env.HANDOFF_EXPORT_PATH, 'changelog.json')
    : path.resolve(process.cwd(), process.env.HANDOFF_OUTPUT_DIR ?? 'exported', 'changelog.json');
  if (!fs.existsSync(exportedFilePath)) return [];
  const data = fs.readFileSync(exportedFilePath, 'utf-8');
  return JSON.parse(data.toString()) as ChangelogRecord[];
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
export const fetchDocPageMetadataAndContent = (
  localPath: string,
  slug: string | string[] | undefined,
  integrationObject?: IntegrationObject
) => {
  const pagePath = localPath.replace('docs/', 'pages/');
  const handoffModulePath = process.env.HANDOFF_MODULE_PATH ?? '';
  const handoffWorkingPath = process.env.HANDOFF_WORKING_PATH ?? '';

  let currentContents = '';
  let options = {} as ComponentDocumentationOptions;

  const contentModuleFilePath = path.resolve(handoffModulePath, 'config', `${localPath}${slug}.md`);
  const contentWorkingFilePath = path.resolve(handoffWorkingPath, `${pagePath}${slug}.md`);

  if (fs.existsSync(contentWorkingFilePath)) {
    currentContents = fs.readFileSync(contentWorkingFilePath, 'utf-8');
  } else if (!fs.existsSync(contentModuleFilePath)) {
    return { metadata: {}, content: currentContents, options: {} };
  } else {
    currentContents = fs.readFileSync(contentModuleFilePath, 'utf-8');
  }

  const { data: metadata, content } = matter(currentContents);

  if (typeof slug === 'string' && integrationObject?.entries?.templates) {
    const viewConfigFilePath = path.resolve(integrationObject.entries.templates, slug, 'view.config.json');
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
  return `${prefix}${config?.app?.client} Design System`;
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
