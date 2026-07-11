import { startCase } from 'lodash';
import type {
  NavData,
  NavEntity,
  NavLoad,
  NavMenuItem,
  NavMode,
  NavPageMenuDeclaration,
  NavPageRecord,
  NavSources,
  NavSubSection,
  SectionLink,
} from '.';

export interface GetNavDataInput {
  mode: NavMode;
  load: NavLoad;
  sources: NavSources;
}

const normalizeBasePath = (basePath?: string): string => {
  if (!basePath) return '';
  return `${basePath.replace(/^\/+|\/+$/g, '')}/`;
};

const cloneMenu = (menu: NavMenuItem[] = []): NavMenuItem[] =>
  menu.map((item) => ({ ...item, ...(item.menu ? { menu: cloneMenu(item.menu) } : {}) }));

const cloneSubSection = (section: NavSubSection): NavSubSection => ({
  ...section,
  ...(section.dynamic ? { dynamic: { ...section.dynamic } } : {}),
  ...(section.menu ? { menu: cloneMenu(section.menu) } : {}),
});

const cloneSection = (section: SectionLink): SectionLink => ({
  ...section,
  subSections: section.subSections.map(cloneSubSection),
});

const entityTitle = (entity: NavEntity): string => entity.title || startCase(entity.id);

const buildEntityMenu = (entities: NavEntity[], segment: 'component' | 'pattern', basePath: string): NavMenuItem[] => {
  const grouped = new Map<string, NavEntity[]>();
  for (const entity of entities) {
    const group = entity.group ?? '';
    grouped.set(group, [...(grouped.get(group) ?? []), entity]);
  }

  return Array.from(grouped.entries())
    .map(([group, records]) => ({
      title: group || 'Uncategorized',
      path: '',
      menu: records
        .map((record) => ({
          title: entityTitle(record),
          path: `${basePath}system/${segment}/${record.id}`,
        }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .map(({ path: _path, ...group }) => group)
    .sort((a, b) => a.title.localeCompare(b.title));
};

const buildTokensMenu = (sources: NavSources, basePath: string): NavMenuItem[] => {
  const foundations = cloneMenu(sources.tokenFoundations);
  const componentSets = sources.tokenSets
    .filter((set) => set.kind === 'component')
    .map((set) => {
      const id = set.id.startsWith('component/') ? set.id.slice('component/'.length) : set.id;
      return {
        title: set.title || startCase(id),
        path: `${basePath}system/tokens/components/${id}`,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  if (componentSets.length > 0) {
    foundations.push({
      title: 'Components',
      path: `${basePath}system/tokens/components`,
      menu: componentSets,
    });
  }
  return foundations;
};

const fillSubSections = (subSections: NavSubSection[], sources: NavSources, keepEmpty: boolean): NavSubSection[] => {
  const basePath = normalizeBasePath(sources.basePath);
  const resolved: NavSubSection[] = [];

  for (const original of subSections) {
    const section = cloneSubSection(original);
    if (section.dynamic?.kind === 'components') {
      const entities = section.dynamic.type
        ? sources.components.filter((component) => component.type === section.dynamic?.type)
        : sources.components;
      section.menu = buildEntityMenu(entities, 'component', basePath);
    } else if (section.dynamic?.kind === 'patterns') {
      section.menu = buildEntityMenu(sources.patterns, 'pattern', basePath);
    } else if (section.dynamic?.kind === 'token-components') {
      section.menu = buildTokensMenu(sources, basePath);
    }

    if (!section.dynamic || keepEmpty || (section.menu?.length ?? 0) > 0) {
      resolved.push(section);
    }
  }
  return resolved;
};

const pageMenuEntries = (menu: NavPageRecord['menu']): NavPageMenuDeclaration[] => (Array.isArray(menu) ? menu : Object.values(menu ?? {}));

const declarationToSubSection = (declaration: NavPageMenuDeclaration, sources: NavSources): NavSubSection | undefined => {
  if (declaration.components) {
    return {
      title: declaration.title ?? 'Components',
      menu: [],
      dynamic: typeof declaration.components === 'string' ? { kind: 'components', type: declaration.components } : { kind: 'components' },
    };
  }
  if (declaration.patterns) {
    return { title: declaration.title ?? 'Patterns', menu: [], dynamic: { kind: 'patterns' } };
  }
  if (declaration.tokens) {
    return {
      title: 'Tokens',
      menu: cloneMenu(sources.tokenFoundations),
      dynamic: { kind: 'token-components' },
    };
  }
  if (declaration.enabled === false) return undefined;
  return {
    title: declaration.title ?? '',
    path: declaration.path,
    image: declaration.image,
    menu: declaration.menu ? cloneMenu(declaration.menu) : undefined,
  };
};

const buildChildPageItems = (parentId: string, pages: NavPageRecord[]): NavMenuItem[] => {
  const prefix = `${parentId}/`;
  const segments = Array.from(
    new Set(pages.filter((page) => page.id.startsWith(prefix)).map((page) => page.id.slice(prefix.length).split('/')[0]))
  );

  return segments
    .map((segment) => {
      const id = `${parentId}/${segment}`;
      const record = pages.find((page) => page.id === id);
      const nested = buildChildPageItems(id, pages);
      const item: NavMenuItem & { weight: number } = {
        title: record?.menuTitle || record?.title || startCase(segment),
        path: record?.path ?? `/${id}`,
        weight: record?.weight ?? 0,
      };
      if (nested.length > 0) item.menu = nested;
      return item;
    })
    .sort((a, b) => a.weight - b.weight || a.title.localeCompare(b.title))
    .map(({ weight: _weight, ...item }) => item);
};

const buildPageSections = (sources: NavSources, keepEmpty: boolean): SectionLink[] => {
  const pages = sources.pages.filter((page) => page.enabled !== false);
  return pages
    .filter((page) => !page.id.includes('/'))
    .map((page) => {
      const declared = page.menu
        ? pageMenuEntries(page.menu)
            .map((entry) => declarationToSubSection(entry, sources))
            .filter((entry): entry is NavSubSection => entry !== undefined)
        : [];
      const children = page.menu ? [] : buildChildPageItems(page.id, pages);
      const subSections = page.menu
        ? fillSubSections(declared, sources, keepEmpty)
        : children.length > 0
          ? [{ title: page.menuTitle || page.title || startCase(page.id), menu: children }]
          : [];
      const external =
        typeof page.external === 'string' &&
        (page.external.startsWith('http://') || page.external.startsWith('https://') || page.external.startsWith('/'))
          ? page.external
          : false;
      return {
        title: page.menuTitle || page.title || startCase(page.id),
        external,
        weight: page.weight ?? 0,
        path: page.path ?? `/${page.id}`,
        subSections,
      };
    });
};

const resolveCompleteTree = (sources: NavSources, keepEmpty: boolean): SectionLink[] => {
  const byPath = new Map(
    sources.shell.map((section) => [
      section.path,
      { ...cloneSection(section), subSections: fillSubSections(section.subSections, sources, keepEmpty) },
    ])
  );
  for (const section of buildPageSections(sources, keepEmpty)) {
    byPath.set(section.path, section);
  }
  return Array.from(byPath.values()).sort((a, b) => a.weight - b.weight);
};

/** Resolve an eager navigation snapshot without fetching, mutation, or asynchronous work. */
export const getNavData = ({ mode, load, sources }: GetNavDataInput): NavData => {
  if (mode === 'workspace') {
    return { shell: resolveCompleteTree(sources, false) };
  }

  if (load === 'initial') {
    return { shell: sources.shell.map(cloneSection) };
  }
  return { shell: resolveCompleteTree(sources, true) };
};
