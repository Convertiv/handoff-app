import * as fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { buildMenuShell, buildTokensFoundationsMenu } from '../utils/menu-shell';
import type { NavData, NavEntity, NavLoad, NavPageRecord, NavTokenSet } from '.';
import { getNavData } from './resolver';

type Awaitable<T> = T | Promise<T>;

export interface WorkspaceNavLoaders {
  components: () => Awaitable<NavEntity[]>;
  patterns: () => Awaitable<NavEntity[]>;
  pages: () => Awaitable<NavPageRecord[]>;
  tokenSets: () => Awaitable<NavTokenSet[]>;
}

export interface WorkspaceNavAdapterOptions {
  docRoot: string;
  workingPagesDir?: string;
  basePath?: string;
  load?: NavLoad;
  loaders: WorkspaceNavLoaders;
}

const safeLoad = async <T>(load: () => Awaitable<T[]>): Promise<T[]> => {
  try {
    return (await load()) ?? [];
  } catch {
    return [];
  }
};

const markdownTitle = (id: string, docRoot: string, workingPagesDir?: string): string | undefined => {
  const candidates = [
    workingPagesDir ? path.resolve(workingPagesDir, 'system', `${id}.md`) : '',
    path.resolve(docRoot, 'system', `${id}.md`),
  ];
  for (const candidate of candidates) {
    if (!candidate || !fs.existsSync(candidate)) continue;
    const title = matter(fs.readFileSync(candidate, 'utf8')).data.title;
    if (typeof title === 'string' && title.trim()) return title;
  }
  return undefined;
};

/** Workspace/static adapter: live filesystem shell plus best-effort local snapshot loaders. */
export const getWorkspaceNavData = async (options: WorkspaceNavAdapterOptions): Promise<NavData> => {
  const [loadedComponents, patterns, pages, loadedTokenSets] = await Promise.all([
    safeLoad(options.loaders.components),
    safeLoad(options.loaders.patterns),
    safeLoad(options.loaders.pages),
    safeLoad(options.loaders.tokenSets),
  ]);
  const components = loadedComponents.map((component) => ({
    ...component,
    title: component.title || markdownTitle(component.id, options.docRoot, options.workingPagesDir),
  }));
  const componentById = new Map(components.map((component) => [component.id, component]));
  const tokenSets = loadedTokenSets.map((set) => {
    const id = set.id.startsWith('component/') ? set.id.slice('component/'.length) : set.id;
    const component = componentById.get(id);
    return {
      ...set,
      title: set.title || component?.title || markdownTitle(id, options.docRoot, options.workingPagesDir),
      group: set.group ?? component?.group,
    };
  });
  const normalizedBasePath = options.basePath ? `${options.basePath.replace(/^\/+|\/+$/g, '')}/` : '';

  return getNavData({
    mode: 'workspace',
    load: options.load ?? 'refresh',
    sources: {
      shell: buildMenuShell({
        docRoot: options.docRoot,
        workingPagesDir: options.workingPagesDir,
        basePath: options.basePath,
      }),
      components,
      patterns,
      pages,
      tokenSets,
      tokenFoundations: buildTokensFoundationsMenu(normalizedBasePath),
      basePath: options.basePath,
    },
  });
};
