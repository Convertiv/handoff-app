import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import { Plugin } from 'vite';
import Handoff from '../..';
import { TransformComponentTokensResult } from '../preview/types';
import { createHandlebarsContext, registerHandlebarsHelpers } from '../utils/handlebars';
import { formatHtmlWithWrapper, trimPreview } from '../utils/html';
import { slugify } from '../utils/string';

/**
 * Preview data interface for Handlebars rendering
 */
interface PreviewRenderData {
  values?: Record<string, any>;
  title?: string;
}

/**
 * Constants for the Handlebars previews plugin
 */
const PLUGIN_CONSTANTS = {
  PLUGIN_NAME: 'vite-plugin-previews',
  SCRIPT_ID: 'script',
  DUMMY_EXPORT: 'export default {}',
  INSPECT_SUFFIX: '-inspect',
  OUTPUT_FORMAT: 'html',
} as const;

/**
 * Processes component instances from documentation and creates preview data
 * @param componentData - Component transformation data
 * @param documentationComponents - Documentation components
 */
function processComponentInstances(
  componentData: TransformComponentTokensResult,
  documentationComponents: CoreTypes.IDocumentationObject['components']
): void {
  // Use figmaComponentId if provided, otherwise skip implicit matching
  if (componentData.figmaComponentId) {
    const figmaComponentKey = slugify(componentData.figmaComponentId);
    if (documentationComponents[figmaComponentKey]) {
      for (const instance of documentationComponents[figmaComponentKey].instances) {
        const variationId = instance.id;
        const instanceValues = Object.fromEntries(instance.variantProperties);

        componentData.previews[variationId] = {
          title: variationId,
          url: '',
          values: instanceValues,
        };
      }
    }
  }
}

/**
 * Renders a Handlebars template with the given preview data
 * @param template - Handlebars template string
 * @param componentData - Component transformation data
 * @param previewData - Preview data to render
 * @param injectFieldWrappers - Whether to inject field wrappers for inspection
 * @returns Rendered HTML string
 */
async function renderHandlebarsTemplate(
  template: string,
  componentData: TransformComponentTokensResult,
  previewData: PreviewRenderData,
  injectFieldWrappers: boolean
): Promise<string> {
  // Register Handlebars helpers with current injection state
  registerHandlebarsHelpers(
    { id: componentData.id, properties: componentData.properties || {} }, 
    injectFieldWrappers
  );

  const context = createHandlebarsContext({ 
    id: componentData.id, 
    properties: componentData.properties || {}, 
    title: componentData.title 
  }, previewData);
  
  const compiled = Handlebars.compile(template)(context);
  return await formatHtmlWithWrapper(compiled);
}

/**
 * Generates preview files for a component variation
 * @param componentId - Component identifier
 * @param previewKey - Preview variation key
 * @param normalHtml - Normal mode HTML
 * @param inspectHtml - Inspect mode HTML
 * @param emitFile - Vite emitFile function
 */
function emitPreviewFiles(
  componentId: string,
  previewKey: string,
  normalHtml: string,
  inspectHtml: string,
  emitFile: (file: { type: 'asset'; fileName: string; source: string }) => void
): void {
  emitFile({
    type: 'asset',
    fileName: `${componentId}-${previewKey}.html`,
    source: normalHtml,
  });
  
  emitFile({
    type: 'asset',
    fileName: `${componentId}-${previewKey}${PLUGIN_CONSTANTS.INSPECT_SUFFIX}.html`,
    source: inspectHtml,
  });
}

/**
 * Handlebars previews plugin factory
 * @param componentData - Component transformation data
 * @param documentationComponents - Documentation components
 * @param handoff - Handoff instance
 * @returns Vite plugin for Handlebars previews
 */
export function handlebarsPreviewsPlugin(
  componentData: TransformComponentTokensResult,
  documentationComponents: CoreTypes.IDocumentationObject['components'],
  handoff: Handoff
): Plugin {
  return {
    name: PLUGIN_CONSTANTS.PLUGIN_NAME,
    apply: 'build',
    resolveId(resolveId) {
      if (resolveId === PLUGIN_CONSTANTS.SCRIPT_ID) {
        return resolveId;
      }
    },
    load(loadId) {
      if (loadId === PLUGIN_CONSTANTS.SCRIPT_ID) {
        return PLUGIN_CONSTANTS.DUMMY_EXPORT;
      }
    },
    async generateBundle() {
      const componentId = componentData.id;
      const templatePath = path.resolve(componentData.entries.template);
      const templateContent = await fs.readFile(templatePath, 'utf8');

      // Ensure components object exists
      if (!documentationComponents) {
        documentationComponents = {};
      }

      // Process component instances from documentation
      processComponentInstances(componentData, documentationComponents);

      const generatedPreviews: { [key: string]: string } = {};

      // Generate previews for each variation
      for (const previewKey in componentData.previews) {
        const previewData = componentData.previews[previewKey];
        
        // Render both normal and inspect modes
        const normalModeHtml = await renderHandlebarsTemplate(
          templateContent,
          componentData,
          previewData,
          false
        );
        
        const inspectModeHtml = await renderHandlebarsTemplate(
          templateContent,
          componentData,
          previewData,
          true
        );

        // Emit preview files
        emitPreviewFiles(
          componentId,
          previewKey,
          normalModeHtml,
          inspectModeHtml,
          (file) => this.emitFile(file)
        );

        generatedPreviews[previewKey] = normalModeHtml;
        componentData.previews[previewKey].url = `${componentId}-${previewKey}.html`;
      }

      // Update component data with results
      componentData.format = PLUGIN_CONSTANTS.OUTPUT_FORMAT;
      componentData.preview = '';
      componentData.code = trimPreview(templateContent);
      componentData.html = trimPreview(generatedPreviews[Object.keys(generatedPreviews)[0]]);
    },
  };
}
