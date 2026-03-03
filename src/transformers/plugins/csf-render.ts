import fs from 'fs-extra';
import { Types as CoreTypes } from 'handoff-core';
import { startCase } from 'lodash';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Plugin } from 'vite';
import Handoff from '../..';
import { Logger } from '../../utils/logger';
import { SlotMetadata, SlotType } from '../preview/component';
import { TransformComponentTokensResult } from '../preview/types';
import { formatHtml, trimPreview } from '../utils/html';
import { buildAndEvaluateModule } from '../utils/module';
import { ensureIds } from '../utils/schema';
import { createViteLogger } from '../utils/vite-logger';
import { generateDocsArtifact, getPropertiesForComponentFromDocs } from '../docgen';

type StoryObject = {
  name?: string;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
  render?: (args: Record<string, any>) => any;
};

type CsfMeta = {
  title?: string;
  component?: React.ComponentType<any>;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
  render?: (args: Record<string, any>) => any;
};

const PLUGIN_CONSTANTS = {
  PLUGIN_NAME: 'vite-plugin-csf-render',
  SCRIPT_ID: 'script',
  DUMMY_EXPORT: 'export default {}',
  INSPECT_SUFFIX: '-inspect',
} as const;

function inferSlotType(controlType: string | undefined, value: any): SlotType {
  const normalizedControl = (controlType || '').toLowerCase();
  if (normalizedControl === 'boolean') return SlotType.BOOLEAN;
  if (normalizedControl === 'number' || normalizedControl === 'range') return SlotType.NUMBER;
  if (normalizedControl === 'select' || normalizedControl === 'radio' || normalizedControl === 'inline-radio') return SlotType.ENUM;
  if (normalizedControl === 'object') return SlotType.OBJECT;
  if (normalizedControl === 'array') return SlotType.ARRAY;

  if (typeof value === 'boolean') return SlotType.BOOLEAN;
  if (typeof value === 'number') return SlotType.NUMBER;
  if (Array.isArray(value)) return SlotType.ARRAY;
  if (value && typeof value === 'object') {
    if (typeof value.src === 'string' && typeof value.alt === 'string') return SlotType.IMAGE;
    if ((typeof value.label === 'string' || typeof value.text === 'string') && (typeof value.url === 'string' || typeof value.href === 'string')) {
      return SlotType.BUTTON;
    }
    return SlotType.OBJECT;
  }
  return SlotType.TEXT;
}

function createSlotMetadata(
  key: string,
  argType: any,
  value: any
): SlotMetadata {
  const controlType = typeof argType?.control === 'string' ? argType.control : argType?.control?.type;
  const type = inferSlotType(controlType, value);
  return {
    id: key,
    name: argType?.name || startCase(key),
    description: argType?.description || '',
    generic: argType?.type?.name || typeof value,
    type,
    default: value as any,
    rules: {
      required: !!argType?.required,
    },
  };
}

function getStoryEntries(moduleExports: Record<string, any>): Array<[string, StoryObject]> {
  return Object.entries(moduleExports).filter(([key, value]) => {
    if (key === 'default' || key === '__esModule') return false;
    if (typeof value === 'function') return true;
    if (value && typeof value === 'object') return true;
    return false;
  }) as Array<[string, StoryObject]>;
}

function toReactElement(
  renderResult: any,
  meta: CsfMeta,
  args: Record<string, any>
): React.ReactElement {
  if (React.isValidElement(renderResult)) {
    return renderResult;
  }
  if (typeof renderResult === 'string' || typeof renderResult === 'number') {
    return React.createElement(React.Fragment, null, renderResult);
  }
  if (Array.isArray(renderResult)) {
    return React.createElement(React.Fragment, null, ...renderResult);
  }
  if (meta.component) {
    return React.createElement(meta.component, args);
  }
  return React.createElement('pre', null, JSON.stringify(args, null, 2));
}

function safeRenderToHtml(
  meta: CsfMeta,
  story: StoryObject | ((args: Record<string, any>) => any),
  args: Record<string, any>
): string {
  try {
    const storyRender = typeof story === 'function' ? story : story.render;
    const render = storyRender || meta.render;

    if (render) {
      return ReactDOMServer.renderToString(toReactElement(render(args), meta, args));
    }

    if (meta.component) {
      return ReactDOMServer.renderToString(React.createElement(meta.component, args));
    }

    return ReactDOMServer.renderToString(React.createElement('pre', null, JSON.stringify(args, null, 2)));
  } catch (error) {
    Logger.warn(`SSR render failed for story, falling back to static placeholder: ${error}`);
    return `<div style="padding:1rem;color:#b91c1c;font-family:monospace;font-size:13px">Render error: ${String(error)}</div>`;
  }
}

