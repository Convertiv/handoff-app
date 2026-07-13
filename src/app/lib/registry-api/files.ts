import type { RegistryTextFileKind } from '@handoff/store/types';
import { isSafeRelativePath, normalizeRelativePath } from '@handoff/registry/path';
import { isPlainObject } from './validation';

/**
 * Registry text-file record validation.
 *
 * Text file records are checkout/inspection/management only and **exclude declaration files** —
 * declarations are a workspace-only concern (synthesized on checkout). File bodies must carry a
 * supported kind and a registry-safe relative path; `declaration`, unknown kinds, and unsafe paths
 * are rejected with `400 bad_request`.
 */

/** Supported registry file kinds (the store kinds minus the workspace-only `declaration`). */
const ALLOWED_FILE_KINDS: readonly RegistryTextFileKind[] = [
  'component',
  'template',
  'style',
  'script',
  'story',
  'docs',
  'markdown',
  'schema',
  'other',
];

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ts: 'text/typescript; charset=utf-8',
  tsx: 'text/typescript; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  jsx: 'application/javascript; charset=utf-8',
  cjs: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  css: 'text/css; charset=utf-8',
  scss: 'text/x-scss; charset=utf-8',
  sass: 'text/x-sass; charset=utf-8',
  hbs: 'text/x-handlebars-template; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  html: 'text/html; charset=utf-8',
};

const contentTypeForPath = (filePath: string): string => {
  const lastDot = filePath.lastIndexOf('.');
  const ext = lastDot >= 0 ? filePath.slice(lastDot + 1).toLowerCase() : '';
  return CONTENT_TYPE_BY_EXT[ext] ?? 'text/plain; charset=utf-8';
};

/** A validated, persistable registry file record. */
export interface ValidatedFile {
  path: string;
  kind: RegistryTextFileKind;
  content: string;
  contentType: string;
}

/**
 * Result of {@link validateFileBody}. Flat (not a discriminated union) because the app compiles with
 * `strictNullChecks` off — `ok` decides, with `value` set on success and `rejectedFields`/`message`
 * on failure.
 */
export interface FileValidation {
  ok: boolean;
  value?: ValidatedFile;
  rejectedFields?: string[];
  message?: string;
}

export interface ValidateFileOptions {
  /**
   * Path supplied by the route (e.g. the `[...filePath]` segment for PUT). When set, the body path,
   * if present, must match it; the route path is authoritative.
   */
  pathFromRoute?: string;
}

/**
 * Validate a registry file record body (`{ path, kind, content, contentType }`). Rejects the
 * `declaration` kind, unknown kinds, unsafe paths, and missing content with field-level detail.
 */
export const validateFileBody = (body: unknown, options: ValidateFileOptions = {}): FileValidation => {
  if (!isPlainObject(body)) {
    return { ok: false, rejectedFields: [], message: 'Request body must be a JSON object.' };
  }

  const rejectedFields: string[] = [];

  const rawPath = options.pathFromRoute ?? (typeof body.path === 'string' ? body.path : undefined);
  if (!rawPath || !isSafeRelativePath(rawPath)) {
    rejectedFields.push('path');
  } else if (
    options.pathFromRoute &&
    typeof body.path === 'string' &&
    normalizeRelativePath(body.path) !== normalizeRelativePath(options.pathFromRoute)
  ) {
    // A body path that disagrees with the route path is ambiguous; reject rather than guess.
    rejectedFields.push('path');
  }

  const kind = body.kind;
  if (typeof kind !== 'string' || !ALLOWED_FILE_KINDS.includes(kind as RegistryTextFileKind)) {
    // `declaration` (workspace-only) and any unknown kind land here.
    rejectedFields.push('kind');
  }

  if (typeof body.content !== 'string') {
    rejectedFields.push('content');
  }

  if (body.contentType !== undefined && typeof body.contentType !== 'string') {
    rejectedFields.push('contentType');
  }

  if (rejectedFields.length > 0) {
    const declarationAttempted = kind === 'declaration';
    return {
      ok: false,
      rejectedFields,
      message: declarationAttempted
        ? 'Declaration files are workspace-only and are never stored as registry source records.'
        : 'Invalid file record: a supported kind, a registry-safe relative path, and string content are required.',
    };
  }

  const path = normalizeRelativePath(rawPath as string);
  return {
    ok: true,
    value: {
      path,
      kind: kind as RegistryTextFileKind,
      content: body.content as string,
      contentType: (body.contentType as string) || contentTypeForPath(path),
    },
  };
};
