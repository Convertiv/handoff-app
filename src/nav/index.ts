/** A mode-aware placeholder retained in the serialized navigation shell. */
export interface NavDynamicSlot {
  kind: 'components' | 'patterns' | 'token-components';
  type?: string;
}

/** A link nested within a navigation subsection. */
export interface NavMenuItem {
  title: string;
  path?: string;
  image?: string;
  menu?: NavMenuItem[];
}

/** A group or direct link beneath a top-level navigation section. */
export interface NavSubSection {
  title: string;
  path?: string;
  image?: string;
  menu?: NavMenuItem[];
  dynamic?: NavDynamicSlot;
}

/** The canonical top-level navigation section shared by the build pipeline and docs app. */
export interface SectionLink {
  title: string;
  weight: number;
  external?: string | boolean;
  path: string;
  subSections: NavSubSection[];
}

/** Minimal navigation entity served by the docs navigation endpoint. */
export interface NavEntity {
  id: string;
  title?: string;
  group?: string;
  type?: string;
}

/** A navigation token-set record. Only component sets are rendered in the component-token slot. */
export interface NavTokenSet extends NavEntity {
  kind: 'foundation' | 'component';
}

/** A declarative submenu entry carried by a page record. */
export interface NavPageMenuDeclaration {
  title?: string;
  enabled?: boolean;
  components?: boolean | string;
  patterns?: boolean;
  tokens?: boolean;
  path?: string;
  image?: string;
  menu?: NavMenuItem[];
}

/** The page fields needed to compose page-authored navigation sections. */
export interface NavPageRecord {
  id: string;
  path?: string;
  title?: string;
  menuTitle?: string;
  weight?: number;
  enabled?: boolean;
  external?: string | boolean;
  menu?: Record<string, NavPageMenuDeclaration> | NavPageMenuDeclaration[];
}

/** Eager, already-resolved inputs to the pure navigation resolver. */
export interface NavSources {
  shell: SectionLink[];
  components: NavEntity[];
  patterns: NavEntity[];
  pages: NavPageRecord[];
  tokenSets: NavTokenSet[];
  tokenFoundations: NavMenuItem[];
  basePath?: string;
}

export type NavMode = 'workspace' | 'registry';
export type NavLoad = 'initial' | 'refresh';

/** The render-ready navigation payload. */
export interface NavData {
  shell: SectionLink[];
}

export { getNavData } from './resolver';
export type { GetNavDataInput } from './resolver';
export { getWorkspaceNavData } from './workspace';
export type { WorkspaceNavAdapterOptions, WorkspaceNavLoaders } from './workspace';
export { getRegistryNavData } from './registry';
export type { RegistryNavAdapterOptions, RegistryNavRecords } from './registry';
