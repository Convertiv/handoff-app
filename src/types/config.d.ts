export default config;
import { DocumentComponentsObject } from 'figma-exporter/src/exporters/components';
import type { ColorObject, TypographyObject, AssetObject, EffectObject } from './figma-exporter/src/types';

export interface ImageStyle {
  name: string;
  style: string;
  height: number;
  width: number;
  description: string;
}

export interface Integration {
  name: string;
  version: string;
}

export interface FigmaSearch {
  options: {
    shared?: {
      defaults: {
        [variantProperty: string]: string
      };
    };
    transformer?: {
      cssRootProperty?: string,
      tokenNameSegments?: string[],
      replace: {
        [variantProperty: string]: {
          [source: string]: string;
        };
      };
    };
  };
  definitions: string[];
}

export interface ComponentSizeMap {
  figma: string;
  css: string;
}

export interface ExportResult {
  design: {
    color: ColorObject[];
    effect: EffectObject[];
    typography: TypographyObject[];
  };
  components: DocumentComponentsObject;
  assets: {
    icons: AssetObject[];
    logos: AssetObject[];
  };
}

export interface Config {
  dev_access_token?: string | null | undefined;
  figma_project_id?: string | null | undefined;
  title: string;
  client: string;
  google_tag_manager: string | null | undefined;
  integration?: Integration;
  favicon?: string;
  poweredBy?: boolean;
  figma: FigmaSearch;
  /**
   * @default "/logo.svg"
   */
  logo?: string;
  theme?: string;
  type_sort: string[];
  type_copy: string;
  color_sort: string[];
  component_sort: string[];
  /**
   * @default { icons: "/icons.zip", logos: "/logos.zip" }
   */
  assets_zip_links?: {
    /**
     * @default "/icons.zip"
     */
    icons?: string;
    /**
     * @default "/logos.zip"
     */
    logos?: string;
  };
}

declare const config: Config;

export default config;
