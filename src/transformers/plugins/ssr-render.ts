import fs from 'fs-extra';
import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Plugin, normalizePath } from 'vite';
import Handoff from '../..';
import { Logger } from '../../utils/logger';
import { enrichPropertiesWithDocgen, generateDocsArtifact, generatePropertiesFromDocgen, getPropertiesFromGeneratedDocs } from '../docgen';
import { SlotMetadata } from '../preview/component';
import { TransformComponentTokensResult } from '../preview/types';
import { buildAndEvaluateModule } from '../utils/module';
import {
  bundleClientSource,
  clientArtifactFileName,
  CLIENT_RENDER_RUNTIME_SOURCE,
  PREVIEW_ENTRY_ID,
  REACT_CLIENT_RENDER_SOURCE,
} from '../utils/render-shell';
import { loadSchemaFromComponent, loadSchemaFromFile } from '../utils/schema-loader';
import { extractComponentName, generateUsageSnippet } from '../utils/usage';
import { createViteLogger } from '../utils/vite-logger';
import { emitClientPreviews } from './client-previews';

/**
 * React component type for SSR rendering
 */
type ReactComponent = React.ComponentType<any>;

function selectComponentExport(moduleExports: Record<string, any>, exportName?: string): ReactComponent | null {
  if (exportName && exportName !== 'default' && moduleExports?.[exportName]) {
    return moduleExports[exportName];
  }
  return moduleExports?.default ?? null;
}

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
      component = selectComponentExport(moduleExports.exports, componentData.componentExport);

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
      component = selectComponentExport(moduleExports.exports, componentData.componentExport);
    } catch (error) {
      Logger.error(`Failed to load component for rendering "${componentPath}":`, error);
      return [null, null];
    }
  }

  return [properties, component];
}

/**
 * The source of the component's client artifact, `component/<id>.client.js`. Through `mountPreviews`
 * it hydrates the standalone preview and each pattern mount, and renders the custom preview shell.
 */
function generateClientHydrationSource(
  componentId: string,
  componentPath: string,
  componentExport?: string,
  declarationPath?: string
): string {
  const importClause = componentExport && componentExport !== 'default' ? `{ ${componentExport} as Component }` : 'Component';
  // A function cannot travel in the JSON props, so the client re-reads `render` from the module that
  // defines it. Conditional, so an unaffected component does not ship its declaration's imports.
  const declarationImport = declarationPath ? `import * as previewDeclaration from '${normalizePath(declarationPath)}';` : '';
  const resolveComponent = declarationPath
    ? `(mount) => {
      const previewKey = mount.getAttribute('data-handoff-preview');
      const render = previewKey ? previewDeclaration[previewKey]?.render : undefined;
      return typeof render === 'function' ? render : Component;
    }`
    : '() => Component';

  return `
    import React from 'react';
    import { createRoot, hydrateRoot } from 'react-dom/client';
    import ${importClause} from '${normalizePath(componentPath)}';
    ${declarationImport}
    ${CLIENT_RENDER_RUNTIME_SOURCE}
    ${REACT_CLIENT_RENDER_SOURCE}

    const resolveComponent = ${resolveComponent};

    mountPreviews(${JSON.stringify(componentId)}, (container, { hydrate }) => {
      // The shell renders the component itself with any args, never a preview's render.
      if (!hydrate) return createReactClientRender(container, (args) => <Component {...args} />);
      const MountComponent = resolveComponent(container);
      return (args) => hydrateRoot(container, <MountComponent {...args} />);
    });
  `;
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
    name: 'vite-plugin-ssr-static-render',
    apply: 'build',
    config: () => ({
      customLogger: createViteLogger(),
    }),
    // The client artifact is bundled with esbuild below, so the build's own entry is an empty module.
    resolveId(id) {
      if (id === PREVIEW_ENTRY_ID) return id;
    },
    load(id) {
      if (id === PREVIEW_ENTRY_ID) return 'export default {}';
    },
    async generateBundle(_, bundle) {
      // Remove all JS chunks to prevent conflicts
      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        if (chunkInfo.type === 'chunk' && fileName.includes(PREVIEW_ENTRY_ID)) {
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

      // Build the component-owned client/hydration bundle once and emit it as a single
      // `component/<id>.client.js` artifact. The hydration source only imports the component and
      // reads props from the in-document `__APP_PROPS__` element, so it is identical across every
      // preview of this component.
      const declarationPath = Object.values(componentData.previews ?? {}).some((preview) => typeof preview.render === 'function')
        ? componentData.entries?.declaration
        : undefined;
      const clientHydrationSource = generateClientHydrationSource(
        componentId,
        componentPath,
        componentData.componentExport,
        declarationPath
      );
      const clientBundleJs = await bundleClientSource(clientHydrationSource, handoff, componentId);
      // The client artifact is a required reference for interactive React previews. If it cannot be
      // built, do not emit preview HTML that points at a missing artifact.
      if (!clientBundleJs) {
        return;
      }

      this.emitFile({
        type: 'asset',
        fileName: clientArtifactFileName(componentId),
        source: clientBundleJs,
      });

      const componentName = extractComponentName(componentPath);
      await emitClientPreviews((file) => this.emitFile(file), {
        componentData,
        documentationComponents,
        handoff,
        format: 'react',
        code: componentSourceCode,
        // Rendered as a component rather than called, so a preview can use hooks and own state. The
        // markup must reach the document exactly as rendered: React re-renders on the client when
        // formatting adds text nodes it does not expect.
        markup: (preview) =>
          ReactDOMServer.renderToString(
            React.createElement((typeof preview.render === 'function' ? preview.render : ReactComponent) as ReactComponent, preview.values)
          ),
        usage: (previewValues) =>
          generateUsageSnippet({
            componentName,
            properties: componentData.properties || {},
            previewValues,
            templateFileName: path.basename(componentPath),
          }),
      });
    },
  };
}
