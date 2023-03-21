import { Config } from 'client-config';
import { getConfig } from 'config';
import { filter } from 'domutils';
import * as fs from 'fs-extra';
import matter from 'gray-matter';
import { SubPageType } from 'pages/[level1]/[level2]';
import path, { dirname } from 'path';
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
}

export interface ComponentDocumentationProps extends DocumentationProps{
  componentFound: boolean;
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
 * Does a component exist in figma? Check the length of the component tokens
 * @param component 
 * @param config 
 * @returns 
 */
export const componentExists = (component: string, config?: Config): boolean => {
  if (!config) {
    config = getConfig();
  }
  const componentKey = pluralizeComponent(component) ?? false;
  // If this is a component (we define it in the tokens file)
  // but it has a length of 0, return the menu as undefined even
  // if its set in the file list
  if (config.components[componentKey] && config.components[componentKey].length === 0) {
    return false;
  }
  return true;
};

/**
 * Build the static menu for rendeirng pages
 * @returns SectionLink[]
 */
export const staticBuildMenu = () => {
  // Contents of docs
  const files = fs.readdirSync('docs');
  const sections: SectionLink[] = [];
  const config = getConfig();

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
        return {
          title: metadata.menuTitle ?? metadata.title,
          weight: metadata.weight,
          path,
          // Build the submenus
          subSections: metadata.menu
            ? Object.keys(metadata.menu)
                .map((key) => {
                  const sub = metadata.menu[key];
                  // Component menus are filtered by the presence of tokens
                  if (path === '/components' && sub.path) {
                    const componentName = sub.path.replace('components/', '');
                    if (!componentExists(componentName, config)) {
                      return undefined;
                    }
                  }
                  if (sub.enabled !== false) {
                    return sub;
                  }
                })
                .filter(filterOutUndefined)
            : [],
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
export const fetchDocPageMarkdown = (path: string, slug: string | undefined, id: string)=> {
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
      componentFound: (slug) ? componentExists(pluralizeComponent(slug), undefined) : false
    },
  };
}

/**
 * Reduce a slug which can be either an array or string, to just a string by
 * plucking the first element
 * @param slug 
 * @returns 
 */
export const reduceSlugToString = (slug: string | string[] | undefined) : string | undefined => {
  let prop: string | undefined;
  if (Array.isArray(slug)) {
    if(slug[0]){
      prop = slug[0];
    }
  }else{
    prop = slug;
  }
  return prop;
}

/**
 * Get doc meta and content from markdown
 * @param path 
 * @param slug 
 * @returns 
 */
export const fetchDocPageMetadataAndContent = (path: string, slug: string | string[] | undefined) => {
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
