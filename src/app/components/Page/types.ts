export interface PagePreviewObject {
  id: string;
  title: string;
  description: string;
  group: string;
  image?: string;
  figma?: string;
  should_do?: string[];
  should_not_do?: string[];
  components: string[];
  previews: {
    [key: string]: {
      title: string;
      values: Record<string, any>[];
      url: string;
    };
  };
  path: string;
}
