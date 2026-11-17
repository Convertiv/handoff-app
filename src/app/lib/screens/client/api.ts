'use client';

import type { CollectionPage, CollectionQuery, StoredDocument } from '@handoff/screens/types';

const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

/** A failed collection request. `current` is the stored document a `409` carries. */
export class ScreenRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | undefined,
    readonly current?: StoredDocument<unknown> | null
  ) {
    super(message);
    this.name = 'ScreenRequestError';
  }
}

// The trailing slash matches the app's `trailingSlash` setting, so no request is redirected.
const collectionUrl = (screenId: string, collection: string, id?: string): string =>
  `${basePath}/api/screens/${encodeURIComponent(screenId)}/${encodeURIComponent(collection)}/${id ? `${encodeURIComponent(id)}/` : ''}`;

const request = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new ScreenRequestError('The docs app could not be reached.', 0, 'unavailable');
  }
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : `The request failed (${response.status}).`;
    throw new ScreenRequestError(
      message,
      response.status,
      typeof body.code === 'string' ? body.code : undefined,
      body.current as StoredDocument<unknown>
    );
  }
  return body as T;
};

export const listDocuments = (
  screenId: string,
  collection: string,
  query: CollectionQuery<unknown> = {}
): Promise<CollectionPage<unknown>> => {
  const params = new URLSearchParams();
  if (query.where && Object.keys(query.where).length) params.set('where', JSON.stringify(query.where));
  for (const key of ['sort', 'order', 'limit', 'cursor'] as const) {
    if (query[key] !== undefined) params.set(key, String(query[key]));
  }
  const search = params.toString();
  return request(`${collectionUrl(screenId, collection)}${search ? `?${search}` : ''}`);
};

export const readDocument = async (screenId: string, collection: string, id: string): Promise<StoredDocument<unknown> | null> => {
  try {
    return (await request<{ document: StoredDocument<unknown> }>(collectionUrl(screenId, collection, id))).document;
  } catch (error) {
    if (error instanceof ScreenRequestError && error.status === 404) return null;
    throw error;
  }
};

export const createDocument = async (screenId: string, collection: string, data: unknown, id?: string): Promise<StoredDocument<unknown>> =>
  (
    await request<{ document: StoredDocument<unknown> }>(collectionUrl(screenId, collection), {
      method: 'POST',
      body: JSON.stringify({ data, id }),
    })
  ).document;

export const writeDocument = async (
  screenId: string,
  collection: string,
  id: string,
  data: unknown,
  revision: number
): Promise<StoredDocument<unknown>> =>
  (
    await request<{ document: StoredDocument<unknown> }>(collectionUrl(screenId, collection, id), {
      method: 'PUT',
      body: JSON.stringify({ data, revision }),
    })
  ).document;

export const deleteDocument = async (screenId: string, collection: string, id: string): Promise<boolean> =>
  (await request<{ deleted: boolean }>(collectionUrl(screenId, collection, id), { method: 'DELETE' })).deleted;
