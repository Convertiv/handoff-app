import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import { Plugin, normalizePath } from 'vite';
import Handoff from '../..';
import { Logger } from '../../utils/logger';
import { TransformComponentTokensResult } from '../preview/types';
import {
  resolveComponentArtifactPresence,
  resolveSharedArtifactPresence,
  type ComponentArtifactPresence,
  type SharedArtifactPresence,
} from '../preview/component/shared-artifacts';
import { createHandlebarsContext, registerHandlebarsHelpers } from '../utils/handlebars';
import { formatHtmlWithWrapper, trimPreview } from '../utils/html';
import { slugify } from '../utils/string';
import { resolveModule } from '../utils/build';
import {
  bundleClientSource,
  clientArtifactFileName,
  CLIENT_RENDER_RUNTIME_SOURCE,
  generateRenderShellDocument,
  renderShellArtifactPath,
  renderShellFileName,
} from '../utils/render-shell';
import { createViteLogger } from '../utils/vite-logger';

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
  OUTPUT_FORMAT: 'handlebars',
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
  injectFieldWrappers: boolean,
  handoff: Handoff,
  sharedArtifacts: SharedArtifactPresence,
  componentArtifacts: ComponentArtifactPresence
): Promise<string> {
  // Register Handlebars helpers with current injection state
  registerHandlebarsHelpers(
    { id: componentData.id, properties: componentData.properties || {} },
    injectFieldWrappers,
    handoff.config?.hooks?.registerHandlebarsHelpers
  );

  const context = createHandlebarsContext({ 
    id: componentData.id, 
    properties: componentData.properties || {}, 
    title: componentData.title 
  }, previewData, {
    includeSharedStyles: Boolean(componentData.sharedStyles),
    sharedArtifacts,
    componentArtifacts,
  });
  
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

// Helpers from `hooks.registerHandlebarsHelpers` exist only in the build, so a template that uses one fails in the browser.
function generateHandlebarsClientSource(
  runtimePath: string,
  templateSpec: string,
  context: { style: string; script: string; fields: unknown; title: string }
): string {
  return `
    import Handlebars from '${normalizePath(runtimePath)}';
    ${CLIENT_RENDER_RUNTIME_SOURCE}

    Handlebars.registerHelper('field', function (_field, options) {
      return options.fn(this);
    });
    Handlebars.registerHelper('eq', (a, b) => a === b);

    const template = Handlebars.template(${templateSpec});
    const context = ${JSON.stringify(context)};
    const loadedScripts = new Set();

    // Nodes parsed by DOMParser are inert; a script runs only when created in this document.
    const activate = (node) => {
      if (node.nodeName !== 'SCRIPT') return document.importNode(node, true);
      const script = document.createElement('script');
      for (const attribute of node.attributes) script.setAttribute(attribute.name, attribute.value);
      script.textContent = node.textContent;
      return script;
    };
    const keep = (node) => !(node.nodeName === 'SCRIPT' && node.src && loadedScripts.has(node.src));
    const remember = (node) => node.nodeName === 'SCRIPT' && node.src && loadedScripts.add(node.src);

    let headApplied = false;
    startClientRender((args) => {
      const parsed = new DOMParser().parseFromString(template({ ...context, properties: args }), 'text/html');
      if (!headApplied) {
        for (const node of Array.from(parsed.head.childNodes)) {
          if (node.nodeName === 'TITLE') continue;
          remember(node);
          document.head.appendChild(activate(node));
        }
        headApplied = true;
      }
      const root = document.getElementById('root');
      const nodes = Array.from(parsed.body.childNodes).filter(keep);
      nodes.forEach(remember);
      root.replaceChildren(...nodes.map(activate));
    });
  `;
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
    config: () => ({
      customLogger: createViteLogger(),
    }),
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

      if (!componentData.previews || Object.keys(componentData.previews).length === 0) {
        Logger.warn(`No previews defined for ${componentId}; using default preview values.`);
        componentData.previews = {
          default: {
            title: 'Default',
            values: {},
            url: '',
          },
        };
      }

      const generatedPreviews: { [key: string]: string } = {};

      // Resolve which shared/global and component-owned artifacts exist so generated HTML references
      // them only when present. These are built before component HTML, so this reflects final state.
      const sharedArtifacts = resolveSharedArtifactPresence(handoff);
      const componentArtifacts = resolveComponentArtifactPresence(handoff, componentId);

      // Generate previews for each variation
      for (const previewKey in componentData.previews) {
        try {
          const previewData = componentData.previews[previewKey];

          // Render both normal and inspect modes
          const normalModeHtml = await renderHandlebarsTemplate(
            templateContent,
            componentData,
            previewData,
            false,
            handoff,
            sharedArtifacts,
            componentArtifacts
          );

          const inspectModeHtml = await renderHandlebarsTemplate(
            templateContent,
            componentData,
            previewData,
            true,
            handoff,
            sharedArtifacts,
            componentArtifacts
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
          
          Logger.debug(`Generated Handlebars preview: ${componentId}-${previewKey}`);
        } catch (err) {
          Logger.error(`Failed to generate Handlebars preview for ${componentId}-${previewKey}`, err);
        }
      }

      try {
        const context = createHandlebarsContext(
          { id: componentId, properties: componentData.properties || {}, title: componentData.title },
          { values: {} },
          { includeSharedStyles: Boolean(componentData.sharedStyles), sharedArtifacts, componentArtifacts }
        );
        const clientBundle = await bundleClientSource(
          generateHandlebarsClientSource(resolveModule('handlebars/runtime', [handoff.modulePath, handoff.workingPath]), Handlebars.precompile(templateContent) as string, {
            style: context.style,
            script: context.script,
            fields: context.fields,
            title: context.title,
          }),
          handoff,
          componentId
        );
        if (clientBundle) {
          this.emitFile({ type: 'asset', fileName: clientArtifactFileName(componentId), source: clientBundle });
          this.emitFile({
            type: 'asset',
            fileName: renderShellFileName(componentId),
            source: generateRenderShellDocument({ componentId, title: componentData.title || componentId, head: '' }),
          });
          componentData.customPreview = { renderUrl: renderShellArtifactPath(componentId) };
        } else {
          delete componentData.customPreview;
        }
      } catch (err) {
        delete componentData.customPreview;
        Logger.error(`Failed to build the custom preview shell for ${componentId}`, err);
      }

      // Update component data with results
      componentData.format = PLUGIN_CONSTANTS.OUTPUT_FORMAT;
      componentData.preview = '';
      componentData.code = trimPreview(templateContent);
      const firstGeneratedPreview = Object.values(generatedPreviews)[0];
      componentData.html = trimPreview(firstGeneratedPreview ?? templateContent);
    },
  };
}
