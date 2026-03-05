export type PagePreview = {
  title: string;
  values: Record<string, any>[];
  url?: string;
};

export type PageObject = {
  title: string;
  description: string;
  group: string;
  image?: string;
  figma?: string;
  should_do?: string[];
  should_not_do?: string[];
  /** Ordered array of component IDs that compose this page */
  components: string[];
  /** Preview variations keyed by preview ID */
  previews: { [key: string]: PagePreview };
  /** Optional page-level configuration */
  options?: {
    /** Optional URL or path to a CSS file that overrides styles in all page previews */
    css?: string;
  };
};

export type PageListObject = {
  id: string;
  path: string;
} & PageObject;

export type TransformPageResult = {
  id: string;
  title: string;
  description: string;
  group: string;
  image?: string;
  figma?: string;
  should_do?: string[];
  should_not_do?: string[];
  components: string[];
  previews: { [key: string]: PagePreview };
  options?: {
    /** Optional URL or path to a CSS file that overrides styles in all page previews */
    css?: string;
  };
};
