import type { Types as CoreTypes } from 'handoff-core';
import { slugify } from '../../utils/string';
import type { OptionalPreviewRender, TransformComponentTokensResult } from '../types';

/**
 * Returns previews exposed in docs/API; synthetic pattern previews (`__pattern_*`) are omitted.
 */
export const getDocumentedPreviews = (
  previews?: { [key: string]: OptionalPreviewRender }
): { [key: string]: OptionalPreviewRender } => {
  return Object.fromEntries(
    Object.entries(previews || {}).filter(([key]) => !key.startsWith('__pattern_'))
  );
};

/**
 * Adds one preview per Figma instance of the component, keyed by the instance id. Only a component
 * that sets `figmaComponentId` is matched; there is no implicit matching by name.
 */
export const addFigmaInstancePreviews = (
  componentData: TransformComponentTokensResult,
  documentationComponents: CoreTypes.IDocumentationObject['components'] | undefined
): void => {
  if (!componentData.figmaComponentId) return;

  const documented = documentationComponents?.[slugify(componentData.figmaComponentId)];
  for (const instance of documented?.instances ?? []) {
    componentData.previews[instance.id] = {
      title: instance.id,
      url: '',
      values: Object.fromEntries(instance.variantProperties),
    };
  }
};
