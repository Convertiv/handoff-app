import { getConfig } from '../../../config';
import { ChangelogRecord } from '../../../changelog';
import { ExportResult, Config } from '../../../types/config';
import { Component } from '../../../exporters/components/extractor';
import { ExportableDefinition, ExportableOptions, PreviewJson, PreviewObject } from '../../../types';
import { filterOutNull } from '../../../utils';
import * as fs from 'fs-extra';
import matter from 'gray-matter';
import { groupBy, merge } from 'lodash';
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
  config: Config;
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

export interface ComponentDocumentationProps extends DocumentationProps {
  scss: string;
  css: string;
  types: string;
  exportable: ExportableDefinition;
  components: Component[];
  previews: PreviewObject[];
  component: string;
}

export interface FoundationDocumentationProps extends DocumentationProps {
  scss: string;
  css: string;
  types: string;
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
  const files = fs.readdirSync('docs');
  const paths = files
    .filter((fileName) => !fs.lstatSync(path.join('docs', fileName)).isDirectory())
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
  const files = fs.readdirSync('docs');
  const paths: SubPageType[] = files
    .flatMap((fileName) => {
      if (fs.lstatSync(path.join('docs', fileName)).isDirectory()) {
        const subFiles = fs.readdirSync(path.join('docs', fileName));
        return subFiles
          .flatMap((subFile) => {
            const path = fileName.replace('.md', '');
            if (knownPaths.indexOf(path) < 0) {
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
  const files = fs.readdirSync('docs');
  const sections: SectionLink[] = [];

  // Build path tree
  const custom = files
    .map((fileName) => {
      const search = path.resolve(`docs/${fileName}`);
      if (!fs.lstatSync(search).isDirectory() && search !== path.resolve('docs/index.md') && fileName.endsWith('md')) {
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
          const groupedExportables = groupBy(exportables, e => e.group ?? '');
          Object.keys(groupedExportables).forEach(group => {
            subSections.push({ path: '', title: group });
            groupedExportables[group].forEach(exportable => {
              const exportableDocs = fetchDocPageMetadataAndContent('docs/components/', exportable.id);
              subSections.push({ path: `components/${exportable.id}`, title: exportableDocs.metadata.title ?? exportable.id });
            })
          })
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
          .filter(filterOutUndefined)
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
    const config = getConfig();
    const definitions = config.figma?.definitions;

    if (!definitions || definitions.length === 0) {
      return [];
    }

    const exportables = definitions
      .map((def) => {
        const defPath = path.join('exportables', `${def}.json`);

        if (!fs.existsSync(defPath)) {
          return null;
        }

        const defBuffer = fs.readFileSync(defPath);
        const exportable = JSON.parse(defBuffer.toString()) as ExportableDefinition;

        const exportableOptions = {};
        merge(exportableOptions, config.figma?.options, exportable.options);
        exportable.options = exportableOptions as ExportableOptions;

        return exportable;
      })
      .filter(filterOutNull)

    return exportables ? exportables : [];
  } catch (e) {
    return [];
  }
}

export const fetchExportable = (name: string) => {
  const config = getConfig();

  const def = config?.figma?.definitions.filter((def) => {
    return def.split('/').pop() === name;
  });

  if (!def || def.length === 0) {
    return null;
  }

  const defPath = path.join('exportables', `${def}.json`);

  if (!fs.existsSync(defPath)) {
    return null;
  }
  
  const data = fs.readFileSync(defPath, 'utf-8');
  return JSON.parse(data.toString()) as ExportableDefinition;
}


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
      types: slug ? fetchTokensString(pluralizeComponent(slug), 'types') : '',
    },
  };
};

export const getTokens = () : ExportResult => {
  const data = fs.readFileSync('./exported/tokens.json', 'utf-8');
  return JSON.parse(data.toString()) as ExportResult;
}

export const getChangelog = () => {
  const data = fs.readFileSync('./exported/changelog.json', 'utf-8');
  return JSON.parse(data.toString()) as ChangelogRecord[];
}

export const getPreview = () : PreviewJson => {
  const data = fs.readFileSync('./exported/preview.json', 'utf-8');
  return JSON.parse(data.toString()) as PreviewJson;
}

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
export const fetchDocPageMetadataAndContent = (path: string, slug: string | string[] | undefined) => {
  if (!fs.existsSync(`${path}${slug}.md`)) {
    return { metadata: {}, content: '' };
  }
  const currentContents = fs.readFileSync(`${path}${slug}.md`, 'utf-8');
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
  const config = getConfig();
  const prepend = prefix ? `${prefix} | ` : '';
  return `${prefix}${config.client} Design System`;
};

export const fetchTokensString = (component: string, type: string): string => {
  let tokens = '';
  if (type === 'scss' && fs.existsSync(`./exported/tokens/sass/${component}.scss`)) {
    tokens = fs.readFileSync(`./exported/tokens/sass/${component}.scss`).toString();
  } else if (type === 'types' && fs.existsSync(`./exported/tokens/types/${component}.scss`)) {
    tokens = fs.readFileSync(`./exported/tokens/types/${component}.scss`).toString();
  } else if (fs.existsSync(`./exported/tokens/css/${component}.css`)) {
    tokens = fs.readFileSync(`./exported/tokens/css/${component}.css`).toString();
  }
  return tokens;
};