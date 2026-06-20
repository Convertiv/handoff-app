import esbuild from 'esbuild';
import fs from 'fs-extra';
import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Plugin, normalizePath } from 'vite';
import Handoff from '../..';
import { buildArtifactUrl } from '../../artifacts/url';
import { Logger } from '../../utils/logger';
import {
    enrichPropertiesWithDocgen,
    generateDocsArtifact,
    generatePropertiesFromDocgen,
    getPropertiesFromGeneratedDocs,
} from '../docgen';
import { SlotMetadata } from '../preview/component';
import {
  renderComponentStyleLink,
  renderGlobalScriptTag,
  renderSharedStyleLinks,
  resolveComponentArtifactPresence,
  resolveSharedArtifactPresence,
  type ComponentArtifactPresence,
  type SharedArtifactPresence,
} from '../preview/component/shared-artifacts';
import { TransformComponentTokensResult } from '../preview/types';
import { DEFAULT_CLIENT_BUILD_CONFIG, createReactResolvePlugin } from '../utils/build';
import { formatHtml, trimPreview } from '../utils/html';
import { buildAndEvaluateModule } from '../utils/module';
import { loadSchemaFromComponent, loadSchemaFromFile } from '../utils/schema-loader';
import { slugify } from '../utils/string';
import { extractComponentName, generateUsageSnippet } from '../utils/usage';
import { createViteLogger } from '../utils/vite-logger';

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
 * Suffix of the component-owned client/hydration artifact (technical design §7).
 * One artifact per component (`component/<id>.client.js`) drives hydration for every preview of
 * that component; it is referenced via the canonical artifact URL rather than inlined per preview.
 */
const CLIENT_ARTIFACT_SUFFIX = 'client.js';

/** Logical artifact path of a component's client/hydration bundle. */
const clientArtifactPath = (componentId: string): string => `component/${componentId}.${CLIENT_ARTIFACT_SUFFIX}`;

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

      // If no schema found, use shared docgen fallback
      if (!properties) {
        properties = await generatePropertiesFromDocgen(componentPath, handoff);
      }
    } catch (error) {
      Logger.warn(`Failed to load component file "${componentPath}": ${error}`);
    }
  }

  // Step 3: Load component for rendering (if not already loaded)
  if (!component) {
    try {
      const moduleExports = await buildAndEvaluateModule(componentPath, handoff);
      component = moduleExports.exports.default;
    } catch (error) {
      Logger.error(`Failed to load component for rendering "${componentPath}":`, error);
      return [null, null];
    }
  }

  return [properties, component];
}

/**
 * Generates client-side hydration source code for the component-owned client artifact.
 *
 * The bundle is shared by every preview of a component and is emitted once as
 * `component/<id>.client.js`. It hydrates two shapes of mount point so the same artifact serves both
 * a standalone preview document and a composed pattern document without per-fragment inline code:
 *
 *  - The standalone preview's `#${ROOT_ELEMENT_ID}` element paired with the `#${PROPS_SCRIPT_ID}`
 *    props script (one mount per document).
 *  - Any number of pattern mount points marked `[data-handoff-component="<id>"]`, each carrying a
 *    `data-handoff-props` attribute naming its (namespaced) props script id. A pattern document
 *    references this artifact once per component and the bundle hydrates every matching mount.
 *
 * @param componentId - Component identifier used to match pattern mount points to this bundle
 * @param componentPath - Path to the component file
 * @returns Client-side hydration source code
 */
