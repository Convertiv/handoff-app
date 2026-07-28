import { BuildOptions } from 'esbuild';
import type Handlebars from 'handlebars';
import { Types as HandoffTypes } from 'handoff-core';
import { InlineConfig } from 'vite';
import { SlotMetadata } from '../transformers/preview/component';
import { ComponentListObject, PageListObject, PatternListObject, TransformComponentTokensResult } from '../transformers/preview/types';
import { ValidationResult } from './preview';

export interface ImageStyle {
  name: string;
  style: string;
  height: number;
  width: number;
  description: string;
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
  mobile: { size: number; name: string };
  tablet: { size: number; name: string };
  desktop: { size: number; name: string };
}

/** Context passed to the `registerHandlebarsHelpers` config hook after built-in helpers (`field`, `eq`) are registered for a preview render. */
export type RegisterHandlebarsHelpersContext = {
  handlebars: typeof Handlebars;
  componentId: string;
  properties: { [key: string]: SlotMetadata };
  injectFieldWrappers: boolean;
};

export interface NextAppConfig {
  theme?: string;
  title: string;
  client: string;
  google_tag_manager?: string | null | undefined;
  googleTagManager?: string | null | undefined;
  type_copy?: string;
  typeCopy?: string;
  type_sort?: string[];
  typeSort?: string[];
  color_sort?: string[];
  colorSort?: string[];
  breakpoints: Breakpoints;
  component_sort?: string[];
  componentSort?: string[];
  base_path?: string;
  basePath?: string;
  attribution: boolean;
  ports?: {
    app: number;
    websocket: number;
  };
}

/**
 * Configuration for entry points to assets and components that will be built.
 */
export interface ConfigEntries {
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
  /**
   * Array of pattern paths to be included in the build.
   * Patterns compose multiple component previews into single-page views.
   * @example ["patterns/hero-section", "patterns"]
   */
  patterns?: string[];
}

/** Runtime mode. Resolved solely from `runtime.mode`; never inferred from env vars or connection settings. */
export type RuntimeMode = 'workspace' | 'registry';

/** Format used when synthesizing local workspace declarations. */
export type DeclarationFormat = 'ts' | 'js' | 'cjs' | 'json';

/**
 * User-facing `runtime` configuration block. A single optional block that selects the runtime
 * mode and carries mode-specific host/connection settings.
 *
 * Note: this is the authored shape. {@link RuntimeConfig} is the separate, resolved post-discovery
 * shape used internally by the build/runtime.
 */
export interface HandoffRuntimeConfig {
  /**
   * The sole determinant of runtime mode. Defaults to `'workspace'` when omitted.
   * Mode is never inferred from environment variables, database settings, or token presence.
   */
  mode?: RuntimeMode;
  /** Workspace-mode settings. */
  workspace?: {
    entries?: ConfigEntries;
    declarationFormat?: DeclarationFormat;
  };
  /** Registry-mode host settings. Env-var values are stored as names, never as secrets. */
  registry?: {
    /** Name of the env var holding the database URL. @default "DATABASE_URL" */
    databaseUrlEnv?: string;
    /**
     * @deprecated Fixed registry secrets are no longer authorized. This option remains parseable
     * only so existing configuration files do not break.
     */
    apiTokenEnv?: string;
    database?: {
      /**
       * PostgreSQL is the supported database. `driver` selects the built-in connection driver — how
       * to connect, not which engine — over the same package-owned Postgres schema and migrations.
       * @default "pg"
       */
      driver?: 'pg' | 'neon';
    };
    /**
     * Where published asset blobs (icons/logos/fonts/sprites/archives) are stored. Defaults to the
     * built-in PostgreSQL `bytea` store when omitted. Secrets are never persisted here - only the
     * *names* of the env vars their values are read from at request time.
     */
    assetStorage?: {
      /**
       * Active storage provider for new uploads. `database` keeps bytes inline in Postgres; use the
       * pre-packaged `vercel-blob` adapter or a `custom` module for object storage.
       * @default "database"
       */
      adapter?: 'database' | 'vercel-blob' | 'custom';
      /** For `adapter: "custom"` - server-only module path default-exporting a `defineAssetStorage` adapter. */
      module?: string;
      /** For `adapter: "vercel-blob"` - env var name holding the Blob read/write token. @default "BLOB_READ_WRITE_TOKEN" */
      tokenEnv?: string;
      /** Max bytes kept inline in the database `bytea` column (larger uploads are rejected). @default 4194304 */
      maxInlineBytes?: number;
      /** Non-secret adapter options (bucket env-var names, region, a custom `providerId`, …). */
      options?: Record<string, unknown>;
    };
  };
  /**
   * Connected-workspace settings pointing at a remote registry. A connected workspace is
   * `mode: 'workspace'` plus this block — it is not a third runtime mode.
   */
  registryConnection?: {
    url?: string;
    /** @default "HANDOFF_REGISTRY_URL" */
    urlEnv?: string;
    /** @default "HANDOFF_REGISTRY_ACCESS_TOKEN" */
    accessTokenEnv?: string;
  };
}

