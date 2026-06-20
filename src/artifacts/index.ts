// Artifact-descriptor model + build metadata types
export {
  ARTIFACT_METADATA_PATH,
  REACT_PREVIEW_FORMAT_VERSION,
  SHARED_MAIN_CSS_ARTIFACT_PATH,
  SHARED_MAIN_JS_ARTIFACT_PATH,
  SHARED_STYLES_CSS_ARTIFACT_PATH,
  type ArtifactBuildMetadata,
  type ArtifactBuildStatus,
  type ArtifactDescriptor,
  type ArtifactKind,
  type ArtifactOwnerKind,
  type ArtifactReference,
  type ArtifactReferenceKind,
  type ArtifactSizeDiagnostics,
} from './types';

// Canonical artifact URL builder
export { ARTIFACTS_ROUTE_SEGMENT, buildArtifactUrl, normalizeBasePath } from './url';
