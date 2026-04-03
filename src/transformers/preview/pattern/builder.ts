import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { Logger } from '../../../utils/logger';
import { PatternListObject, PatternObject } from '../types';
import { readPatternSummaryApi, syncPatternArtifacts, writePatternApi, writePatternHtml, writePatternSummaryApi } from './api';
import { composePatternHtml } from './html';

export type ProcessPatternsOptions = {
  /** When set, only these pattern ids are recomposed; others keep existing artifacts. */
  onlyPatternIds?: Set<string>;
};

/**
 * Returns pattern ids whose declarations reference any of the given component ids.
 */
export const getPatternIdsReferencingComponents = (handoff: Handoff, componentIds: string[]): string[] => {
  if (componentIds.length === 0) {
    return [];
  }
  const idSet = new Set(componentIds);
  const runtimePatterns = handoff.runtimeConfig?.entries?.patterns ?? {};
  const result: string[] = [];

  for (const patternId of Object.keys(runtimePatterns)) {
    const pattern = runtimePatterns[patternId];
    if (pattern.components?.some((ref) => idSet.has(ref.id))) {
      result.push(patternId);
    }
  }

  return result;
};

async function buildPattern(
  handoff: Handoff,
  patternId: string,
  pattern: PatternObject,
  componentOutputDir: string,
  basePath: string
): Promise<PatternListObject | null> {
  const fragments: { componentId: string; html: string }[] = [];
  let hasErrors = false;

  for (let i = 0; i < pattern.components.length; i++) {
    const ref = pattern.components[i];

    if (ref.resolved === false && !ref.resolvedPreview) {
      hasErrors = true;
      continue;
    }

    const previewKey = ref.resolvedPreview || ref.preview;
    if (!previewKey) {
      const error =
        `Pattern "${patternId}" component[${i}] ("${ref.id}") has no resolved preview key. Skipping.`;
      Logger.warn(error);
      ref.resolved = false;
      hasErrors = true;
      continue;
    }
    const htmlFileName = `${ref.id}-${previewKey}.html`;
    const htmlFilePath = path.resolve(componentOutputDir, htmlFileName);

    if (!fs.existsSync(htmlFilePath)) {
      const error =
        `Pattern "${patternId}" component[${i}] ("${ref.id}") preview file not found: ${htmlFileName}. ` +
        `Ensure the component has a preview named "${previewKey}".`;
      Logger.warn(error);
      ref.resolved = false;
      hasErrors = true;
      continue;
    }

    ref.resolved = true;
    const html = await fs.readFile(htmlFilePath, 'utf8');
    fragments.push({ componentId: ref.id, html });
  }

  if (fragments.length === 0) {
    Logger.warn(`Pattern "${patternId}" produced no fragments. Skipping.`);
    return null;
  }

  if (hasErrors) {
    Logger.warn(`Pattern "${patternId}" has missing components but will be composed from available fragments.`);
  }

  const composedHtml = composePatternHtml(patternId, pattern.title, fragments, basePath);
  const patternUrl = `${patternId}.html`;

  const patternData: PatternListObject = {
    ...pattern,
    id: patternId,
    url: patternUrl,
    path: `${basePath}/api/pattern/${patternId}.json`,
  };

  await writePatternHtml(patternId, composedHtml, handoff);
  await writePatternApi(patternId, patternData, handoff);

  Logger.debug(`Built pattern: ${patternId} (${fragments.length} component(s))`);
  return patternData;
}

/**
 * Process all pattern declarations and compose their HTML from pre-built
 * component preview files. This function must run AFTER buildComponents
 * so that all component preview HTML files already exist on disk.
 */
export async function processPatterns(handoff: Handoff, options?: ProcessPatternsOptions): Promise<PatternListObject[]> {
  const runtimePatterns = handoff.runtimeConfig?.entries?.patterns ?? {};
  const patternIds = Object.keys(runtimePatterns);
  const onlyPatternIds = options?.onlyPatternIds;
  const isPartial = onlyPatternIds !== undefined;

  if (patternIds.length === 0) {
    await syncPatternArtifacts(handoff, []);
    await writePatternSummaryApi(handoff, []);
    return [];
  }

  const componentOutputDir = path.resolve(handoff.workingPath, 'public/api/component');
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

  if (!isPartial) {
    Logger.info(`Building ${patternIds.length} pattern(s)...`);
    const result: PatternListObject[] = [];

    for (const patternId of patternIds) {
      const pattern = runtimePatterns[patternId];
      const built = await buildPattern(handoff, patternId, pattern, componentOutputDir, basePath);
      if (built) {
        result.push(built);
      }
    }

    await syncPatternArtifacts(handoff, result.map((p) => p.id));
    await writePatternSummaryApi(handoff, result);
    Logger.info(`Finished building ${result.length} pattern(s).`);
    return result;
  }

  if (onlyPatternIds.size === 0) {
    const existing = await readPatternSummaryApi(handoff);
    return existing ?? [];
  }

  const existingList = await readPatternSummaryApi(handoff);
  if (!existingList) {
    Logger.warn('Partial pattern rebuild requested but patterns.json is missing; rebuilding all patterns.');
    return processPatterns(handoff);
  }

  const existingById = new Map(existingList.map((p) => [p.id, p]));

  Logger.info(`Rebuilding ${onlyPatternIds.size} of ${patternIds.length} pattern(s) (incremental)...`);

  for (const patternId of patternIds) {
    if (onlyPatternIds.has(patternId)) {
      const pattern = runtimePatterns[patternId];
      const built = await buildPattern(handoff, patternId, pattern, componentOutputDir, basePath);
      if (built) {
        existingById.set(patternId, built);
      } else {
        existingById.delete(patternId);
      }
    } else if (!existingById.has(patternId)) {
      const pattern = runtimePatterns[patternId];
      const built = await buildPattern(handoff, patternId, pattern, componentOutputDir, basePath);
      if (built) {
        existingById.set(patternId, built);
      }
    }
  }

  const merged: PatternListObject[] = [];
  for (const patternId of patternIds) {
    const entry = existingById.get(patternId);
    if (entry) {
      merged.push(entry);
    }
  }

  await syncPatternArtifacts(handoff, merged.map((p) => p.id));
  await writePatternSummaryApi(handoff, merged);
  Logger.info(`Finished incremental pattern build (${onlyPatternIds.size} recomposed).`);

  return merged;
}

export default processPatterns;
