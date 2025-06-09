import { BuildOptions } from 'esbuild';
import { Types as HandoffTypes } from 'handoff-core';
import { InlineConfig } from 'vite';
import { SlotMetadata } from '../transformers/preview/component';
import { ComponentListObject, TransformComponentTokensResult } from '../transformers/preview/types';
import { ValidationResult } from '../types';
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
export interface TransformerConfig {
    /**
     * Reference to the transformer function from CoreTransformers
     * @example transformer: CoreTransformers.ScssTransformer
     */
    transformer: (options?: HandoffTypes.IHandoffTransformerOptions) => HandoffTypes.IHandoffTransformer;
    outDir: string;
    format: string;
}
export interface PipelineConfig {
    /**
     * List of transformers to be used in the build pipeline
     * Each transformer should specify the transformer function, output directory, and format
     * @example
     * ```typescript
     * transformers: [
     *   {
     *     transformer: Transformers.ScssTransformer,
     *     outDir: 'scss',
     *     format: 'scss'
     *   }
     * ]
     * ```
     */
    transformers?: TransformerConfig[];
}
export interface Breakpoints {
    mobile: {
        size: number;
        name: string;
    };
    tablet: {
        size: number;
        name: string;
    };
    desktop: {
        size: number;
        name: string;
    };
}
export interface NextAppConfig {
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
    ports?: {
        app: number;
        websocket: number;
    };
}
export interface Config {
    dev_access_token?: string | null | undefined;
    figma_project_id?: string | null | undefined;
    exportsOutputDirectory?: string;
    sitesOutputDirectory?: string;
    useVariables?: boolean;
    app?: NextAppConfig;
    /**
     * Configuration for the build pipeline
     */
    pipeline?: PipelineConfig;
    /**
     * Configuration for entry points to assets and components that will be built
     */
    entries?: {
        /**
         * Path to the main SCSS entry file
         * @example "styles/main.scss"
         */
        scss?: string;
        /**
         * Path to the main JavaScript entry file
         * @example "scripts/main.js"
         */
        js?: string;
        /**
         * Array of component paths to be included in the build
         * @example ["components/button", "components/input"]
         */
        components?: string[];
    };
    /**
     * Configuration for asset zip file download links
     * @default { icons: "/icons.zip", logos: "/logos.zip" }
     */
    assets_zip_links?: {
        /**
         * Path to the icons zip file
         * @default "/icons.zip"
         */
        icons?: string;
        /**
         * Path to the logos zip file
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
         *     messages: ['No accessibility issues found']
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
        /**
         * Optional hook to override the SSR build configuration used in the ssrRenderPlugin
         * @param config - The default esbuild configuration
         * @returns Modified esbuild configuration
         * @example
         * ```typescript
         * ssrBuildConfig: (config) => {
         *   ... // Modify the esbuild config as needed
         *   return config;
         * }
         * ```
         */
        ssrBuildConfig?: (config: BuildOptions) => BuildOptions;
        /**
         * Optional hook to override the client-side build configuration used in the ssrRenderPlugin
         * @param config - The default esbuild configuration
         * @returns Modified esbuild configuration
         * @example
         * ```typescript
         * clientBuildConfig: (config) => {
         *   ... // Modify the esbuild config as needed
         *   return config;
         * }
         * ```
         */
        clientBuildConfig?: (config: BuildOptions) => BuildOptions;
        /**
         * Optional hook to specify which export property contains the schema
         * @param exports - The module exports object containing the schema
         * @returns The schema object from the exports
         * @example
         * ```typescript
         * getSchemaFromExports: (exports) => exports.customSchema || exports.default
         * ```
         */
        getSchemaFromExports?: (exports: any) => any;
        /**
         * Optional hook to transform the schema into properties
         * @param schema - The schema object to transform
         * @returns The transformed properties object
         */
        schemaToProperties?: (schema: any) => {
            [key: string]: SlotMetadata;
        };
        /**
         * Optional hook to override the JavaScript Vite configuration
         * @param config - The default Vite configuration
         * @returns Modified Vite configuration
         * @example
         * ```typescript
         * jsBuildConfig: (config) => {
         *   ... // Modify the Vite config as needed
         *   return config;
         * }
         * ```
         */
        jsBuildConfig?: (config: InlineConfig) => InlineConfig;
        /**
         * Optional hook to override the CSS Vite configuration
         * @param config - The default Vite configuration
         * @returns Modified Vite configuration
         * @example
         * ```typescript
         * cssBuildConfig: (config) => {
         *   ... // Modify the Vite config as needed
         *   return config;
         * }
         * ```
         */
        cssBuildConfig?: (config: InlineConfig) => InlineConfig;
        /**
         * Optional hook to override the HTML Vite configuration
         * @param config - The default Vite configuration
         * @returns Modified Vite configuration
         * @example
         * ```typescript
         * htmlBuildConfig: (config) => {
         *   ... // Modify the Vite config as needed
         *   return config;
         * }
         * ```
         */
        htmlBuildConfig?: (config: InlineConfig) => InlineConfig;
    };
}
export declare type ClientConfig = Pick<Config, 'app' | 'exportsOutputDirectory' | 'sitesOutputDirectory' | 'assets_zip_links' | 'useVariables'>;
export interface IntegrationObjectComponentOptions {
    cssRootClass?: string;
    tokenNameSegments?: string[];
    defaults: {
        [variantProperty: string]: string;
    };
    replace: {
        [variantProperty: string]: {
            [source: string]: string;
        };
    };
}
export interface IntegrationObject {
    entries?: {
        integration?: string;
        bundle?: string;
        templates?: string;
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