export interface Config {
  dev_access_token?: string | null | undefined;
  devAccessToken?: string | null | undefined;
  figma_project_id?: string | null | undefined;
  figmaProjectId?: string | null | undefined;
  exportsOutputDirectory?: string;
  sitesOutputDirectory?: string;
  useVariables?: boolean;
  /**
   * Configuration for React component docs generation (handoff-docgen).
   */
  reactDocgen?: {
    /**
     * Maximum recursion depth for nested type traversal.
     * @default 7
     */
    maxDepth?: number;
    /**
     * Directory names to exclude while scanning for components.
     * @default ["dist", "build", ".next"]
     */
    excludeDirectories?: string[];
  };
  app?: NextAppConfig;
  /**
   * Configuration for the build pipeline
   */
  pipeline?: PipelineConfig;
  /**
   * Runtime configuration. `runtime.mode` is the sole determinant of runtime mode
   * (`workspace` | `registry`), defaulting to `workspace` when omitted.
   */
  runtime?: HandoffRuntimeConfig;
  /**
   * Configuration for entry points to assets and components that will be built
   */
  entries?: ConfigEntries;
  /**
   * Override URLs for the asset zip download links. When unset, each link defaults to the
   * basePath-aware asset route `{basePath}/api/docs/assets/{collection}/{collection}.zip`, served by
   * the docs read API in every runtime mode (from the DB in registry mode, from statically
   * materialized files in a static export).
   */
  assets_zip_links?: {
    /**
     * Override URL for the icons zip. Defaults to `/api/docs/assets/icons/icons.zip` (basePath-aware).
     */
    icons?: string;
    /**
     * Override URL for the logos zip. Defaults to `/api/docs/assets/logos/logos.zip` (basePath-aware).
     */
    logos?: string;
  };
  assetsZipLinks?: {
    icons?: string;
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
    schemaToProperties?: (schema: any) => { [key: string]: SlotMetadata };

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

    /**
     * Optional hook invoked after Handoff registers built-in Handlebars helpers for
     * component preview HTML. Use `context.handlebars.registerHelper` to add or
     * replace helpers. Called once per preview render (per variation and inspect mode).
     *
     * @param context - Handlebars runtime, component id/properties, and whether
     *   inspect field wrappers are enabled for this render.
     * @example
     * ```typescript
     * registerHandlebarsHelpers: ({ handlebars, componentId }) => {
     *   handlebars.registerHelper('upperId', () => componentId.toUpperCase());
     * }
     * ```
     */
    registerHandlebarsHelpers?: (context: RegisterHandlebarsHelpersContext) => void;
  };
}

/**
 * Non-secret runtime values projected to the browser. Only the resolved {@link RuntimeMode}
 * crosses to the client; secrets and connection values never do.
 */
export interface ClientRuntimeConfig {
  mode: RuntimeMode;
  /**
   * True when the runtime is a connected workspace (`mode: 'workspace'` plus a resolvable
   * `registryConnection` URL). Non-secret: it never carries the URL or token value, only whether a
   * connection is configured. Drives the workspace-only publish affordance in the docs UI.
   */
  connected: boolean;
}

export type ClientConfig = Pick<Config, 'app' | 'exportsOutputDirectory' | 'sitesOutputDirectory' | 'assets_zip_links' | 'useVariables'> & {
  runtime: ClientRuntimeConfig;
};

export interface RuntimeConfigComponentOptions {
  cssRootClass?: string;
  tokenNameSegments?: string[];
  defaults: {
    [variantProperty: string]: string;
  };
  replace: { [variantProperty: string]: { [source: string]: string } };
}

export interface ConfigFileEntry {
  kind: string;
  entityId: string;
}

export interface RuntimeConfig {
  entries?: {
    scss?: string;
    js?: string;
    templates?: string;
    components: {
      [id: string]: ComponentListObject;
    };
    patterns: {
      [id: string]: PatternListObject;
    };
    pages: {
      [id: string]: PageListObject;
    };
  };
  options: {
    [key: string]: RuntimeConfigComponentOptions;
  };
}

declare const config: Config;

export default config;
