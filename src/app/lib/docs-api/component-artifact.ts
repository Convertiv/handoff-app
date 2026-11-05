import type { TransformComponentTokensResult } from '@handoff/transformers/preview/types';
import type { DocsBackend } from './backend';

export const readComponentArtifact = async (backend: DocsBackend, id: string): Promise<TransformComponentTokensResult | null> => {
  const artifact = await backend.resolveArtifact(['component', `${id}.json`]);
  if (!artifact) {
    return null;
  }
  try {
    return JSON.parse(artifact.body.toString()) as TransformComponentTokensResult;
  } catch {
    // A corrupt artifact should not sink the metadata the caller can still use.
    return null;
  }
};
