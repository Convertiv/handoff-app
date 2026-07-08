/**
 * Typed identity helper for custom asset storage adapters (mirrors `defineComponent`): a consumer
 * default-exports its result from a **server-only** module and points
 * `runtime.registry.assetStorage.module` at it. It must be its own module (not an inline
 * `defineConfig` function) so the build can trace it into the deployed registry. The default export
 * may be the adapter object, or a factory `(context) => AssetStorage` when it needs its options/env.
 */

import type { AssetStorage, AssetStorageFactory } from './types';

export function defineAssetStorage(adapter: AssetStorage): AssetStorage;
export function defineAssetStorage(factory: AssetStorageFactory): AssetStorageFactory;
export function defineAssetStorage(input: AssetStorage | AssetStorageFactory): AssetStorage | AssetStorageFactory {
  return input;
}
