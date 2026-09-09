// Config defaults and client config
export { defaultConfig, getClientConfig, isMcpEnabled } from './defaults';
export type { ImageStyle } from './defaults';

// Config file loading
export { HandoffConfigError, initConfig, initConfigWithMetadata } from './loader';
export type { ConfigLoadContext } from './loader';

// Config helpers
export { defineConfig } from './helpers';

// Runtime config resolution
export { initRuntimeConfig } from './runtime';

// Config validation
export { validateConfig } from './validator';

// Registering catalog item directories under `catalog.include`
export { addToCatalog, isIncluded } from './catalog-include';
export type { AddToCatalogResult } from './catalog-include';
