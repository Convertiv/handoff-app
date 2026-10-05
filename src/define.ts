/**
 * Define helpers for custom server modules. This entry point has no runtime dependencies, so a module
 * that imports it does not pull the CLI into the registry bundle.
 */
export { defineAiProvider } from './ai/define';
export type { AiProvider, AiProviderContext, AiProviderFactory } from './ai/types';
export { defineAssetStorage } from './registry/asset-storage/define';
export type {
  AssetStorage,
  AssetStorageContext,
  AssetStorageFactory,
  AssetStorageInput,
  AssetStorageReadResult,
} from './registry/asset-storage/types';
export { defineEmailProvider } from './registry/email/define';
export type { EmailMessage, EmailProvider, EmailProviderContext, EmailProviderFactory } from './registry/email/types';
