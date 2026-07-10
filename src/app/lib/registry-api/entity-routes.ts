import type { NextApiRequest, NextApiResponse } from 'next';
import { isSafePathSegment, isSafeRelativePath, normalizeRelativePath } from '@handoff/registry/path';
import { joinedQueryValue, singleQueryValue } from '../api/query';
import type { ManagedEntityKind } from './allowlist';
import { validateMetadataWrite } from './allowlist';
import { sendRegistryError } from './errors';
import { validateFileBody } from './files';
import { handleRegistryRoute, sendRegistryData } from './handler';
import { buildMeta } from './meta';
import { revalidateEntityPages } from './revalidate';
import {
  createEntity,
  deleteEntity,
  deleteEntityFile,
  entityExists,
  getEntity,
  getEntityFile,
  listEntities,
  listEntityFiles,
  updateEntityMetadata,
  upsertEntityFile,
} from './store';

/**
 * Entity-kind-parameterized route bodies for the registry management API.
 *
 * Components and patterns expose the identical CRUD + files surface, so the four `/api/registry/*`
 * route shapes are implemented once here and bound to a kind by the thin page route files. Each runs
 * behind {@link handleRegistryRoute}, which applies the runtime-mode, method, bearer-token, and
 * database guards before the body executes.
 */

const label = (kind: ManagedEntityKind): string => (kind === 'component' ? 'Component' : 'Pattern');

const rejectionDetails = (rejectedFields: string[]) => (rejectedFields.length ? { rejectedFields } : undefined);

/** `GET` (list) + `POST` (create metadata-only record) for a collection. */
export const handleEntityCollection = (req: NextApiRequest, res: NextApiResponse, kind: ManagedEntityKind): Promise<void> =>
  handleRegistryRoute(req, res, ['GET', 'POST'], async ({ db, method }) => {
    if (method === 'GET') {
      sendRegistryData(res, 200, await listEntities(db, kind));
      return;
    }
    const validation = validateMetadataWrite(req.body, kind, { allowId: true });
    if (!validation.ok) {
      sendRegistryError(res, 'bad_request', validation.message, rejectionDetails(validation.rejectedFields));
      return;
    }
    const result = await createEntity(db, kind, validation.value);
    if (!result) {
      sendRegistryError(res, 'bad_request', `A ${kind} with id "${validation.value.id}" already exists.`);
      return;
    }
    // A new entity appears in the system index; regenerate it on demand.
    await revalidateEntityPages(res, kind, validation.value.id);
    sendRegistryData(res, 201, result.data, buildMeta(result.build));
  });

/** `GET` (detail) + `PUT` (allowlisted metadata update) + `DELETE` for a single entity. */
export const handleEntityItem = (req: NextApiRequest, res: NextApiResponse, kind: ManagedEntityKind): Promise<void> =>
  handleRegistryRoute(req, res, ['GET', 'PUT', 'DELETE'], async ({ db, method }) => {
    const id = singleQueryValue(req.query.id);
    if (!id) {
      sendRegistryError(res, 'not_found', `Missing ${kind} id.`);
      return;
    }
    if (!isSafePathSegment(id)) {
      sendRegistryError(res, 'bad_request', `${label(kind)} id must be a registry-safe relative path.`, {
        rejectedFields: ['id'],
      });
      return;
    }

    if (method === 'GET') {
      const result = await getEntity(db, kind, id);
      if (!result) {
        sendRegistryError(res, 'not_found', `${label(kind)} "${id}" was not found.`);
        return;
      }
      sendRegistryData(res, 200, result.data, buildMeta(result.build));
      return;
    }

    if (method === 'PUT') {
      const validation = validateMetadataWrite(req.body, kind);
      if (!validation.ok) {
        sendRegistryError(res, 'bad_request', validation.message, rejectionDetails(validation.rejectedFields));
        return;
      }
      const result = await updateEntityMetadata(db, kind, id, validation.value);
      if (!result) {
        sendRegistryError(res, 'not_found', `${label(kind)} "${id}" was not found.`);
        return;
      }
      // A metadata edit (e.g. title/description) changes the server-rendered detail page; regenerate.
      await revalidateEntityPages(res, kind, id);
      sendRegistryData(res, 200, result.data, buildMeta(result.build));
      return;
    }

    const deleted = await deleteEntity(db, kind, id);
    if (!deleted) {
      sendRegistryError(res, 'not_found', `${label(kind)} "${id}" was not found.`);
      return;
    }
    // The entity is gone; regenerate so the detail page 404s and the index drops it.
    await revalidateEntityPages(res, kind, id);
    sendRegistryData(res, 200, { id, deleted: true });
  });

