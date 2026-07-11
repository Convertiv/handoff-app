/** A mode-aware placeholder retained in the serialized navigation shell. */
export interface NavDynamicSlot {
  kind: 'components' | 'patterns' | 'token-components';
  type?: string;
}

/** A link nested within a navigation subsection. */
export interface NavMenuItem {
  title: string;
  path: string;
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

/** The current navigation payload: build-time shell plus runtime entity lists. */
export interface NavData {
  shell: SectionLink[];
  components: NavEntity[];
  patterns: NavEntity[];
  tokenSets: NavEntity[];
}
