import type { RegistryReviewMetadata } from '@handoff/registry/db/schema';

/**
 * Metadata allowlist for registry create/update.
 *
 * Normal metadata writes accept only review/catalog fields. Everything else — renderer, entries,
 * previews, properties/docgen, source/artifact content, build metadata, declaration files, etc. —
 * is render/build-defining and may only change through a fresh publish (transfer PUT).
 * Any non-allowlisted field is rejected with `400 bad_request` and the offending field names, so a
 * note edit can never silently alter how an entity renders.
 */
export type ManagedEntityKind = 'component' | 'pattern' | 'page';

/**
 * Top-level allowlisted fields per entity kind. Components additionally allow `categories`; pages
 * have no promoted `tags` column, so their catalog fields stop at title/description/group.
 */
const TOP_LEVEL_FIELDS: Record<ManagedEntityKind, readonly string[]> = {
  component: ['title', 'description', 'group', 'tags', 'categories'],
  pattern: ['title', 'description', 'group', 'tags'],
  page: ['title', 'description', 'group'],
};

/** Allowlisted nested review-metadata keys. */
const METADATA_FIELDS: readonly (keyof RegistryReviewMetadata)[] = ['reviewStatus', 'notes', 'owner'];

/** String-array fields (validated element-wise). */
const ARRAY_FIELDS = new Set(['tags', 'categories']);
/** Plain-string fields. */
const STRING_FIELDS = new Set(['title', 'description', 'group']);

/** Validated, allowlist-filtered metadata write. */
export interface ValidatedMetadataWrite {
  /** Stable id, present only for create (POST) when `allowId` is set. */
  id?: string;
  /** Allowlisted top-level field values present in the request body. */
  fields: Record<string, unknown>;
  /** Allowlisted review-metadata present in the request body, or `undefined` when none supplied. */
  metadata?: RegistryReviewMetadata;
}

/**
 * Result of {@link validateMetadataWrite}. A flat shape (rather than a discriminated union) because
 * the app compiles with `strictNullChecks` off, where union narrowing is unreliable — `ok` is the
 * single source of truth, with `value` set on success and `rejectedFields`/`message` on failure.
 */
export interface MetadataValidation {
  ok: boolean;
  value?: ValidatedMetadataWrite;
  rejectedFields?: string[];
  message?: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export interface ValidateMetadataOptions {
  /** Allow (and require) an `id` field — used by create (POST). */
  allowId?: boolean;
}

/**
 * Validate and allowlist-filter a metadata create/update body for the given entity kind. Returns
 * the filtered write on success, or the list of rejected field names (render/build-defining keys,
 * unknown keys, or type-invalid values) on failure.
 */
export const validateMetadataWrite = (
  body: unknown,
  kind: ManagedEntityKind,
  options: ValidateMetadataOptions = {}
): MetadataValidation => {
  if (!isPlainObject(body)) {
    return { ok: false, rejectedFields: [], message: 'Request body must be a JSON object.' };
  }

  const allowed = new Set(TOP_LEVEL_FIELDS[kind]);
  const rejectedFields: string[] = [];
  const fields: Record<string, unknown> = {};
  let metadata: RegistryReviewMetadata | undefined;
  let id: string | undefined;

  for (const [key, value] of Object.entries(body)) {
    if (key === 'id') {
      if (!options.allowId) {
        // Identity is immutable; an `id` in an update body is render/build-irrelevant but not allowed.
        rejectedFields.push('id');
        continue;
      }
      if (typeof value !== 'string' || !value.trim()) {
        rejectedFields.push('id');
        continue;
      }
      id = value.trim();
      continue;
    }

    if (key === 'metadata') {
      if (!isPlainObject(value)) {
        rejectedFields.push('metadata');
        continue;
      }
      const reviewMetadata: RegistryReviewMetadata = {};
      for (const [metaKey, metaValue] of Object.entries(value)) {
        if (!METADATA_FIELDS.includes(metaKey as keyof RegistryReviewMetadata)) {
          rejectedFields.push(`metadata.${metaKey}`);
          continue;
        }
        if (typeof metaValue !== 'string') {
          rejectedFields.push(`metadata.${metaKey}`);
          continue;
        }
        reviewMetadata[metaKey as keyof RegistryReviewMetadata] = metaValue;
      }
      metadata = reviewMetadata;
      continue;
    }

    if (!allowed.has(key)) {
      rejectedFields.push(key);
      continue;
    }

    if (STRING_FIELDS.has(key) && typeof value !== 'string') {
      rejectedFields.push(key);
      continue;
    }
    if (ARRAY_FIELDS.has(key) && !isStringArray(value)) {
      rejectedFields.push(key);
      continue;
    }
    fields[key] = value;
  }

  if (options.allowId && !id) {
    rejectedFields.push('id');
  }

  if (rejectedFields.length > 0) {
    return {
      ok: false,
      rejectedFields,
      message:
        'Only allowlisted review/catalog fields may be written here. Render/build-defining fields, ' +
        'source, and artifacts can only change through publish.',
    };
  }

  return { ok: true, value: { id, fields, metadata } };
};

/** Merge a validated review-metadata write over the existing stored metadata. */
export const mergeReviewMetadata = (
  existing: RegistryReviewMetadata | null | undefined,
  update: RegistryReviewMetadata | undefined
): RegistryReviewMetadata | null => {
  if (!update) {
    return existing ?? null;
  }
  return { ...(existing ?? {}), ...update };
};