/** `GET` (list files) + `POST` (create/replace a file record) for an entity's files. */
export const handleEntityFilesCollection = (req: NextApiRequest, res: NextApiResponse, kind: ManagedEntityKind): Promise<void> =>
  handleRegistryRoute(req, res, ['GET', 'POST'], async ({ db, method }) => {
    const id = singleQueryValue(req.query.id);
    if (!id) {
      sendRegistryError(res, 'not_found', `Missing ${kind} id.`);
      return;
    }
    if (!isSafePathSegment(id)) {
      sendRegistryError(res, 'bad_request', `${label(kind)} id must be a registry-safe relative path.`, {
        rejectedFields: ['id'],
      });
      return;
    }
    if (!(await entityExists(db, kind, id))) {
      sendRegistryError(res, 'not_found', `${label(kind)} "${id}" was not found.`);
      return;
    }

    if (method === 'GET') {
      sendRegistryData(res, 200, await listEntityFiles(db, kind, id));
      return;
    }

    const validation = validateFileBody(req.body);
    if (!validation.ok) {
      sendRegistryError(res, 'bad_request', validation.message, rejectionDetails(validation.rejectedFields));
      return;
    }
    sendRegistryData(res, 201, await upsertEntityFile(db, kind, id, validation.value));
  });

/** `GET` + `PUT` + `DELETE` for a single text-file record addressed by its relative path. */
export const handleEntityFileItem = (req: NextApiRequest, res: NextApiResponse, kind: ManagedEntityKind): Promise<void> =>
  handleRegistryRoute(req, res, ['GET', 'PUT', 'DELETE'], async ({ db, method }) => {
    const id = singleQueryValue(req.query.id);
    const rawPath = joinedQueryValue(req.query.filePath);
    if (!id || !rawPath) {
      sendRegistryError(res, 'not_found', `Missing ${kind} id or file path.`);
      return;
    }
    if (!isSafePathSegment(id)) {
      sendRegistryError(res, 'bad_request', `${label(kind)} id must be a registry-safe relative path.`, {
        rejectedFields: ['id'],
      });
      return;
    }
    if (!isSafeRelativePath(rawPath)) {
      sendRegistryError(res, 'bad_request', 'File path must be a registry-safe relative path.', {
        rejectedFields: ['path'],
      });
      return;
    }
    const filePath = normalizeRelativePath(rawPath);

    if (!(await entityExists(db, kind, id))) {
      sendRegistryError(res, 'not_found', `${label(kind)} "${id}" was not found.`);
      return;
    }

    if (method === 'GET') {
      const file = await getEntityFile(db, kind, id, filePath);
      if (!file) {
        sendRegistryError(res, 'not_found', `File "${filePath}" was not found for ${kind} "${id}".`);
        return;
      }
      sendRegistryData(res, 200, file);
      return;
    }

    if (method === 'PUT') {
      const validation = validateFileBody(req.body, { pathFromRoute: filePath });
      if (!validation.ok) {
        sendRegistryError(res, 'bad_request', validation.message, rejectionDetails(validation.rejectedFields));
        return;
      }
      sendRegistryData(res, 200, await upsertEntityFile(db, kind, id, validation.value));
      return;
    }

    const deleted = await deleteEntityFile(db, kind, id, filePath);
    if (!deleted) {
      sendRegistryError(res, 'not_found', `File "${filePath}" was not found for ${kind} "${id}".`);
      return;
    }
    sendRegistryData(res, 200, { path: filePath, deleted: true });
  });
