/**
 * Structured artifact and build-metadata model for handoff-app v2.
 *
 * These types are the contract the rest of v2 reads from instead of parsing generated HTML.
 * The workspace (filesystem) and registry (database) tracks both produce and consume this
 * shape, so dependency validation, serving, publish, ingestion, and pattern composition all
 * rely on structured data rather than HTML inspection.
 *
 * This module is a pure prefactor: types and constants only. No artifact is read or written
 * here — consumers (the store, docs read API, build, publish/ingest) come in later issues.
 */

/**
 * Logical artifact kind. Mirrors the docs read-model artifact record's `artifactKind` — the
 * broad class an artifact belongs to, independent of how it is stored or served.
 */
export type ArtifactKind = 'json' | 'html' | 'css' | 'javascript' | 'other';

/**
 * What an artifact (or reference) logically belongs to. Shared/global artifacts are owned by
 * `asset` with a `null` owner id; entity-owned artifacts name their component or pattern.
 */
export type ArtifactOwnerKind = 'component' | 'pattern' | 'asset';

/**
 * Kind of a structured artifact reference carried by an HTML artifact. Drives load order,
 * validation, and pattern dedup without ever parsing the HTML.
 */
export type ArtifactReferenceKind = 'client' | 'style' | 'script' | 'shared' | 'other';

/**
 * Build status for an artifact/entity. A successful publish sets `current` with `builtAt`,
 * `builderVersion`, and `artifactHash` all present; metadata-only records report `missing`.
 */
export type ArtifactBuildStatus = 'current' | 'stale' | 'missing' | 'error';

/**
 * A structured reference from one artifact (typically preview/inspect HTML) to another
 * artifact it depends on. References are the single source of truth for dependency
 * resolution — HTML is never parsed for dependencies.
 */
export interface ArtifactReference {
  /** Logical path of the referenced artifact (e.g. `component/main.css`). */
  path: string;
  /** Reference kind, used for load ordering and dedup. */
  kind: ArtifactReferenceKind;
  /** Whether the referencing artifact cannot render correctly without this reference. */
  required: boolean;
  /** What the referenced artifact belongs to, when known. */
  ownerKind?: ArtifactOwnerKind;
  /** Owner entity id; `null` for shared/global artifacts. */
  ownerId?: string | null;
  /** Optional content type of the referenced artifact. */
  contentType?: string;
  /** Optional format/version tag of the referenced artifact. */
  formatVersion?: string;
  /** Optional build identity the reference was resolved against. */
  buildId?: string;
  /** Optional content hash of the referenced artifact. */
  hash?: string;
  /** Optional byte size of the referenced artifact. */
  size?: number;
}

/**
 * Build/provenance metadata for an artifact or entity. Captures enough to validate, serve,
 * and debug docs output.
 */
export interface ArtifactBuildMetadata {
  /** Current build state for the artifact/entity. */
  status: ArtifactBuildStatus;
  /** ISO timestamp of the build that produced the current artifact, when built. */
  builtAt?: string;
  /** Version of the builder that produced the artifact. */
  builderVersion?: string;
  /** Content hash of the produced artifact. */
  artifactHash?: string;
  /** Optional hash of the source that produced the artifact, for staleness detection. */
  sourceHash?: string;
  /** Optional non-fatal build warnings. */
  warnings?: string[];
  /** Optional fatal build error message. */
  error?: string;
}

/**
 * Size diagnostics for an artifact, used for publish/build reporting.
 */
export interface ArtifactSizeDiagnostics {
  /** Raw byte size of the artifact content. */
  bytes: number;
  /** Optional gzipped byte size, when measured. */
  gzipBytes?: number;
}

/**
 * Structured description of a single docs read-model artifact. This is the shape the docs read
 * API serves, the static build materializes, and registry publish/ingest moves over the wire —
 * carrying enough to validate, serve, and debug an artifact.
 *
 * `content` and `storageRef` are intentionally both optional so the model leaves room for
 * future object storage of large/binary assets rather than assuming inline content for every
 * kind.
 */
export interface ArtifactDescriptor {
  /** Logical artifact path (e.g. `component/badge-primary.html`). Stable key for serving. */
  path: string;
  /** Broad artifact kind. */
  artifactKind: ArtifactKind;
  /** Content type to serve the artifact with (e.g. `text/html; charset=utf-8`). */
  contentType: string;
  /** Inline artifact content, when stored inline. */
  content?: string;
  /** Reference to externally stored content (future object storage), when not inline. */
  storageRef?: string;
  /** What the artifact belongs to. */
  ownerKind: ArtifactOwnerKind;
  /** Owner entity id; `null` for shared/global artifacts. */
  ownerId: string | null;
  /** Structured references this artifact depends on (required and optional). */
  references: ArtifactReference[];
  /** Optional format/version tag (e.g. preview/inspect HTML format version). */
  formatVersion?: string;
  /** Build identity that produced this artifact. */
  buildId?: string;
  /** Content hash of the artifact. */
  hash?: string;
  /** Byte size of the artifact. */
  size?: number;
  /** Build/provenance metadata for the artifact. */
  build?: ArtifactBuildMetadata;
  /** Optional size diagnostics. */
  diagnostics?: ArtifactSizeDiagnostics;
}

/** Logical path of the shared global stylesheet artifact. */
export const SHARED_MAIN_CSS_ARTIFACT_PATH = 'component/main.css';
/** Logical path of the shared global script artifact. */
export const SHARED_MAIN_JS_ARTIFACT_PATH = 'component/main.js';
/** Logical path of the shared component styles artifact. */
export const SHARED_STYLES_CSS_ARTIFACT_PATH = 'component/shared.css';

/** Logical path of the per-build artifact metadata manifest. */
export const ARTIFACT_METADATA_PATH = 'artifact-metadata.json';
/** Format version tag carried by generated React preview/inspect HTML. */
export const REACT_PREVIEW_FORMAT_VERSION = 'handoff-react-preview-v1';