function generateClientHydrationSource(componentId: string, componentPath: string): string {
  return `
    import React from 'react';
    import { hydrateRoot } from 'react-dom/client';
    import Component from '${normalizePath(componentPath)}';

    const parseProps = (propsId) => {
      const raw = propsId ? document.getElementById(propsId)?.textContent : '{}';
      try {
        return JSON.parse(raw || '{}');
      } catch (_) {
        return {};
      }
    };

    const standaloneRoot = document.getElementById('${PLUGIN_CONSTANTS.ROOT_ELEMENT_ID}');
    if (standaloneRoot && !standaloneRoot.hasAttribute('data-handoff-component')) {
      hydrateRoot(standaloneRoot, <Component {...parseProps('${PLUGIN_CONSTANTS.PROPS_SCRIPT_ID}')} />);
    }

    const patternMounts = document.querySelectorAll('[data-handoff-component=' + JSON.stringify('${componentId}') + ']');
    patternMounts.forEach((mount) => {
      hydrateRoot(mount, <Component {...parseProps(mount.getAttribute('data-handoff-props'))} />);
    });
  `;
}

/**
 * Generates complete HTML document with SSR content and a reference to the component-owned client
 * artifact. The client/hydration bundle is no longer inlined (technical design §7): the preview HTML
 * carries only document structure, server-rendered markup, preview data, stylesheets, and standard
 * artifact references. Interactive React previews treat the client artifact as a required reference,
 * so the script tag surfaces a clear, visible failure if the artifact cannot be loaded.
 * @param componentId - Component identifier
 * @param previewTitle - Title for the preview
 * @param renderedHtml - Server-rendered HTML content
 * @param props - Component props as JSON
 * @returns Complete HTML document
 */
