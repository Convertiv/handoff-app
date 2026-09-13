import fs from 'fs-extra';
import path from 'path';
import { buildPatternDetailUrl } from '../../../artifacts/url';
import Handoff from '../../../index';
import { Logger } from '../../../utils/logger';
import {
  resolveComponentArtifactPresence,
  resolveSharedArtifactPresence,
  type ComponentArtifactPresence,
  type SharedArtifactPresence,
} from '../component/shared-artifacts';
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
  const runtimePatterns = handoff.runtimeConfig?.entities.patterns ?? {};
  const result: string[] = [];

  for (const patternId of Object.keys(runtimePatterns)) {
    const pattern = runtimePatterns[patternId];
    if (pattern.components?.some((ref) => idSet.has(ref.id))) {
      result.push(patternId);
    }
  }

  return result;
};

/** Collapses repeats into one item with a count, so one cause reads as one problem. */
const summarizeReasons = (reasons: string[]): string => {
  const counts = new Map<string, number>();
  for (const reason of reasons) {
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return Array.from(counts, ([reason, count]) => (count > 1 ? `${reason} (x${count})` : reason)).join('; ');
};

async function buildPattern(
  handoff: Handoff,
  patternId: string,
  pattern: PatternObject,
  componentOutputDir: string,
  basePath: string,
  sharedArtifacts: SharedArtifactPresence
): Promise<PatternListObject | null> {
  const fragments: { componentId: string; html: string }[] = [];
  // Composition is what drops a ref, so it is also what reports why. Discovery recorded its reason
  // without logging it, and that reason is more precise than the one this loop can build.
  const skipped: string[] = [];
  const composedWithFallback: string[] = [];

  for (const ref of pattern.components) {
    if (ref.resolved === false && !ref.resolvedPreview) {
      skipped.push(ref.unresolvedReason ?? `component "${ref.id}" did not resolve`);
      continue;
    }

    const previewKey = ref.resolvedPreview || ref.preview;
    if (!previewKey) {
      skipped.push(ref.unresolvedReason ?? `component "${ref.id}" has no preview to render`);
      ref.resolved = false;
      continue;
    }
    const htmlFileName = `${ref.id}-${previewKey}.html`;
    const htmlFilePath = path.resolve(componentOutputDir, htmlFileName);

    if (!fs.existsSync(htmlFilePath)) {
      skipped.push(ref.unresolvedReason ?? `preview "${previewKey}" of component "${ref.id}" was not built (${htmlFileName})`);
      ref.resolved = false;
      continue;
    }

    ref.resolved = true;
    if (ref.unresolvedReason) {
      composedWithFallback.push(ref.unresolvedReason);
    }
    const html = await fs.readFile(htmlFilePath, 'utf8');
    fragments.push({ componentId: ref.id, html });
  }

  if (skipped.length > 0) {
    Logger.warn(
      `Pattern "${patternId}" skipped ${skipped.length} of ${pattern.components.length} fragment(s): ${summarizeReasons(skipped)}.`
    );
  }
  if (composedWithFallback.length > 0) {
    Logger.warn(
      `Pattern "${patternId}" composed ${composedWithFallback.length} fragment(s) from a fallback: ${summarizeReasons(composedWithFallback)}.`
    );
  }

  // Resolve component-owned artifact presence for each composed component so the pattern references
  // only the stylesheets that actually exist (no dangling references for style-less components).
  const componentArtifacts = new Map<string, ComponentArtifactPresence>();
  for (const fragment of fragments) {
    if (!componentArtifacts.has(fragment.componentId)) {
      componentArtifacts.set(fragment.componentId, resolveComponentArtifactPresence(handoff, fragment.componentId));
    }
  }

  if (fragments.length === 0) {
    Logger.warn(`Pattern "${patternId}" produced no fragments. Skipping.`);
    return null;
  }

  const composedHtml = composePatternHtml(patternId, pattern.title, fragments, basePath, sharedArtifacts, componentArtifacts);
  const patternUrl = `${patternId}.html`;

  const patternData: PatternListObject = {
    ...pattern,
    id: patternId,
    url: patternUrl,
    path: buildPatternDetailUrl(patternId, basePath),
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
  // Resolve the pattern set through the storage-agnostic store (v2). The filesystem store is a read
  // view over `runtimeConfig.entities.patterns`, so these are the same records the build has always
  // used — rebuilt into the id-keyed map the build logic below expects.
  const runtimePatterns: Record<string, PatternListObject> = {};
  for (const pattern of await handoff.store.patterns.list()) {
    runtimePatterns[pattern.id] = pattern;
  }
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
  // Resolve the shared/global artifacts once so composed patterns reference `component/main.css` and
  // `component/main.js` only when present (deduplicated to a single global script per page).
  const sharedArtifacts = resolveSharedArtifactPresence(handoff);

  if (!isPartial) {
    Logger.info(`Building ${patternIds.length} pattern(s)...`);
    const result: PatternListObject[] = [];

    for (const patternId of patternIds) {
      const pattern = runtimePatterns[patternId];
      const built = await buildPattern(handoff, patternId, pattern, componentOutputDir, basePath, sharedArtifacts);
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
      const built = await buildPattern(handoff, patternId, pattern, componentOutputDir, basePath, sharedArtifacts);
      if (built) {
        existingById.set(patternId, built);
      } else {
        existingById.delete(patternId);
      }
    } else if (!existingById.has(patternId)) {
      const pattern = runtimePatterns[patternId];
      const built = await buildPattern(handoff, patternId, pattern, componentOutputDir, basePath, sharedArtifacts);
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
