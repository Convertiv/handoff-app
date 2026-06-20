# Artifacts Module

Shared v2 artifact contract: the structured artifact/build-metadata model the workspace and
registry tracks both produce and consume, plus the one canonical artifact URL builder used by
all generated HTML and docs read data. Pure types and utilities — no artifact is read or written
here; consumers (store, docs read API, build, publish/ingest) come in later issues.

## Files

| File | Purpose |
|------|---------|
| `types.ts` | `ArtifactDescriptor`, `ArtifactReference`, `ArtifactBuildMetadata`, `ArtifactSizeDiagnostics`, artifact kind/owner/status unions, and shared-artifact/manifest path + format-version constants |
| `url.ts` | `buildArtifactUrl()`, `normalizeBasePath()`, `ARTIFACTS_ROUTE_SEGMENT` — centralized `{basePath}/api/docs/artifacts/{path}` URL builder (segment-encoded, basePath-preserved, never query strings) |
| `index.ts` | Barrel re-exports |
