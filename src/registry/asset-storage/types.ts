/**
 * Server-only asset storage contract for object-backed providers (Vercel Blob + custom
 * {@link defineAssetStorage} modules), so callers need no provider-specific logic. The built-in
 * `database` provider is the inline default: bytes live in the `asset_blobs.content` bytea column,
 * read/written directly by the registry, so it needs no adapter. Object providers record a
 * `storageRef` + provider id so reads resolve back through whichever provider stored the blob.
 */

/** Input for storing one content-addressed blob. */
export interface AssetStorageInput {
  /** SHA-256 of the bytes (hex), the content identity, usable as a stable object key. */
  hash: string;
  bytes: Buffer;
  contentType: string;
  size: number;
}

/**
 * How a provider returns stored content: raw bytes, a readable stream, or a signed/redirect URL the
 * client can fetch directly (used to avoid routing large payloads through the serverless function).
 */
export type AssetStorageReadResult =
  | { kind: 'bytes'; bytes: Buffer; contentType?: string }
  | { kind: 'stream'; stream: NodeJS.ReadableStream; contentType?: string }
  | { kind: 'redirect'; url: string };

/** The pluggable storage adapter contract for object-backed asset providers. */
export interface AssetStorage {
  /** Store one blob and return the reference to persist on its `asset_blobs` row. */
  put(input: AssetStorageInput): Promise<{ storageRef: string }>;
  /** Resolve stored content by its `storageRef`. */
  get(storageRef: string): Promise<AssetStorageReadResult>;
  /** Delete stored content by its `storageRef`. Should be retryable/idempotent. */
  delete(storageRef: string): Promise<void>;
}

/** Context passed to a custom adapter factory: its non-secret config options + the process env. */
export interface AssetStorageContext {
  /** Non-secret options from `runtime.registry.assetStorage.options` (bucket env-var names, region, …). */
  options: Record<string, unknown>;
  /** The process environment. Read secret *values* here by the env-var *names* carried in options. */
  env: NodeJS.ProcessEnv;
}

/** A custom adapter may export the adapter directly or a factory that builds it from its context. */
export type AssetStorageFactory = (context: AssetStorageContext) => AssetStorage | Promise<AssetStorage>;
