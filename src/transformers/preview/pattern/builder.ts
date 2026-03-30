import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { Logger } from '../../../utils/logger';
import { PatternListObject } from '../types';
import { syncPatternArtifacts, writePatternApi, writePatternHtml, writePatternSummaryApi } from './api';
import { composePatternHtml } from './html';

/**
 * Process all pattern declarations and compose their HTML from pre-built
 * component preview files. This function must run AFTER buildComponents
 * so that all component preview HTML files already exist on disk.
 */
export async function processPatterns(handoff: Handoff): Promise<PatternListObject[]> {
  const runtimePatterns = handoff.runtimeConfig?.entries?.patterns ?? {};
  const patternIds = Object.keys(runtimePatterns);
  const result: PatternListObject[] = [];

  if (patternIds.length === 0) {
    await syncPatternArtifacts(handoff, []);
    await writePatternSummaryApi(handoff, result);
    return result;
  }

  Logger.info(`Building ${patternIds.length} pattern(s)...`);

  const componentOutputDir = path.resolve(handoff.workingPath, 'public/api/component');
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

  for (const patternId of patternIds) {
    const pattern = runtimePatterns[patternId];
    const fragments: { componentId: string; html: string }[] = [];
    let hasErrors = false;

    for (let i = 0; i < pattern.components.length; i++) {
      const ref = pattern.components[i];

      if (ref.resolved === false && !ref.resolvedPreview) {
        hasErrors = true;
        continue;
      }

      const previewKey = ref.resolvedPreview || ref.preview || 'default';
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
      continue;
    }

    if (hasErrors) {
      Logger.warn(`Pattern "${patternId}" has missing components but will be composed from available fragments.`);
    }

    const composedHtml = composePatternHtml(patternId, pattern.title, fragments, basePath);
    const patternUrl = `${patternId}.html`;

    const patternData: PatternListObject = {
      ...pattern,
      url: patternUrl,
      path: `${basePath}/api/pattern/${patternId}.json`,
    };

    await writePatternHtml(patternId, composedHtml, handoff);
    await writePatternApi(patternId, patternData, handoff);

    result.push(patternData);
    Logger.debug(`Built pattern: ${patternId} (${fragments.length} component(s))`);
  }

  await syncPatternArtifacts(handoff, result.map((pattern) => pattern.id));
  await writePatternSummaryApi(handoff, result);
  Logger.info(`Finished building ${result.length} pattern(s).`);

  return result;
}

export default processPatterns;
