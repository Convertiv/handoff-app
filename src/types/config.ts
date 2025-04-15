import { FileComponentsObject } from '../exporters/components/types';
import { ComponentListObject, TransformComponentTokensResult } from '../transformers/preview/types';
import type { AssetObject, ColorObject, EffectObject, TypographyObject } from '../types';

/**
 * Represents the result of a single validation check
 */
export interface ValidationResult {
  /**
   * Description of what this validation check does
   */
  description: string;
  /**
   * Whether the validation passed or failed
   */
  passed: boolean;
  /**
   * Optional messages providing more details about the validation result
   */
  messages?: string[];
  /**
   * Optional timestamp of when the validation was performed
   */
  timestamp?: string;
}

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
  mobile: { size: number; name: string };
  tablet: { size: number; name: string };
  desktop: { size: number; name: string };
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
  useVariables?: boolean;
  app?: NextAppConfig;
  entries?: {
    scss?: string;
    js?: string;
    components?: string[];
  };
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
  /**
   * Configuration hooks for extending functionality
   */
  hooks?: {
    /**
     * Optional validation callback for components
     * @param component - The component instance to validate
     * @returns A record of validation results where keys are validation types and values are detailed validation results
     * @example
     * ```typescript
     * validateComponent: async (component) => ({
     *   a11y: {
     *     description: 'Accessibility validation check',
     *     passed: true,
     *     messages: ['All interactive elements have proper ARIA labels']
     *   },
     *   responsive: {
     *     description: 'Responsive design validation',
     *     passed: false,
     *     messages: ['Component breaks at mobile breakpoint']
     *   }
     * })
     * ```
     */
    validateComponent?: (component: TransformComponentTokensResult) => Promise<Record<string, ValidationResult>>;
  };
}

export type ClientConfig = Pick<
  Config,
  'app' | 'integrationPath' | 'exportsOutputDirectory' | 'sitesOutputDirectory' | 'assets_zip_links' | 'useVariables'
>;

export interface IntegrationObjectComponentOptions {
  cssRootClass?: string;
  tokenNameSegments?: string[];
  defaults: {
    [variantProperty: string]: string;
  };
  replace: { [variantProperty: string]: { [source: string]: string } };
}

export interface IntegrationObject {
  name: string;
  entries?: {
    integration?: string; // scss
    bundle?: string; // js
    templates?: string;
    // styles?: string;
    components: {
      [id: string]: {
        [version: string]: ComponentListObject;
      };
    };
  };
  options: {
    [key: string]: IntegrationObjectComponentOptions;
  };
}

declare const config: Config;

export default config;
