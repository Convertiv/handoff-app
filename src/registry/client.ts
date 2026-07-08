/**
 * Shared registry HTTP client.
 *
 * One client both the CLI and the app use to talk to a remote registry over its HTTP API. It owns
 * the transfer endpoint URL shape, bearer-token auth, and the `{ data | error, meta }` envelope
 * decoding, mapping registry error responses to an actionable {@link RegistryClientError} so callers
 * surface a clear message instead of a raw fetch failure. Transport is the global `fetch` (Node 18+
 * and the browser both provide it), so this module stays runtime-agnostic.
 */

import type { CheckoutPayload, TransferEntityKind, TransferPackage } from './transfer';
import type { TokenSetCheckoutPayload, TokenSetSummary, TokenSetTransferPackage } from './tokens/transfer';
import type { AssetCollectionCheckoutPayload, AssetCollectionSummary, AssetCollectionTransferPackage } from './assets/transfer';

/** Encode a token set id for the catch-all transfer route, preserving `/` between segments. */
const encodeSetIdPath = (id: string): string =>
  id
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

/** Standard registry response envelope. */
export interface RegistryEnvelope<T = unknown> {
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  meta?: Record<string, unknown>;
}

/**
 * A failed registry request. Carries the HTTP status and (when the server returned the registry
 * error envelope) the registry error `code`/`details`, so callers can tailor messaging.
 */
