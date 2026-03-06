export interface PlaygroundComponent {
  id: string;
  title: string;
  description: string;
  type: string;
  group: string;
  image: string;
  figma: string;
  categories: string[];
  tags: string[];
  properties: Record<string, any>;
  previews: {
    [key: string]: {
      title: string;
      values: Record<string, any>;
      url: string;
    };
  };
  format: string;
  code: string;
  html: string;
  data?: Record<string, any>;
  rendered?: string;
  options?: {
    preview?: {
      groupBy?: string;
      /** Optional URL or path to a CSS file that overrides styles in the component page preview */
      css?: string;
    };
  };
}

export interface SelectedPlaygroundComponent extends PlaygroundComponent {
  order: number;
  quantity: number;
  uniqueId: string;
}

/** Handoff pattern format exported from Playground (matches PatternObject without id/path). */
export interface PlaygroundPageExport {
  title: string;
  description: string;
  group: string;
  components: string[];
  previews: { [key: string]: { title: string; values: Record<string, any>[] } };
}
