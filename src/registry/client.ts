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
      throw new RegistryClientError(
        `Could not reach the registry at ${url}: ${error instanceof Error ? error.message : 'network error'}.`
      );
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
  };
};

/** A bound registry client instance. */
export type RegistryClient = ReturnType<typeof createRegistryClient>;
