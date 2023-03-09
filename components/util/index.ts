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
        return {
          title: metadata.menuTitle ?? metadata.title,
          weight: metadata.weight,
          path: `/${fileName.replace('.md', '')}`,
          // Build the submenus
          subSections: metadata.menu
            ? Object.keys(metadata.menu)
                .map((key) => {
                  const sub = metadata.menu[key];
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
export const fetchDocPageMarkdown = (path: string, slug: string | string[] | undefined, id: string) => {
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

export const fetchDocPageMetadataAndContent = (path: string, slug: string | string[] | undefined) => {
  const currentContents = fs.readFileSync(`${path}${slug}.md`, 'utf-8');
  const { data: metadata, content } = matter(currentContents);

  return { metadata, content };
}

export const filterOutUndefined = <T>(value: T): value is NonNullable<T> => value !== undefined;

export const titleString = (prefix: string | null): string => {
  const config = getConfig();
  const prepend = prefix ? `${prefix} | ` : '';
  return `${prefix}${config.client} Design System`;
};
