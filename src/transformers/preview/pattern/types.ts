export type PatternPreview = {
  title: string;
  values: Record<string, any>[];
  url?: string;
};

export type PatternObject = {
  title: string;
  description: string;
  group: string;
  image?: string;
  figma?: string;
  should_do?: string[];
  should_not_do?: string[];
  /** Ordered array of component IDs that compose this pattern */
  components: string[];
  /** Preview variations keyed by preview ID */
  previews: { [key: string]: PatternPreview };
  /** Optional pattern-level configuration */
  options?: {
    /** Optional URL or path to a CSS file that overrides styles in all pattern previews */
    css?: string;
  };
};

export type PatternListObject = {
  id: string;
  path: string;
} & PatternObject;

export type TransformPatternResult = {
  id: string;
  title: string;
  description: string;
  group: string;
  image?: string;
  figma?: string;
  should_do?: string[];
  should_not_do?: string[];
  components: string[];
  previews: { [key: string]: PatternPreview };
  options?: {
    /** Optional URL or path to a CSS file that overrides styles in all pattern previews */
    css?: string;
  };
};
