import { getClientConfig } from '../../../config';
import { ChangelogRecord } from '../../../changelog';
import { ExportResult, ClientConfig } from '../../../types/config';
import { Component } from '../../../exporters/components/extractor';
import { ExportableDefinition, ExportableOptions, PreviewJson, PreviewObject } from '../../../types';
import { filterOutNull } from '../../../utils';
import * as fs from 'fs-extra';
import matter from 'gray-matter';
import { groupBy, merge, uniq } from 'lodash';
import { SubPageType } from '../../pages/[level1]/[level2]';
import path from 'path';
import { ParsedUrlQuery } from 'querystring';

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
  image: string;
  date: string;
  tags: string[];
  menu: string[];
  enabled: boolean;
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
  }[];
}
// Documentation Page Properties
export interface DocumentationProps {
  metadata: Metadata;
  content: string;
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
  design: ExportResult['design'];
}

export interface AssetDocumentationProps extends DocumentationProps {
  assets: ExportResult['assets'];
}

export interface ComponentDocumentationProps extends DocumentationWithTokensProps {
  exportable: ExportableDefinition;
  components: Component[];
  previews: PreviewObject[];
  component: string;
}

export interface FoundationDocumentationProps extends DocumentationWithTokensProps {
  design: ExportResult['design'];
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
  'components',
  'changelog',
  'components/button',
  'components/alert',
  'components/modal',
  'components/pagination',
  'components/tooltip',
  'components/switch',
  'components/input',
  'components/radio',
  'components/select',
  'components/checkbox',
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
  const docRoot = path.resolve(process.env.HANDOFF_MODULE_PATH ?? "", 'config/docs');
  const files = fs.readdirSync(docRoot);
  const pageRoot = path.resolve(process.env.HANDOFF_WORKING_PATH ?? "", 'pages');
  let list = files;
  if(fs.existsSync(pageRoot)){
    const pages = fs.readdirSync(pageRoot);
    list = files.concat(pages);
  }
  const paths = list
    .filter((fileName) => {
      if(fs.existsSync(path.join(docRoot, fileName))) return !fs.lstatSync(path.join(docRoot, fileName)).isDirectory();
      if(fs.existsSync(path.join(pageRoot, fileName))) return !fs.lstatSync(path.join(pageRoot, fileName)).isDirectory();
      return false;
    })
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
  const docRoot = path.resolve(process.env.HANDOFF_MODULE_PATH ?? "", 'config/docs');
  const files = fs.readdirSync(docRoot);
  const pageRoot = path.resolve(process.env.HANDOFF_WORKING_PATH ?? "", 'pages');
  let list = files;
  if(fs.existsSync(pageRoot)){
    const pages = fs.readdirSync(pageRoot);
    list = files.concat(pages);
  }
  const paths: SubPageType[] = list
    .flatMap((fileName) => {
      let calculatePath;
      if(fs.existsSync(path.join(pageRoot, fileName))){
        calculatePath = path.join(pageRoot, fileName);
      }else if(fs.existsSync(path.join(docRoot, fileName))){
        calculatePath = path.join(docRoot, fileName);
      }else{
        return undefined;
      }
      if (fs.lstatSync(calculatePath).isDirectory()) {
        const subFiles = fs.readdirSync(calculatePath);
        return subFiles
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
  // Contents of docs
  const docRoot = path.resolve(process.env.HANDOFF_MODULE_PATH ?? "", 'config/docs');
  const files = fs.readdirSync(docRoot);
  let list = files;
  const workingPages = path.resolve(process.env.HANDOFF_WORKING_PATH ?? "", 'pages');
  let pages: string[] = [];
  if (fs.existsSync(workingPages)) {
    pages = fs.readdirSync(workingPages);
    list = list.concat(pages);
  }
  const sections: SectionLink[] = [];
  // Build path tree
  const custom = uniq(list)
    .map((fileName) => {
      let search = '';
      if (pages.includes(fileName)) {
        search = path.resolve(workingPages, fileName);
      } else {
        search = path.resolve(docRoot, fileName);
      }
      if (!fs.lstatSync(search).isDirectory() && search !== path.resolve(docRoot, 'index.md') && fileName.endsWith('md')) {
        const contents = fs.readFileSync(search, 'utf-8');
        const { data: metadata } = matter(contents);

        if (metadata.enabled === false) {
          return undefined;
        }

        const path = `/${fileName.replace('.md', '')}`;
        let subSections = [];

        if (path === '/components') {
          const exportables = fetchExportables();
          // Build the submenu of exportables (components)
          const groupedExportables = groupBy(exportables, (e) => e.group ?? '');
          Object.keys(groupedExportables).forEach((group) => {
            subSections.push({ path: '', title: group });
            groupedExportables[group].forEach((exportable) => {
              const exportableDocs = fetchDocPageMetadataAndContent('docs/components/', exportable.id);
              subSections.push({ path: `components/${exportable.id}`, title: exportableDocs.metadata.title ?? exportable.id });
            });
          });
        }

        if (metadata.menu) {
          // Build the submenu
          subSections = Object.keys(metadata.menu)
            .map((key) => {
              const sub = metadata.menu[key];
              if (sub.enabled !== false) {
                return sub;
              }
            })
            .filter(filterOutUndefined);
        }

        return {
          title: metadata.menuTitle ?? metadata.title,
          weight: metadata.weight,
          path,
          subSections,
        };
      }
    })
    .filter(filterOutUndefined);
  return sections.concat(custom).sort((a: SectionLink, b: SectionLink) => a.weight - b.weight);
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
export const fetchDocPageMarkdown = (path: string, slug: string | undefined, id: string) => {
  const menu = staticBuildMenu();
  const { metadata, content } = fetchDocPageMetadataAndContent(path, slug);
  // Return props
  return {
    props: {
      metadata,
      content,
      menu,
      current: getCurrentSection(menu, `${id}`) ?? [],
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
export const fetchCompDocPageMarkdown = (path: string, slug: string | undefined, id: string) => {
  return {
    props: {
      ...fetchDocPageMarkdown(path, slug, id).props,
      scss: slug ? fetchTokensString(slug, 'scss') : '',
      css: slug ? fetchTokensString(slug, 'css') : '',
      styleDictionary: slug ? fetchTokensString(slug, 'styleDictionary') : '',
      types: slug ? fetchTokensString(slug, 'types') : '',
    },
  };
};

/**
 * Fetch exportables id's from the JSON files in the exportables directory
 * @returns {string[]}
 */
export const fetchExportables = () => {
  try {
    const config = getClientConfig();
    const definitions = config?.figma?.definitions;

    if (!definitions || definitions.length === 0) {
      return [];
    }

    const exportables = definitions
      .map((def) => {
        let defPath = path.resolve(process.env.HANDOFF_MODULE_PATH ?? "", 'config', 'exportables', `${def}.json`);
        const projectPath = path.resolve(path.join(process.env.HANDOFF_WORKING_PATH ?? "", 'exportables', `${def}.json`));
        // If the project path exists, use that first as an override
        if (fs.existsSync(projectPath)) {
          defPath = projectPath;
        } else if (!fs.existsSync(defPath)) {
          return null;
        }
        const defBuffer = fs.readFileSync(defPath);
        const exportable = JSON.parse(defBuffer.toString()) as ExportableDefinition;

        const exportableOptions = {};
        merge(exportableOptions, config?.figma?.options, exportable.options);
        exportable.options = exportableOptions as ExportableOptions;
        return exportable;
      })
      .filter(filterOutNull);

    return exportables ? exportables : [];
  } catch (e) {
    return [];
  }
};

export const fetchExportable = (name: string) => {
  const config = getClientConfig();
  const def = config?.figma?.definitions.filter((def) => {
    return def.split('/').pop() === name;
  });
  if (!def || def.length === 0) {
    return null;
  }

  let defPath = path.resolve(process.env.HANDOFF_MODULE_PATH ?? "", 'config', 'exportables', `${def}.json`);
  const projectPath = path.resolve(path.join(process.env.HANDOFF_WORKING_PATH ?? "", 'exportables', `${def}.json`));
  // If the project path exists, use that first as an override
  if (fs.existsSync(projectPath)) {
    defPath = projectPath;
  } else if (!fs.existsSync(defPath)) {
    return null;
  }
  if (!fs.existsSync(defPath)) {
    return null;
  }

  const data = fs.readFileSync(defPath, 'utf-8');
  const exportable = JSON.parse(data.toString()) as ExportableDefinition;

  const exportableOptions = {};
  merge(exportableOptions, config?.figma?.options, exportable.options);
  exportable.options = exportableOptions as ExportableOptions;
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

export const getTokens = (): ExportResult => {
  const exportedFilePath = process.env.HANDOFF_EXPORT_PATH ? path.resolve(process.env.HANDOFF_EXPORT_PATH, 'tokens.json') : path.resolve(process.cwd(), process.env.OUTPUT_DIR ?? 'exported', 'tokens.json');
  if(!fs.existsSync(exportedFilePath)) return {} as ExportResult;
  const data = fs.readFileSync(exportedFilePath, 'utf-8');
  return JSON.parse(data.toString()) as ExportResult;
};

export const getChangelog = () => {
  const exportedFilePath = process.env.HANDOFF_EXPORT_PATH ? path.resolve(process.env.HANDOFF_EXPORT_PATH, 'changelog.json') : path.resolve(process.cwd(), process.env.OUTPUT_DIR ?? 'exported', 'changelog.json');
  if(!fs.existsSync(exportedFilePath)) return [];
  const data = fs.readFileSync(exportedFilePath, 'utf-8');
  return JSON.parse(data.toString()) as ChangelogRecord[];
};

export const getPreview = (): PreviewJson => {
  const exportedFilePath = process.env.HANDOFF_EXPORT_PATH ? path.resolve(process.env.HANDOFF_EXPORT_PATH, 'preview.json') : path.resolve(process.cwd(), process.env.OUTPUT_DIR ?? 'exported', 'preview.json');
  if(!fs.existsSync(exportedFilePath)) return {} as PreviewJson;
  const data = fs.readFileSync(exportedFilePath, 'utf-8');
  return JSON.parse(data.toString()) as PreviewJson;
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
export const fetchDocPageMetadataAndContent = (localPath: string, slug: string | string[] | undefined) => {
  const filepath = path.resolve(process.env.HANDOFF_MODULE_PATH ?? "", 'config', `${localPath}${slug}.md`);
  const pagePath = localPath.replace('docs/', 'pages/');
  const workingPath = path.resolve(process.env.HANDOFF_WORKING_PATH ?? "", `${pagePath}${slug}.md`);
  let currentContents = '';
  
  if (fs.existsSync(workingPath)) {
    currentContents = fs.readFileSync(workingPath, 'utf-8');
  } else if (!fs.existsSync(filepath)) {
    return { metadata: {}, content: currentContents };
  } else {
    currentContents = fs.readFileSync(filepath, 'utf-8');
  }
  const { data: metadata, content } = matter(currentContents);
  return { metadata, content };
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
  const config = getClientConfig();
  const prepend = prefix ? `${prefix} | ` : '';
  return `${prefix}${config?.app?.client} Design System`;
};

export const fetchTokensString = (component: string, type: 'css' | 'scss' | 'styleDictionary' | 'types'): string => {
  let tokens = '';
  const baseSearchPath = process.env.HANDOFF_EXPORT_PATH ? path.resolve(process.env.HANDOFF_EXPORT_PATH, 'tokens') : path.resolve(process.cwd(), process.env.OUTPUT_DIR ?? 'exported', 'tokens');
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
    } else {
      // Components
      tokens = fs.readFileSync(sdAltSearchPath).toString();
    }
  } else if (fs.existsSync(cssSearchPath)) {
    tokens = fs.readFileSync(cssSearchPath).toString();
  }
  return tokens;
};