function generateHtmlDocument(
  componentId: string,
  previewTitle: string,
  renderedHtml: string,
  props: any,
  sharedArtifacts: SharedArtifactPresence,
  componentArtifacts: ComponentArtifactPresence
): string {
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const clientArtifactUrl = buildArtifactUrl(clientArtifactPath(componentId), basePath);
  const clientLoadErrorMessage = `Failed to load the React client artifact (${clientArtifactPath(componentId)}). This preview cannot hydrate.`;
  // The handler is JS embedded in a double-quoted HTML attribute, so any `"` (e.g. from
  // JSON.stringify) and `&` must be entity-encoded or the attribute terminates early and
  // breaks HTML parsing. Browsers decode the entities before the JS engine runs the handler.
  const clientLoadErrorHandler = `document.getElementById('${PLUGIN_CONSTANTS.ROOT_ELEMENT_ID}').setAttribute('data-handoff-client-error', '1');console.error(${JSON.stringify(
    clientLoadErrorMessage
  )});`
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  // Shared/global stylesheets (`component/main.css`) and the component's own stylesheet
  // (`component/<id>.css`) are emitted only when present so absent optional artifacts never produce a
  // missing-file browser request.
  const sharedStyleLinks = renderSharedStyleLinks(sharedArtifacts, basePath);
  const componentStyleLink = renderComponentStyleLink(componentArtifacts, componentId, basePath);
  // The global script (`component/main.js`) is a classic tag placed before the client module so it
  // runs before dependent component-specific scripts when present.
  const globalScriptTag = renderGlobalScriptTag(sharedArtifacts, basePath);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />${sharedStyleLinks ? `\n    ${sharedStyleLinks}` : ''}${componentStyleLink ? `\n    ${componentStyleLink}` : ''}
    <link rel="stylesheet" href="${basePath}/assets/css/preview.css" />
    <script id="${PLUGIN_CONSTANTS.PROPS_SCRIPT_ID}" type="application/json">${JSON.stringify(props)}</script>${globalScriptTag ? `\n    ${globalScriptTag}` : ''}
    <script
      type="module"
      src="${clientArtifactUrl}"
      onerror="${clientLoadErrorHandler}"
    ></script>
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
    config: () => ({
      customLogger: createViteLogger(),
    }),
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
      const [schemaProperties, ReactComponent] = await loadComponentSchemaAndModule(componentData, componentPath, handoff);
      const generatedDocs = await generateDocsArtifact(componentPath, handoff);

      if (!ReactComponent) {
        Logger.error(`Failed to load React component for ${componentId}`);
        return;
      }

      // Apply schema properties if found
      if (schemaProperties) {
        componentData.properties = schemaProperties;
      }

      if (generatedDocs) {
        const docgenProperties = getPropertiesFromGeneratedDocs(generatedDocs, componentPath, handoff);
        componentData.properties = enrichPropertiesWithDocgen(componentData.properties, docgenProperties) || {};
        componentData.docgen = generatedDocs;
      }

      // Ensure components object exists
      if (!documentationComponents) {
        documentationComponents = {};
      }

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
              usage: '',
            };
          }
        }
      }

      // Build the component-owned client/hydration bundle once and emit it as a single
      // `component/<id>.client.js` artifact (technical design §7). The hydration source only imports
      // the component and reads props from the in-document `__APP_PROPS__` element, so it is identical
      // across every preview of this component — there is no need to rebuild or inline it per preview.
      const clientHydrationSource = generateClientHydrationSource(componentId, componentPath);
      const clientBuildConfig = {
        ...DEFAULT_CLIENT_BUILD_CONFIG,
        logLevel: 'silent' as const,
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

      let clientBundleJs: string;
      try {
        const bundledClient = await esbuild.build(finalClientBuildConfig);
        if (bundledClient.warnings.length > 0) {
          const messages = await esbuild.formatMessages(bundledClient.warnings, { kind: 'warning', color: true });
          messages.forEach((msg) => Logger.warn(msg));
        }
        clientBundleJs = bundledClient.outputFiles[0].text;
      } catch (error: any) {
        // The client artifact is a required reference for interactive React previews. If it cannot be
        // built, do not emit preview HTML that points at a missing artifact — fail clearly instead.
        Logger.error(`Failed to build client bundle for ${componentId}`);
        if (error.errors) {
          const messages = await esbuild.formatMessages(error.errors, { kind: 'error', color: true });
          messages.forEach((msg) => Logger.error(msg));
        }
        return;
      }

      this.emitFile({
        type: 'asset',
        fileName: `${componentId}.${CLIENT_ARTIFACT_SUFFIX}`,
        source: clientBundleJs,
      });

      let finalHtml = '';

      // Resolve which shared/global and component-owned artifacts exist so generated HTML references
      // them only when present. These are built before component HTML, so this reflects final state.
      const sharedArtifacts = resolveSharedArtifactPresence(handoff);
      const componentArtifacts = resolveComponentArtifactPresence(handoff, componentId);

      // Generate previews for each variation
      for (const previewKey in componentData.previews) {
        const previewProps = componentData.previews[previewKey].values;

        // Server-side render the component
        const serverRenderedHtml = ReactDOMServer.renderToString(React.createElement(ReactComponent, previewProps));
        const formattedHtml = await formatHtml(serverRenderedHtml);

        // Generate complete HTML document referencing the shared client artifact
        finalHtml = generateHtmlDocument(
          componentId,
          componentData.previews[previewKey].title,
          formattedHtml,
          previewProps,
          sharedArtifacts,
          componentArtifacts
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

        componentData.previews[previewKey].url = `${componentId}-${previewKey}.html`;
        componentData.previews[previewKey].usage = generateUsageSnippet({
          componentName: extractComponentName(componentPath),
          properties: componentData.properties || {},
          previewValues: previewProps || {},
          templateFileName: path.basename(componentPath),
        });
      }

      // Format final HTML and update component data
      finalHtml = await formatHtml(finalHtml);
      componentData.format = 'react';
      componentData.preview = '';
      componentData.code = trimPreview(componentSourceCode);
      componentData.html = trimPreview(finalHtml);

      // Generate usage snippet from the first preview's values
      const previewKeys = Object.keys(componentData.previews);
      const firstPreviewValues = previewKeys.length > 0 ? componentData.previews[previewKeys[0]].values : {};
      const componentName = extractComponentName(componentPath);
      componentData.usage = generateUsageSnippet({
        componentName,
        properties: componentData.properties || {},
        previewValues: firstPreviewValues,
        templateFileName: path.basename(componentPath),
      });
    },
  };
}
