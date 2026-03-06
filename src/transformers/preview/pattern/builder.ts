import fs from 'fs-extra';
import Handlebars from 'handlebars';
import path from 'path';
import Handoff from '../../../index';
import { Logger } from '../../../utils/logger';
import { createHandlebarsContext, registerHandlebarsHelpers } from '../../utils/handlebars';
import { getAPIPath } from '../component/api';
import { PatternListObject, TransformPatternResult } from './types';
import { updatePatternSummaryApi, writePatternApi } from './api';

const getPatternOutputPath = (handoff: Handoff) => path.resolve(getAPIPath(handoff), 'pattern');

/**
 * Renders a single component's Handlebars template with the given values.
 * Returns the inner body HTML (no full document wrapper).
 */
async function renderComponentFragment(
  componentId: string,
  values: Record<string, any>,
  handoff: Handoff
): Promise<string> {
  const runtimeComponent = handoff.runtimeConfig?.entries?.components?.[componentId];
  if (!runtimeComponent) {
    Logger.warn(`Pattern builder: component '${componentId}' not found in runtime config`);
    return `<!-- Component '${componentId}' not found -->`;
  }

  const templatePath = runtimeComponent.entries?.template;
  if (!templatePath) {
    Logger.warn(`Pattern builder: component '${componentId}' has no template entry`);
    return `<!-- Component '${componentId}' has no template -->`;
  }

  const resolvedTemplatePath = path.resolve(templatePath);
  if (!fs.existsSync(resolvedTemplatePath)) {
    Logger.warn(`Pattern builder: template not found at ${resolvedTemplatePath}`);
    return `<!-- Template not found for '${componentId}' -->`;
  }

  const templateContent = await fs.readFile(resolvedTemplatePath, 'utf8');

  // Only Handlebars templates are supported for pattern composition
  if (!resolvedTemplatePath.endsWith('.hbs')) {
    Logger.warn(`Pattern builder: only .hbs templates are supported for pattern composition, got '${resolvedTemplatePath}'`);
    return `<!-- Component '${componentId}' uses unsupported template format -->`;
  }

  registerHandlebarsHelpers(
    { id: componentId, properties: runtimeComponent.properties || {} },
    false
  );

  const context = createHandlebarsContext(
    { id: componentId, properties: runtimeComponent.properties || {}, title: runtimeComponent.title || componentId },
    { values },
    { includeSharedStyles: false }
  );

  // For pattern composition, we only want the rendered body content, not the style/script context
  const bodyContext = {
    ...context,
    style: '',
    script: '',
  };

  try {
    const compiled = Handlebars.compile(templateContent)(bodyContext);
    // Extract just the body content
    const bodyMatch = compiled.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1].trim() : compiled;
  } catch (err) {
    Logger.error(`Pattern builder: error rendering component '${componentId}'`, err);
    return `<!-- Error rendering '${componentId}' -->`;
  }
}

/**
 * Builds a full pattern HTML document from component fragments.
 */
function buildPatternDocument(fragments: string[], componentIds: string[], handoff: Handoff, previewCss?: string): string {
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

  const cssLinks = [
    `<link rel="stylesheet" href="${basePath}/api/component/main.css">`,
    `<link rel="stylesheet" href="${basePath}/assets/css/preview.css">`,
    ...componentIds
      .filter((id, i, arr) => arr.indexOf(id) === i)
      .map((id) => `<link rel="stylesheet" href="${basePath}/api/component/${id}.css">`),
    ...(previewCss ? [`<link rel="stylesheet" href="${previewCss}">`] : []),
  ].join('\n    ');

  const jsScripts = componentIds
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => `<script src="${basePath}/api/component/${id}.js"></script>`)
    .join('\n    ');

  const body = fragments.join('\n');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${cssLinks}
  </head>
  <body>
    ${body}
    ${jsScripts}
    <script src="${basePath}/assets/js/preview.js"></script>
  </body>
</html>`;
}

/**
 * Process all patterns and generate their composed HTML previews and JSON API files.
 */
export async function processPatterns(handoff: Handoff, patternId?: string): Promise<PatternListObject[]> {
  const result: PatternListObject[] = [];
  const runtimePatterns = handoff.runtimeConfig?.entries?.patterns ?? {};
  const allPatternIds = Object.keys(runtimePatterns);

  const outputDir = getPatternOutputPath(handoff);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const runtimePatternId of allPatternIds) {
    if (patternId && runtimePatternId !== patternId) {
      continue;
    }

    const runtimePattern = runtimePatterns[runtimePatternId];
    const componentIds = runtimePattern.components || [];

    const patternData: TransformPatternResult = {
      id: runtimePatternId,
      title: runtimePattern.title || 'Untitled Pattern',
      description: runtimePattern.description || '',
      group: runtimePattern.group || 'default',
      image: runtimePattern.image,
      figma: runtimePattern.figma,
      should_do: runtimePattern.should_do || [],
      should_not_do: runtimePattern.should_not_do || [],
      components: componentIds,
      previews: {},
      options: runtimePattern.options,
    };

    const previews = runtimePattern.previews || {};

    for (const previewKey of Object.keys(previews)) {
      const preview = previews[previewKey];
      const valuesArray = preview.values || [];

      const fragments: string[] = [];
      for (let i = 0; i < componentIds.length; i++) {
        const componentId = componentIds[i];
        const componentValues = valuesArray[i] || {};
        const fragment = await renderComponentFragment(componentId, componentValues, handoff);
        fragments.push(fragment);
      }

      const html = buildPatternDocument(fragments, componentIds, handoff, runtimePattern.options?.css);

      const fileName = `${runtimePatternId}-${previewKey}.html`;
      await fs.writeFile(path.resolve(outputDir, fileName), html);

      patternData.previews[previewKey] = {
        title: preview.title || previewKey,
        values: valuesArray,
        url: `${runtimePatternId}-${previewKey}.html`,
      };

      Logger.debug(`Generated pattern preview: ${fileName}`);
    }

    await writePatternApi(runtimePatternId, patternData, handoff);

    const summary: PatternListObject = {
      id: runtimePatternId,
      title: patternData.title,
      description: patternData.description,
      group: patternData.group,
      image: patternData.image || '',
      figma: patternData.figma || '',
      should_do: patternData.should_do,
      should_not_do: patternData.should_not_do,
      components: patternData.components,
      previews: patternData.previews,
      path: `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/pattern/${runtimePatternId}.json`,
    };

    result.push(summary);
  }

  const isFullRebuild = !patternId;
  await updatePatternSummaryApi(handoff, result, isFullRebuild);

  return result;
}

export default processPatterns;
