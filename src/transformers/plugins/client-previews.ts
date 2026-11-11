import fs from 'fs-extra';
import { Types as CoreTypes } from 'handoff-core';
import type { Plugin, ResolvedConfig, Rollup } from 'vite';
import Handoff from '../..';
import type { SlotMetadata } from '../preview/component';
import { addFigmaInstancePreviews, getDocumentedPreviews } from '../preview/component/previews';
import { resolveComponentArtifactPresence, resolveSharedArtifactPresence } from '../preview/component/shared-artifacts';
import { OptionalPreviewRender, TransformComponentTokensResult } from '../preview/types';
import { frameDocumentFor } from '../utils/frame-layout';
import { formatHtml, trimPreview } from '../utils/html';
import {
  clientArtifactFileName,
  generatePreviewDocument,
  generateRenderShellDocument,
  PREVIEW_ENTRY_ID,
  previewFileName,
  renderShellArtifactPath,
  renderShellFileName,
  renderShellHead,
} from '../utils/render-shell';
import { collectStylesheetDependencies } from '../utils/stylesheets';

type DocumentationComponents = CoreTypes.IDocumentationObject['components'] | undefined;

export type ClientPreviewsInput = {
  componentData: TransformComponentTokensResult;
  documentationComponents: DocumentationComponents;
  handoff: Handoff;
  /** `componentData.format`, which picks the code view in the docs app. */
  format: string;
  /** The implementation source that the docs show. */
  code: string;
  usage: (values: Record<string, any>) => string;
  /** Server-rendered markup that the client artifact hydrates. A renderer without a server render omits it. */
  markup?: (preview: OptionalPreviewRender) => string;
};

/**
 * Emits the documents of a renderer whose client artifact (`component/<id>.client.js`) renders its
 * previews: one preview document per preview, its inspect twin, and the custom preview render shell.
 * It also fills the component record. The client artifact itself is the caller's.
 */
export const emitClientPreviews = async (emitFile: (file: Rollup.EmittedAsset) => unknown, input: ClientPreviewsInput): Promise<void> => {
  const { componentData, handoff } = input;
  const componentId = componentData.id;
  addFigmaInstancePreviews(componentData, input.documentationComponents);

  const sharedArtifacts = resolveSharedArtifactPresence(handoff);
  const componentArtifacts = resolveComponentArtifactPresence(handoff, componentId);
  const documents: Record<string, string> = {};

  for (const [previewKey, preview] of Object.entries(componentData.previews)) {
    const values = preview.values ?? {};
    const document = frameDocumentFor(
      componentData.type,
      generatePreviewDocument({
        componentId,
        // A synthetic pattern preview is not a declared preview, so the client looks up its source.
        previewKey: preview.sourcePreview ?? previewKey,
        title: preview.title,
        markup: input.markup?.(preview) ?? '',
        props: values,
        sharedArtifacts,
        componentArtifacts,
      })
    );
    emitFile({ type: 'asset', fileName: previewFileName(componentId, previewKey), source: document });
    // Only Handlebars marks fields for inspect mode; the other renderers serve the same document.
    emitFile({ type: 'asset', fileName: previewFileName(componentId, previewKey, true), source: document });
    preview.url = previewFileName(componentId, previewKey);
    preview.usage = input.usage(values);
    documents[previewKey] = document;
  }

  emitFile({
    type: 'asset',
    fileName: renderShellFileName(componentId),
    source: frameDocumentFor(
      componentData.type,
      generateRenderShellDocument({
        componentId,
        title: componentData.title || componentId,
        head: renderShellHead(sharedArtifacts, componentArtifacts, componentId),
      })
    ),
  });
  componentData.customPreview = { renderUrl: renderShellArtifactPath(componentId) };

  const firstKey = Object.keys(getDocumentedPreviews(componentData.previews))[0] ?? Object.keys(componentData.previews)[0];
  componentData.format = input.format;
  componentData.preview = '';
  componentData.code = trimPreview(input.code);
  componentData.usage = firstKey ? componentData.previews[firstKey].usage : '';
  // A document without server markup shows nothing of the component, so the HTML view is left out.
  componentData.html = input.markup && firstKey ? trimPreview(await formatHtml(documents[firstKey])) : '';
};

/**
 * What a renderer whose previews render only in the browser supplies. The preview build bundles
 * `clientSource` into the client artifact, with the renderer's own Vite plugins compiling the
 * component, and `clientRenderPlugin` emits every document around it.
 */
export type ClientRenderer = {
  format: string;
  /** The component file. The client source resolves its imports from here, so both share one copy of the framework. */
  entry: string;
  /**
   * Source of the client artifact. It calls `mountPreviews(componentId, mount)` from
   * `CLIENT_RENDER_RUNTIME_SOURCE`, where `mount(container, { hydrate })` returns a `render(args)` function.
   */
  clientSource: string;
  properties: Record<string, SlotMetadata>;
  usage: (values: Record<string, any>) => string;
  /**
   * Files the compiler reads outside the module graph, such as templates and stylesheets, so the build
   * cache tracks them. The files that a stylesheet loads are tracked too.
   */
  watchFiles?: string[];
};

const CLIENT_MODULE_ID = '\0handoff-client';

export const clientRenderPlugin = (
  componentData: TransformComponentTokensResult,
  documentationComponents: DocumentationComponents,
  handoff: Handoff,
  renderer: ClientRenderer
): Plugin => {
  let resolvedConfig: ResolvedConfig;
  return {
    name: 'handoff:client-render',
    apply: 'build',
    config: () => ({
      build: {
        rollupOptions: {
          // One file per component, like every client artifact, so publish and patterns can reference it.
          // `@defer` and other lazy imports load with it.
          output: { entryFileNames: clientArtifactFileName(componentData.id), inlineDynamicImports: true },
        },
      },
    }),
    configResolved(config) {
      resolvedConfig = config;
    },
    async buildStart() {
      const watchFiles = renderer.watchFiles ?? [];
      for (const file of watchFiles) this.addWatchFile(file);
      for (const file of await collectStylesheetDependencies(watchFiles, resolvedConfig)) this.addWatchFile(file);
    },
    resolveId(source, importer) {
      if (source === PREVIEW_ENTRY_ID) return CLIENT_MODULE_ID;
      if (importer === CLIENT_MODULE_ID) return this.resolve(source, renderer.entry, { skipSelf: true });
    },
    load(id) {
      if (id === CLIENT_MODULE_ID) return renderer.clientSource;
    },
    async generateBundle() {
      componentData.properties = renderer.properties;
      await emitClientPreviews((file) => this.emitFile(file), {
        componentData,
        documentationComponents,
        handoff,
        format: renderer.format,
        code: await fs.readFile(renderer.entry, 'utf8'),
        usage: renderer.usage,
      });
    },
  };
};