export class RegistryClientError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, options: { status?: number; code?: string; details?: Record<string, unknown> } = {}) {
    super(message);
    this.name = 'RegistryClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

export interface RegistryClientOptions {
  /** Remote registry base URL (may include a configured basePath). */
  baseUrl: string;
  /** Bearer token sent on mutating requests. */
  accessToken: string;
}

/** Strip a single trailing slash so URL joining never doubles separators. */
const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

/**
 * Describe a transport-level fetch failure. `fetch` reports a generic "fetch failed"; the actionable
 * detail (ECONNREFUSED / ECONNRESET / socket closed) lives on `error.cause`, so surface it.
 */
const describeNetworkError = (url: string, error: unknown): string => {
  const message = error instanceof Error ? error.message : 'network error';
  const cause = (error as { cause?: { code?: string; message?: string } } | undefined)?.cause;
  const detail = cause?.code || cause?.message;
  return `Could not reach the registry at ${url}: ${message}${detail ? ` (${detail})` : ''}.`;
};

/**
 * Build a registry HTTP client bound to one connection. Methods reject with a
 * {@link RegistryClientError} on transport failure, non-2xx responses, or an error envelope.
 */
export const createRegistryClient = ({ baseUrl, accessToken }: RegistryClientOptions) => {
  const root = trimTrailingSlash(baseUrl);

  const request = async <T>(method: string, path: string, body?: unknown): Promise<RegistryEnvelope<T>> => {
    const url = `${root}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      throw new RegistryClientError(describeNetworkError(url, error));
    }

    let envelope: RegistryEnvelope<T> = {};
    const text = await response.text();
    if (text) {
      try {
        envelope = JSON.parse(text) as RegistryEnvelope<T>;
      } catch {
        // Non-JSON body (e.g. an HTML error page) — fall through to the status-based error below.
      }
    }

    if (!response.ok || envelope.error) {
      const code = envelope.error?.code;
      const message =
        envelope.error?.message || `Registry request failed (${response.status} ${response.statusText}).`;
      throw new RegistryClientError(message, { status: response.status, code, details: envelope.error?.details });
    }

    return envelope;
  };

  return {
    /** Publish (`PUT`) an entity's package to the registry transfer endpoint. */
    publish(kind: TransferEntityKind, id: string, pkg: TransferPackage): Promise<RegistryEnvelope> {
      return request('PUT', `/api/registry/transfer/${kind}/${encodeURIComponent(id)}`, pkg);
    },
    /** Checkout (`GET`) an entity's normalized record + registry-safe source files. */
    async checkout(kind: TransferEntityKind, id: string): Promise<CheckoutPayload> {
      const envelope = await request<CheckoutPayload>(
        'GET',
        `/api/registry/transfer/${kind}/${encodeURIComponent(id)}`
      );
      if (!envelope.data) {
        throw new RegistryClientError(`The registry returned no data for ${kind} "${id}".`);
      }
      return envelope.data;
    },
    /** List the registry's token sets (id + kind + source hash) for skip-unchanged / bulk checkout. */
    async listTokenSets(): Promise<TokenSetSummary[]> {
      const envelope = await request<{ sets: TokenSetSummary[] }>('GET', '/api/registry/transfer/tokens');
      return envelope.data?.sets ?? [];
    },
    /** Publish (`PUT`) one token set's package (record + generated artifacts). */
    publishTokens(pkg: TokenSetTransferPackage): Promise<RegistryEnvelope> {
      return request('PUT', `/api/registry/transfer/tokens/${encodeSetIdPath(pkg.id)}`, pkg);
    },
    /** Checkout (`GET`) one token set's record + generated artifacts. */
    async checkoutTokens(id: string): Promise<TokenSetCheckoutPayload> {
      const envelope = await request<TokenSetCheckoutPayload>('GET', `/api/registry/transfer/tokens/${encodeSetIdPath(id)}`);
      if (!envelope.data) {
        throw new RegistryClientError(`The registry returned no data for token set "${id}".`);
      }
      return envelope.data;
    },
    /** List the registry's asset collections (collection + source hash) for skip-unchanged / bulk checkout. */
    async listAssetCollections(): Promise<AssetCollectionSummary[]> {
      const envelope = await request<{ collections: AssetCollectionSummary[] }>('GET', '/api/registry/transfer/assets');
      return envelope.data?.collections ?? [];
    },
    /** Ask which of the given content hashes the registry does not yet have (the blobs to upload). */
    async assetBlobHaveCheck(hashes: string[]): Promise<string[]> {
      const envelope = await request<{ missing: string[] }>('POST', '/api/registry/transfer/assets/blobs/have', { hashes });
      return envelope.data?.missing ?? [];
    },
    /** Upload one content-addressed blob (binary-safe body). Idempotent: re-uploading an existing hash no-ops. */
    async uploadAssetBlob(hash: string, contentType: string, bytes: Buffer): Promise<void> {
      const url = `${root}/api/registry/transfer/assets/blobs/${encodeURIComponent(hash)}`;
      // Send a Blob, not a Buffer/Uint8Array: under Next `trailingSlash: true` this PUT is
      // 308-redirected and undici must re-send the body; a typed-array body's ArrayBuffer is detached
      // after the first send ("slice on a detached ArrayBuffer"), but a Blob is re-readable.
      const body = new Blob([new Uint8Array(bytes)] as unknown as BlobPart[]);
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType || 'application/octet-stream',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body,
        });
      } catch (error) {
        throw new RegistryClientError(describeNetworkError(url, error));
      }
      if (!response.ok) {
        let code: string | undefined;
        let message = `Blob upload failed (${response.status} ${response.statusText}).`;
        try {
          const parsed = JSON.parse(await response.text());
          code = parsed?.error?.code;
          message = parsed?.error?.message || message;
        } catch {
          // Non-JSON error body; keep the status-based message.
        }
        throw new RegistryClientError(message, { status: response.status, code });
      }
    },
    /** Download one blob's raw bytes by hash (follows any provider redirect). */
    async downloadAssetBlob(hash: string): Promise<Buffer> {
      const url = `${root}/api/registry/transfer/assets/blobs/${encodeURIComponent(hash)}`;
      let response: Response;
      try {
        response = await fetch(url, {
          headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        });
      } catch (error) {
        throw new RegistryClientError(describeNetworkError(url, error));
      }
      if (!response.ok) {
        throw new RegistryClientError(`Blob download failed for "${hash}" (${response.status} ${response.statusText}).`, {
          status: response.status,
        });
      }
      return Buffer.from(await response.arrayBuffer());
    },
    /** Publish (`PUT`) one asset collection's manifest (blobs must already be uploaded). */
    publishAssetManifest(pkg: AssetCollectionTransferPackage): Promise<RegistryEnvelope> {
      return request('PUT', `/api/registry/transfer/assets/${encodeURIComponent(pkg.collection)}`, pkg);
    },
    /** Checkout (`GET`) one asset collection's manifest. */
    async checkoutAssetCollection(collection: string): Promise<AssetCollectionCheckoutPayload> {
      const envelope = await request<AssetCollectionCheckoutPayload>('GET', `/api/registry/transfer/assets/${encodeURIComponent(collection)}`);
      if (!envelope.data) {
        throw new RegistryClientError(`The registry returned no data for asset collection "${collection}".`);
      }
      return envelope.data;
    },
  };
};

/** A bound registry client instance. */
export type RegistryClient = ReturnType<typeof createRegistryClient>;
