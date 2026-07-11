import { buildTokensFoundationsMenu } from '../utils/menu-shell';
import type { NavData, NavEntity, NavLoad, NavPageRecord, NavTokenSet, SectionLink } from '.';
import { getNavData } from './resolver';

export interface RegistryNavRecords {
  components: NavEntity[];
  patterns: NavEntity[];
  pages: NavPageRecord[];
  tokenSets: NavTokenSet[];
}

export interface RegistryNavAdapterOptions {
  shell: SectionLink[];
  load: NavLoad;
  basePath?: string;
  fetchRecords: () => Promise<RegistryNavRecords>;
}

const emptyRecords = (): RegistryNavRecords => ({ components: [], patterns: [], pages: [], tokenSets: [] });

/** Registry adapter: shell-only initial load, or one best-effort runtime-record fetch on refresh. */
export const getRegistryNavData = async (options: RegistryNavAdapterOptions): Promise<NavData> => {
  let records = emptyRecords();
  if (options.load === 'refresh') {
    try {
      records = (await options.fetchRecords()) ?? records;
    } catch {
      // The baked structure is deliberately useful without the registry backend.
    }
  }
  const componentById = new Map(records.components.map((component) => [component.id, component]));
  const tokenSets = records.tokenSets.map((set) => {
    const id = set.id.startsWith('component/') ? set.id.slice('component/'.length) : set.id;
    const component = componentById.get(id);
    return {
      ...set,
      title: set.title || component?.title,
      group: set.group ?? component?.group,
    };
  });
  const normalizedBasePath = options.basePath ? `${options.basePath.replace(/^\/+|\/+$/g, '')}/` : '';

  return getNavData({
    mode: 'registry',
    load: options.load,
    sources: {
      shell: options.shell,
      ...records,
      tokenSets,
      tokenFoundations: buildTokensFoundationsMenu(normalizedBasePath),
      basePath: options.basePath,
    },
  });
};
