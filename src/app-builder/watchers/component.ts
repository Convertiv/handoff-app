import fs from 'fs-extra';
import path from 'path';
import Handoff from '../..';
import { readComponentSources } from '../../cache/component-sources';
import { ComponentSegment } from '../../transformers/preview/component/builder';
import { ComponentListObject } from '../../transformers/preview/types';
import { isPathInside, normalizePathForCompare } from '../../utils/path';

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

/**
 * The component whose entry is the changed file, or holds it when the entry is a directory, such as a
 * `templates` entry.
 */
export const resolveEntryOwner = (
  handoff: Handoff,
  changedFilePath: string
): { componentId: string; entryType: RuntimeComponentEntryType } | undefined => {
  const runtimeComponents = handoff.runtimeConfig?.entities.components ?? {};

  for (const [componentId, componentDef] of Object.entries(runtimeComponents)) {
    for (const [entryType, entryPath] of Object.entries(componentDef.entries ?? {})) {
      if (entryPath && isPathInside(changedFilePath, entryPath as string)) {
        return { componentId, entryType: entryType as RuntimeComponentEntryType };
      }
    }
  }

  return undefined;
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

  for (const runtimeComponentId of Object.keys(handoff.runtimeConfig?.entities.components ?? {})) {
    const runtimeComponent = handoff.runtimeConfig.entities.components[runtimeComponentId];
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

/**
 * Maps each recorded source file to the components whose last build read it. A file can belong to
 * several components: an Angular template is read by its component and by every component that nests
 * it. Keyed by `normalizePathForCompare`; `file` keeps the recorded path for the watcher.
 */
export type ComponentSourceReaders = Map<string, { file: string; componentIds: string[] }>;

export const getComponentSourceReaders = (handoff: Handoff): ComponentSourceReaders => {
  const knownIds = new Set(Object.keys(handoff.runtimeConfig?.entities.components ?? {}));
  const readers: ComponentSourceReaders = new Map();

  for (const [componentId, files] of Object.entries(readComponentSources(handoff.workingPath))) {
    if (!knownIds.has(componentId)) continue;
    for (const file of files) {
      const key = normalizePathForCompare(file);
      const entry = readers.get(key) ?? { file, componentIds: [] };
      entry.componentIds.push(componentId);
      readers.set(key, entry);
    }
  }

  return readers;
};
