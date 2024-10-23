export default config;
import { FileComponentsObject } from '../exporters/components/types';
import type { ColorObject, TypographyObject, AssetObject, EffectObject } from '../types';

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
  components: FileComponentsObject;
  assets: {
    icons: AssetObject[];
    logos: AssetObject[];
  };
}

export interface Breakpoints {
  [key: string]: {
    size: number;
    name: string;
  };
}

interface NextAppConfig {
  theme?: string;
  title: string;
  client: string;
  google_tag_manager: string | null | undefined;
  type_copy: string;
  type_sort: string[];
  color_sort: string[];
  breakpoints: Breakpoints;
  component_sort: string[];
  base_path: string;
  attribution: boolean;
}

export interface Config {
  dev_access_token?: string | null | undefined;
  figma_project_id?: string | null | undefined;
  integrationPath?: string;
  exportsOutputDirectory?: string;
  sitesOutputDirectory?: string;
  app?: NextAppConfig;
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

export type ClientConfig = Pick<
  Config,
  'app' | 'integration', 'exportsOutputDirectory' | 'sitesOutputDirectory' | 'assets_zip_links'
>;

export interface IntegrationObjectComponentOptions {
  cssRootClass?: string;
  tokenNameSegments?: string[];
  defaults: {
    [variantProperty: string]: string;
  };
  replace: { [variantProperty: string]: { [source: string]: string } };
};


export interface IntegrationObject {
  name: string;
  entries?: {
    integration?: string;
    templates?: string;
    bundle?: string;
  }
  options: {
    [key: string]: IntegrationObjectComponentOptions;
  };
}

declare const config: Config;

export default config;
