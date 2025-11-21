import esbuild from 'esbuild';
import fs from 'fs-extra';
import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Plugin, normalizePath } from 'vite';
import Handoff from '../..';
import { Logger } from '../../utils/logger';
import { generatePropertiesFromDocgen } from '../docgen';
import { SlotMetadata } from '../preview/component';
import { TransformComponentTokensResult } from '../preview/types';
import { DEFAULT_CLIENT_BUILD_CONFIG, createReactResolvePlugin } from '../utils/build';
import { formatHtml, trimPreview } from '../utils/html';
import { buildAndEvaluateModule } from '../utils/module';
import { loadSchemaFromComponent, loadSchemaFromFile } from '../utils/schema-loader';
import { slugify } from '../utils/string';

/**
 * React component type for SSR rendering
 */
type ReactComponent = React.ComponentType<any>;

/**
 * Constants for the SSR render plugin
 */
const PLUGIN_CONSTANTS = {
  PLUGIN_NAME: 'vite-plugin-ssr-static-render',
  SCRIPT_ID: 'script',
  DUMMY_EXPORT: 'export default {}',
  ROOT_ELEMENT_ID: 'root',
  PROPS_SCRIPT_ID: '__APP_PROPS__',
  INSPECT_SUFFIX: '-inspect',
} as const;

/**
 * Loads and processes component schema using hierarchical approach
 * @param componentData - Component transformation data
 * @param componentPath - Path to the component file
 * @param handoff - Handoff instance
 * @returns Tuple of [properties, component] or [null, null] if failed
 */
async function loadComponentSchemaAndModule(
  componentData: TransformComponentTokensResult,
  componentPath: string,
  handoff: Handoff
): Promise<[{ [key: string]: SlotMetadata } | null, ReactComponent | null]> {
  let properties: { [key: string]: SlotMetadata } | null = null;
  let component: ReactComponent | null = null;

  // Step 1: Handle separate schema file (if exists)
  if (componentData.entries?.schema) {
    const schemaPath = path.resolve(componentData.entries.schema);
    properties = await loadSchemaFromFile(schemaPath, handoff);
  }

  // Step 2: Load component and handle component-embedded schema (only if no separate schema)
  if (!componentData.entries?.schema) {
    try {
      const moduleExports = await buildAndEvaluateModule(componentPath, handoff);
      component = moduleExports.exports.default;

      // Try to load schema from component exports
      properties = await loadSchemaFromComponent(moduleExports.exports, handoff);
      
      // If no schema found, use react-docgen-typescript
      if (!properties) {
        properties = await generatePropertiesFromDocgen(componentPath, handoff);
      }
    } catch (error) {
      Logger.warn(`Failed to load component file ${componentPath}: ${error}`);
    }
  }

  // Step 3: Load component for rendering (if not already loaded)
  if (!component) {
    try {
      const moduleExports = await buildAndEvaluateModule(componentPath, handoff);
      component = moduleExports.exports.default;
    } catch (error) {
      Logger.error(`Failed to load component for rendering: ${componentPath}`, error);
      return [null, null];
    }
  }

  return [properties, component];
}

/**
 * Generates client-side hydration source code
 * @param componentPath - Path to the component file
 * @returns Client-side hydration source code
 */
function generateClientHydrationSource(componentPath: string): string {
  return `
    import React from 'react';
    import { hydrateRoot } from 'react-dom/client';
    import Component from '${normalizePath(componentPath)}';

    const raw = document.getElementById('${PLUGIN_CONSTANTS.PROPS_SCRIPT_ID}')?.textContent || '{}';
    const props = JSON.parse(raw);
    hydrateRoot(document.getElementById('${PLUGIN_CONSTANTS.ROOT_ELEMENT_ID}'), <Component {...props} />);
  `;
}

/**
 * Generates complete HTML document with SSR content and hydration
 * @param componentId - Component identifier
 * @param previewTitle - Title for the preview
 * @param renderedHtml - Server-rendered HTML content
 * @param clientJs - Client-side JavaScript bundle
 * @param props - Component props as JSON
 * @returns Complete HTML document
 */
function generateHtmlDocument(
  componentId: string,
  previewTitle: string,
  renderedHtml: string,
  clientJs: string,
  props: any
): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/api/component/main.css" />
    <link rel="stylesheet" href="/api/component/${componentId}.css" />
    <link rel="stylesheet" href="/assets/css/preview.css" />
    <script id="${PLUGIN_CONSTANTS.PROPS_SCRIPT_ID}" type="application/json">${JSON.stringify(props)}</script>
    <script type="module">
      ${clientJs}
    </script>
    <title>${previewTitle}</title>
  </head>
  <body>
    <div id="${PLUGIN_CONSTANTS.ROOT_ELEMENT_ID}">${renderedHtml}</div>
  </body>
