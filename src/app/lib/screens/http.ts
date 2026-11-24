import type { NextApiRequest, NextApiResponse } from 'next';
import { createCollectionStore } from '@handoff/screens/store';
import { ScreenDataError, type CollectionQuery } from '@handoff/screens/types';
import { allowApiMethods } from '../api/methods';
import { singleQueryValue } from '../api/query';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { findCollection, findServedScreen, resolveCollectionsBackend, screenPermissions, type ScreenCaller } from './server';

/**
 * `/api/screens/<screen>/<collection>/[id]`: the collection API that the `useCollection` and
 * `useDocument` hooks call. The same requests work in both modes; only the backing and the
 * authorization differ.
 *
 * - `GET` lists (`where` as JSON, `sort`, `order`, `limit`, `cursor`) or reads one document.
 * - `POST` creates (`{ data, id? }`), `PUT <id>` writes (`{ data, revision? }`), `DELETE <id>` removes
 *   (`?revision=`).
 * - A stale `revision` answers `409` with the current document, so a client can resolve the conflict.
 */

const STATUS: Record<ScreenDataError['code'], number> = {
  not_found: 404,
  conflict: 409,
  invalid: 400,
  forbidden: 403,
  too_large: 413,
  unavailable: 503,
};

const sendError = (res: NextApiResponse, status: number, code: string, error: string, extra: Record<string, unknown> = {}): void => {
  res.status(status).json({ error, code, ...extra });
};

const readQuery = (req: NextApiRequest): CollectionQuery<unknown> => {
  const where = singleQueryValue(req.query.where);
  let parsedWhere: unknown;
  if (where) {
    try {
      parsedWhere = JSON.parse(where);
    } catch {
      throw new ScreenDataError('invalid', '`where` must be a JSON object of field values.');
    }
  }
  const limit = singleQueryValue(req.query.limit);
  return {
    where: parsedWhere as CollectionQuery<unknown>['where'],
    sort: singleQueryValue(req.query.sort) as CollectionQuery<unknown>['sort'],
    order: singleQueryValue(req.query.order) as CollectionQuery<unknown>['order'],
    limit: limit ? Number(limit) : undefined,
    cursor: singleQueryValue(req.query.cursor),
  };
};

/** The registry session user; `undefined` after an auth failure was already answered. */
const resolveCaller = async (req: NextApiRequest, res: NextApiResponse, mutation: boolean): Promise<ScreenCaller | undefined> => {
  if (getServerRuntimeConfig().mode !== 'registry') return null;
  // Lazy, so a workspace never loads the registry auth and database packages.
  const { prepareRegistryApi } = await import('../auth/api');
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation });
  return context?.user ? { userId: context.user.id, role: context.user.role } : undefined;
};

export const handleCollectionRoute = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const method = allowApiMethods(req, res, ['GET', 'POST', 'PUT', 'DELETE']);
  if (!method) return;
  res.setHeader('Cache-Control', 'no-store');

  const screen = findServedScreen(singleQueryValue(req.query.screenId));
  const collectionName = singleQueryValue(req.query.collection) ?? '';
  const collection = screen ? findCollection(screen.id, collectionName) : undefined;
  const idSegments = Array.isArray(req.query.id) ? req.query.id : req.query.id ? [req.query.id] : [];
  if (!screen || !collection || idSegments.length > 1) {
    sendError(
      res,
      404,
      'not_found',
      screen ? `Screen "${screen.id}" has no collection "${collectionName}".` : 'This screen does not exist.'
    );
    return;
  }
  const id = idSegments[0];
  if ((method === 'PUT' || method === 'DELETE') && !id) {
    sendError(res, 405, 'method_not_allowed', `${method} needs a document id in the path.`);
    return;
  }
  if (method === 'POST' && id) {
    sendError(res, 405, 'method_not_allowed', 'POST creates a document; send it to the collection path. Use PUT to write a known id.');
    return;
  }

  const caller = await resolveCaller(req, res, method !== 'GET');
  if (caller === undefined) return;
  const permissions = screenPermissions(screen, caller);
  if (!permissions.canRead) {
    sendError(res, 403, 'forbidden', `Your role cannot open the screen "${screen.title}".`);
    return;
  }

  const store = createCollectionStore<unknown>(collection, {
    backend: await resolveCollectionsBackend(),
    ownerKind: 'screen',
    ownerId: screen.id,
    actor: caller?.userId ?? null,
    canWrite: permissions.canWrite,
  });
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as { data?: unknown; id?: string; revision?: unknown };
  const revisionOf = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const revision = Number(value);
    if (!Number.isInteger(revision) || revision < 0) throw new ScreenDataError('invalid', '`revision` must be a whole number.');
    return revision;
  };

  try {
    if (method === 'GET' && !id) {
      res.status(200).json(await store.list(readQuery(req)));
    } else if (method === 'GET') {
      const document = await store.get(id);
      if (!document) sendError(res, 404, 'not_found', `Document "${id}" does not exist.`);
      else res.status(200).json({ document });
    } else if (method === 'POST') {
      res.status(201).json({ document: await store.create(body.data, { id: body.id }) });
    } else if (method === 'PUT') {
      res.status(200).json({ document: await store.put(id, body.data, { revision: revisionOf(body.revision) }) });
    } else {
      res.status(200).json({ deleted: await store.remove(id, { revision: revisionOf(singleQueryValue(req.query.revision)) }) });
    }
  } catch (error) {
    if (!(error instanceof ScreenDataError)) {
      console.error(`Screen collection request failed: ${screen.id}/${collection.name}.`, error);
      sendError(res, 500, 'unexpected_error', 'The collection could not be read or written.');
      return;
    }
    const current = error.code === 'conflict' && id ? await store.get(id).catch(() => null) : undefined;
    sendError(res, STATUS[error.code], error.code, error.message, current !== undefined ? { current } : {});
  }
};
