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
  code: string;
  html: string;
  data?: Record<string, any>;
  rendered?: string;
}

export interface SelectedPlaygroundComponent extends PlaygroundComponent {
  order: number;
  quantity: number;
  uniqueId: string;
}
