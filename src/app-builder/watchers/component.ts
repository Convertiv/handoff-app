import fs from 'fs-extra';
import path from 'path';
import Handoff from '../..';
import { ComponentSegment } from '../../transformers/preview/component/builder';
import { ComponentListObject } from '../../transformers/preview/types';
import { normalizePathForCompare } from '../../utils/path';

export type RuntimeComponentEntryType = keyof ComponentListObject['entries'];

/**
 * Maps configuration entry types to component segments.
 */
export const mapEntryTypeToSegment = (type: RuntimeComponentEntryType): ComponentSegment | undefined => {
  return {
    js: ComponentSegment.JavaScript,
    scss: ComponentSegment.Style,
    template: ComponentSegment.Previews,
    templates: ComponentSegment.Previews,
    component: ComponentSegment.Previews,
    story: ComponentSegment.Previews,
  }[type];
};

export const resolveComponentIdForChangedFile = (
  handoff: Handoff,
  changedFilePath: string
): string | undefined => {
  const normalizedChangedPath = normalizePathForCompare(changedFilePath);
  const runtimeComponents = handoff.runtimeConfig?.entries?.components ?? {};

  for (const [componentId, componentDef] of Object.entries(runtimeComponents)) {
    const entries = componentDef.entries ?? {};
    for (const entryPath of Object.values(entries)) {
      if (!entryPath) continue;
      const normalizedEntryPath = normalizePathForCompare(entryPath as string);
      if (normalizedEntryPath === normalizedChangedPath) {
        return componentId;
      }
    }
  }

  // Fallback for legacy path conventions when exact match is unavailable.
  return path.basename(path.dirname(changedFilePath));
};

/**
 * Gets the paths of runtime components to watch.
 *
 * @returns A map of paths to watch and their entry types.
 */
export const getRuntimeComponentsPathsToWatch = (
  handoff: Handoff
): Map<string, RuntimeComponentEntryType> => {
  const result: Map<string, RuntimeComponentEntryType> = new Map();

  for (const runtimeComponentId of Object.keys(handoff.runtimeConfig?.entries.components ?? {})) {
    const runtimeComponent = handoff.runtimeConfig.entries.components[runtimeComponentId];
    for (const [runtimeComponentEntryType, runtimeComponentEntryPath] of Object.entries(runtimeComponent.entries ?? {})) {
      const normalizedComponentEntryPath = runtimeComponentEntryPath as string;
      if (fs.existsSync(normalizedComponentEntryPath)) {
        const entryType = runtimeComponentEntryType as RuntimeComponentEntryType;
        if (fs.statSync(normalizedComponentEntryPath).isFile()) {
          result.set(path.resolve(normalizedComponentEntryPath), entryType);
        } else {
          result.set(normalizedComponentEntryPath, entryType);
        }
      }
    }
  }

  return result;
};
