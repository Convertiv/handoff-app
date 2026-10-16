/**
 * Server-only asset storage contract for custom {@link defineStorageProvider} object storage modules.
 * The built-in `database` provider is the inline default: bytes live in the `asset_blobs.content`
 * bytea column, read/written directly by the registry, so it needs no module. Object providers
 * record a `storageRef` + provider id so reads resolve back through whichever provider stored the
 * blob.
 */

/** Input for storing one content-addressed blob. */
export interface StorageInput {
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
export type StorageReadResult =
  | { kind: 'bytes'; bytes: Buffer; contentType?: string }
  | { kind: 'stream'; stream: NodeJS.ReadableStream; contentType?: string }
  | { kind: 'redirect'; url: string };

/** Input for a direct upload of one blob from the CLI to storage. */
export interface AssetUploadInput {
  /** SHA-256 of the bytes (hex). */
  hash: string;
  size: number;
  contentType: string;
}

/** A signed URL the CLI sends the blob to with `PUT` and the given headers. */
export interface AssetUpload {
  url: string;
  headers?: Record<string, string>;
  /** The reference to persist on the blob's `asset_blobs` row after the upload. */
  storageRef: string;
}

/** The pluggable storage contract for object-backed asset providers. */
export interface StorageProvider {
  /** Store one blob and return the reference to persist on its `asset_blobs` row. */
  put(input: StorageInput): Promise<{ storageRef: string }>;
  /**
   * Return a signed URL so the CLI uploads the blob directly to storage instead of through the
   * registry, which avoids serverless request size limits. The URL must make storage reject bytes
   * that do not match `hash`, for example with a signed SHA-256 checksum header.
   */
  createUpload?(input: AssetUploadInput): Promise<AssetUpload>;
  /** Resolve stored content by its `storageRef`. */
  get(storageRef: string): Promise<StorageReadResult>;
  /** Delete stored content by its `storageRef`. Should be retryable/idempotent. */
  delete(storageRef: string): Promise<void>;
}

/** Context passed to a custom provider factory: its config options and the process env. */
export interface StorageProviderContext {
  /** `runtime.registry.assetStorage.options`, with each `fromEnv()` reference replaced by its value. */
  options: Record<string, unknown>;
  /** The process environment. */
  env: NodeJS.ProcessEnv;
}

/** A custom provider module may export the provider directly or a factory that builds it from its context. */
export type StorageProviderFactory = (context: StorageProviderContext) => StorageProvider | Promise<StorageProvider>;