</html>`;
}

/**
 * SSR render plugin factory
 * @param componentData - Component transformation data
 * @param documentationComponents - Documentation components
 * @param handoff - Handoff instance
 * @returns Vite plugin for SSR rendering
 */
export function ssrRenderPlugin(
  componentData: TransformComponentTokensResult,
  documentationComponents: CoreTypes.IDocumentationObject['components'],
  handoff: Handoff
): Plugin {
  return {
    name: PLUGIN_CONSTANTS.PLUGIN_NAME,
    apply: 'build',
    resolveId(resolveId) {
      Logger.debug('resolveId', resolveId);
      if (resolveId === PLUGIN_CONSTANTS.SCRIPT_ID) {
        return resolveId;
      }
    },
    load(loadId) {
      if (loadId === PLUGIN_CONSTANTS.SCRIPT_ID) {
        return PLUGIN_CONSTANTS.DUMMY_EXPORT;
      }
    },
    async generateBundle(_, bundle) {
      // Remove all JS chunks to prevent conflicts
      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        if (chunkInfo.type === 'chunk' && fileName.includes(PLUGIN_CONSTANTS.SCRIPT_ID)) {
          delete bundle[fileName];
        }
      }

      const componentId = componentData.id;
      const componentPath = path.resolve(componentData.entries.template);
      const componentSourceCode = fs.readFileSync(componentPath, 'utf8');

      // Load component schema and module
      const [schemaProperties, ReactComponent] = await loadComponentSchemaAndModule(
        componentData,
        componentPath,
        handoff
      );

      if (!ReactComponent) {
        Logger.error(`Failed to load React component for ${componentId}`);
        return;
      }

      // Apply schema properties if found
      if (schemaProperties) {
        componentData.properties = schemaProperties;
      }

      // Ensure components object exists
      if (!documentationComponents) {
        documentationComponents = {};
      }

      const generatedPreviews: { [key: string]: string } = {};

      // Process component instances from documentation
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

      let finalHtml = '';

      // Generate previews for each variation
      for (const previewKey in componentData.previews) {
        const previewProps = componentData.previews[previewKey].values;
        
        // Server-side render the component
        const serverRenderedHtml = ReactDOMServer.renderToString(
          React.createElement(ReactComponent, previewProps)
        );
        const formattedHtml = await formatHtml(serverRenderedHtml);

        // Generate client-side hydration code
        const clientHydrationSource = generateClientHydrationSource(componentPath);

        // Build client-side bundle
        const clientBuildConfig = {
          ...DEFAULT_CLIENT_BUILD_CONFIG,
          stdin: {
            contents: clientHydrationSource,
            resolveDir: process.cwd(),
            loader: 'tsx' as const,
          },
          plugins: [createReactResolvePlugin(handoff.workingPath, handoff.modulePath)],
        };

        // Apply user's client build config hook if provided
        const finalClientBuildConfig = handoff.config?.hooks?.clientBuildConfig
          ? handoff.config.hooks.clientBuildConfig(clientBuildConfig)
          : clientBuildConfig;

        const bundledClient = await esbuild.build(finalClientBuildConfig);
        const clientBundleJs = bundledClient.outputFiles[0].text;

        // Generate complete HTML document
        finalHtml = generateHtmlDocument(
          componentId,
          componentData.previews[previewKey].title,
          formattedHtml,
          clientBundleJs,
          previewProps
        );

        // Emit preview files
        this.emitFile({
          type: 'asset',
          fileName: `${componentId}-${previewKey}.html`,
          source: finalHtml,
        });
        
        // TODO: remove this once we have a way to render inspect mode
        this.emitFile({
          type: 'asset',
          fileName: `${componentId}-${previewKey}${PLUGIN_CONSTANTS.INSPECT_SUFFIX}.html`,
          source: finalHtml,
        });

        generatedPreviews[previewKey] = finalHtml;
        componentData.previews[previewKey].url = `${componentId}-${previewKey}.html`;
      }

      // Format final HTML and update component data
      finalHtml = await formatHtml(finalHtml);
      componentData.format = 'react';
      componentData.preview = '';
      componentData.code = trimPreview(componentSourceCode);
      componentData.html = trimPreview(finalHtml);
    },
  };
}
