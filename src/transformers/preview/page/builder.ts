import fs from 'fs-extra';
import Handlebars from 'handlebars';
import path from 'path';
import Handoff from '../../../index';
import { Logger } from '../../../utils/logger';
import { createHandlebarsContext, registerHandlebarsHelpers } from '../../utils/handlebars';
import { getAPIPath } from '../component/api';
import { PageListObject, TransformPageResult } from './types';
import { updatePageSummaryApi, writePageApi } from './api';

const getPageOutputPath = (handoff: Handoff) => path.resolve(getAPIPath(handoff), 'page');

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
    Logger.warn(`Page builder: component '${componentId}' not found in runtime config`);
    return `<!-- Component '${componentId}' not found -->`;
  }

  const templatePath = runtimeComponent.entries?.template;
  if (!templatePath) {
    Logger.warn(`Page builder: component '${componentId}' has no template entry`);
    return `<!-- Component '${componentId}' has no template -->`;
  }

  const resolvedTemplatePath = path.resolve(templatePath);
  if (!fs.existsSync(resolvedTemplatePath)) {
    Logger.warn(`Page builder: template not found at ${resolvedTemplatePath}`);
    return `<!-- Template not found for '${componentId}' -->`;
  }

  const templateContent = await fs.readFile(resolvedTemplatePath, 'utf8');

  // Only Handlebars templates are supported for page composition
  if (!resolvedTemplatePath.endsWith('.hbs')) {
    Logger.warn(`Page builder: only .hbs templates are supported for page composition, got '${resolvedTemplatePath}'`);
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

  // For page composition, we only want the rendered body content, not the style/script context
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
    Logger.error(`Page builder: error rendering component '${componentId}'`, err);
    return `<!-- Error rendering '${componentId}' -->`;
  }
}

/**
 * Builds a full page HTML document from component fragments.
 */
function buildPageDocument(fragments: string[], componentIds: string[], handoff: Handoff, previewCss?: string): string {
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
 * Process all pages and generate their composed HTML previews and JSON API files.
 */
export async function processPages(handoff: Handoff, pageId?: string): Promise<PageListObject[]> {
  const result: PageListObject[] = [];
  const runtimePages = handoff.runtimeConfig?.entries?.pages ?? {};
  const allPageIds = Object.keys(runtimePages);

  const outputDir = getPageOutputPath(handoff);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const runtimePageId of allPageIds) {
    if (pageId && runtimePageId !== pageId) {
      continue;
    }

    const runtimePage = runtimePages[runtimePageId];
    const componentIds = runtimePage.components || [];

    const pageData: TransformPageResult = {
      id: runtimePageId,
      title: runtimePage.title || 'Untitled Page',
      description: runtimePage.description || '',
      group: runtimePage.group || 'default',
      image: runtimePage.image,
      figma: runtimePage.figma,
      should_do: runtimePage.should_do || [],
      should_not_do: runtimePage.should_not_do || [],
      components: componentIds,
      previews: {},
      options: runtimePage.options,
    };

    const previews = runtimePage.previews || {};

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

      const html = buildPageDocument(fragments, componentIds, handoff, runtimePage.options?.css);

      const fileName = `${runtimePageId}-${previewKey}.html`;
      await fs.writeFile(path.resolve(outputDir, fileName), html);

      pageData.previews[previewKey] = {
        title: preview.title || previewKey,
        values: valuesArray,
        url: `${runtimePageId}-${previewKey}.html`,
      };

      Logger.debug(`Generated page preview: ${fileName}`);
    }

    await writePageApi(runtimePageId, pageData, handoff);

    const summary: PageListObject = {
      id: runtimePageId,
      title: pageData.title,
      description: pageData.description,
      group: pageData.group,
      image: pageData.image || '',
      figma: pageData.figma || '',
      should_do: pageData.should_do,
      should_not_do: pageData.should_not_do,
      components: pageData.components,
      previews: pageData.previews,
      path: `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/page/${runtimePageId}.json`,
    };

    result.push(summary);
  }

  const isFullRebuild = !pageId;
  await updatePageSummaryApi(handoff, result, isFullRebuild);

  return result;
}

export default processPages;