function createHtmlDocument(componentId: string, previewTitle: string, renderedHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/component/main.css" />
    <link rel="stylesheet" href="${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/component/${componentId}.css" />
    <link rel="stylesheet" href="${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/css/preview.css" />
    <title>${previewTitle}</title>
  </head>
  <body>
    <div id="root">${renderedHtml}</div>
  </body>
</html>`;
}

export function csfRenderPlugin(
  componentData: TransformComponentTokensResult,
  _documentationComponents: CoreTypes.IDocumentationObject['components'],
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
    async generateBundle(_, bundle) {
      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        if (chunkInfo.type === 'chunk' && fileName.includes(PLUGIN_CONSTANTS.SCRIPT_ID)) {
          delete bundle[fileName];
        }
      }

      const componentId = componentData.id;
      const templatePath = path.resolve(componentData.entries.template);
      const sourceCode = await fs.readFile(templatePath, 'utf8');

      let moduleExports: Record<string, any>;
      try {
        const loaded = await buildAndEvaluateModule(templatePath, handoff);
        moduleExports = loaded.exports as Record<string, any>;
      } catch (error) {
        Logger.error(`Failed to evaluate CSF template for ${componentId}`, error);
        return;
      }

      const meta = (moduleExports.default || {}) as CsfMeta;
      const stories = getStoryEntries(moduleExports);

      if (stories.length === 0) {
        Logger.warn(`No named stories found in CSF file for ${componentId}: ${templatePath}`);
        return;
      }

      const explicitProperties = componentData.properties || {};
      const generatedProperties: Record<string, SlotMetadata> = { ...explicitProperties };

      // Include all named stories as previews and infer properties from args/argTypes
      componentData.previews = {};

      for (const [storyKey, storyValue] of stories) {
        const storyObj = (typeof storyValue === 'function' ? {} : storyValue) as StoryObject;
        const mergedArgs = {
          ...(meta.args || {}),
          ...(storyObj.args || {}),
        };
        const mergedArgTypes = {
          ...(meta.argTypes || {}),
          ...(storyObj.argTypes || {}),
        };

        componentData.previews[storyKey] = {
          title: storyObj.name || startCase(storyKey),
          values: mergedArgs,
          url: '',
        };

        for (const [argKey, argValue] of Object.entries(mergedArgs)) {
          if (!generatedProperties[argKey]) {
            generatedProperties[argKey] = createSlotMetadata(argKey, mergedArgTypes[argKey], argValue);
          }
        }

        for (const [argKey, argType] of Object.entries(mergedArgTypes)) {
          if (!generatedProperties[argKey]) {
            generatedProperties[argKey] = createSlotMetadata(argKey, argType, mergedArgs[argKey]);
          }
        }
      }

      // Enrich with docgen: descend into array/object types (e.g. cards[].image, title, link)
      const generatedDocs = await generateDocsArtifact(templatePath, handoff);
      const componentName =
        (meta.component as any)?.displayName || (meta.component as any)?.name;
      if (generatedDocs && componentName) {
        const docgenProperties = getPropertiesForComponentFromDocs(
          generatedDocs,
          componentName
        );
        if (docgenProperties) {
          for (const [propKey, docgenProp] of Object.entries(docgenProperties)) {
            const hasNestedShape =
              (docgenProp.items?.properties && Object.keys(docgenProp.items.properties).length > 0) ||
              (docgenProp.properties && Object.keys(docgenProp.properties).length > 0);
            if (hasNestedShape) {
              const existing = generatedProperties[propKey];
              generatedProperties[propKey] = existing
                ? {
                    ...existing,
                    generic: docgenProp.generic || existing.generic,
                    docgenType: docgenProp.docgenType,
                    deepType: docgenProp.deepType,
                    items: docgenProp.items,
                    properties: docgenProp.properties,
                  }
                : docgenProp;
            }
          }
        }
      }

      // Value-based fallback: infer array item shape from first story args when docgen didn't provide it
      const firstPreviewValues = componentData.previews[Object.keys(componentData.previews)[0]]?.values || {};
      for (const [argKey, prop] of Object.entries(generatedProperties)) {
        if (prop.type !== SlotType.ARRAY) continue;
        if (prop.items?.properties && Object.keys(prop.items.properties).length > 0) continue;
        const val = firstPreviewValues[argKey];
        if (!Array.isArray(val) || val.length === 0) continue;
        const firstEl = val[0];
        if (!firstEl || typeof firstEl !== 'object') continue;
        const itemProperties: Record<string, SlotMetadata> = {};
        for (const [itemKey, itemValue] of Object.entries(firstEl)) {
          itemProperties[itemKey] = createSlotMetadata(itemKey, undefined, itemValue);
        }
        prop.items = {
          type: SlotType.OBJECT,
          properties: itemProperties,
        };
      }

      componentData.properties = ensureIds(generatedProperties);

      let lastHtml = '';
      for (const [storyKey, storyValue] of stories) {
        const preview = componentData.previews[storyKey];
        const rendered = safeRenderToHtml(meta, storyValue, preview.values || {});
        const html = await formatHtml(createHtmlDocument(componentId, preview.title, rendered));
        const fileName = `${componentId}-${storyKey}.html`;

        this.emitFile({
          type: 'asset',
          fileName,
          source: html,
        });
        this.emitFile({
          type: 'asset',
          fileName: `${componentId}-${storyKey}${PLUGIN_CONSTANTS.INSPECT_SUFFIX}.html`,
          source: html,
        });

        preview.url = fileName;
        lastHtml = html;
      }

      componentData.format = 'react';
      componentData.preview = '';
      componentData.code = trimPreview(sourceCode);
      componentData.html = trimPreview(lastHtml);
    },
  };
}
