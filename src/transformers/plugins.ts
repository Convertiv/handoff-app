import esbuild from 'esbuild';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { Types as CoreTypes } from 'handoff-core';
import { parse } from 'node-html-parser';
import path from 'path';
import prettier from 'prettier';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Plugin, normalizePath } from 'vite';
import Handoff from '..';
import { SlotMetadata } from './preview/component';
import { OptionalPreviewRender, TransformComponentTokensResult } from './preview/types';

const ensureIds = (properties: { [key: string]: SlotMetadata }) => {
  for (const key in properties) {
    properties[key].id = key;
    if (properties[key].items?.properties) {
      ensureIds(properties[key].items.properties);
    }
    if (properties[key].properties) {
      ensureIds(properties[key].properties);
    }
  }
  return properties;
};

const trimPreview = (preview: string) => {
  const bodyEl = parse(preview).querySelector('body');
  const code = bodyEl ? bodyEl.innerHTML.trim() : preview;
  return code;
};

export function handlebarsPreviewsPlugin(
  data: TransformComponentTokensResult,
  components: CoreTypes.IDocumentationObject['components'],
  handoff: Handoff
): Plugin {
  return {
    name: 'vite-plugin-previews',
    apply: 'build',
    resolveId(id) {
      if (id === 'script') {
        return id;
      }
    },
    load(id) {
      if (id === 'script') {
        return 'export default {}'; // dummy minimal entry
      }
    },
    async generateBundle() {
      const id = data.id;

      const templatePath = path.resolve(data.entries.template);
      const template = await fs.readFile(templatePath, 'utf8');

      let injectFieldWrappers = false;

      // Common Handlebars helpers
      Handlebars.registerHelper('field', function (field, options) {
        if (injectFieldWrappers) {
          if (!field) {
            console.error(`Missing field declaration for ${id}`);
            return options.fn(this);
          }
          let parts = field.split('.');
          let current: any = data.properties;
          for (const part of parts) {
            if (current?.type === 'object') current = current.properties;
            else if (current?.type === 'array') current = current.items.properties;
            current = current?.[part];
          }
          if (!current) {
            console.error(`Undefined field path for ${id}`);
            return options.fn(this);
          }
          return new Handlebars.SafeString(
            `<span class="handoff-field handoff-field-${current?.type || 'unknown'}" data-handoff-field="${field}" data-handoff="${encodeURIComponent(JSON.stringify(current))}">${options.fn(this)}</span>`
          );
        } else {
          return options.fn(this);
        }
      });

      Handlebars.registerHelper('eq', function (a, b) {
        return a === b;
      });

      if (!components) components = {};

      const previews = {};

      const renderTemplate = async (previewData: OptionalPreviewRender, inspect: boolean) => {
        injectFieldWrappers = inspect;

        const compiled = Handlebars.compile(template)({
          style: `<link rel="stylesheet" href="/api/component/shared.css"><link rel="stylesheet" href="/api/component/${id}.css">\n<link rel="stylesheet" href="/assets/css/preview.css">`,
          script: `<script src="/api/component/${id}.js"></script>\n<script src="/assets/js/preview.js"></script><script>var fields = ${JSON.stringify(data.properties)};</script>`,
          properties: previewData.values || {},
          fields: ensureIds(data.properties),
        });

        return await prettier.format(compiled, { parser: 'html' });
      };

      if (components[data.id]) {
        for (const instance of components[data.id].instances) {
          const variationId = instance.id;
          const values = Object.fromEntries(instance.variantProperties);

          data.previews[variationId] = {
            title: variationId,
            url: '',
            values,
          };
        }
      }

      for (const key in data.previews) {
        const htmlNormal = await renderTemplate(data.previews[key], false);
        const htmlInspect = await renderTemplate(data.previews[key], true);

        this.emitFile({
          type: 'asset',
          fileName: `${id}-${key}.html`,
          source: htmlNormal,
        });
        this.emitFile({
          type: 'asset',
          fileName: `${id}-${key}-inspect.html`,
          source: htmlInspect,
        });

        previews[key] = htmlNormal;
        data.previews[key].url = `${id}-${key}.html`;
      }

      data.preview = '';
      data.code = trimPreview(template);
    },
  };
}

export function ssrRenderPlugin(
  data: TransformComponentTokensResult,
  components: CoreTypes.IDocumentationObject['components'],
  handoff?: Handoff
): import('vite').Plugin {
  return {
    name: 'vite-plugin-ssr-static-render',
    apply: 'build',
    resolveId(id) {
      if (id === 'script') {
        return id;
      }
    },
    load(id) {
      if (id === 'script') {
        return 'export default {}'; // dummy minimal entry
      }
    },
    async generateBundle(_, bundle) {
      // Delete all JS chunks
      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        if (chunkInfo.type === 'chunk' && fileName.includes('script')) {
          delete bundle[fileName];
        }
      }

      const id = data.id;

      const entry = path.resolve(data.entries.template);

      // 1. Compile the component to CommonJS in memory
      const ssrBuild = await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        write: false,
        format: 'cjs',
        platform: 'node',
        jsx: 'automatic',
        external: ['react', 'react-dom'],
      });

      // 2. Evaluate the compiled code
      const { text: serverCode } = ssrBuild.outputFiles[0];
      const mod: any = { exports: {} };
      const func = new Function('require', 'module', 'exports', serverCode);
      func(require, mod, mod.exports);

      const Component = mod.exports.default;

      if (!components) components = {};

      const previews = {};

      if (components[data.id]) {
        for (const instance of components[data.id].instances) {
          const variationId = instance.id;
          const values = Object.fromEntries(instance.variantProperties);

          data.previews[variationId] = {
            title: variationId,
            url: '',
            values,
          };
        }
      }

      for (const key in data.previews) {
        const props = { properties: data.previews[key].values };
        const renderedHtml = ReactDOMServer.renderToString(React.createElement(Component, { properties: data.previews[key].values }));

        // 3. Hydration source: baked-in, references user entry
        const clientSource = `
          import React from 'react';
          import { hydrateRoot } from 'react-dom/client';
          import Component from '${normalizePath(entry)}';

          const raw = document.getElementById('__APP_PROPS__')?.textContent || '{}';
          const props = JSON.parse(raw);
          hydrateRoot(document.getElementById('root'), <Component {...props} />);
        `;

        const bundledClient = await esbuild.build({
          stdin: {
            contents: clientSource,
            resolveDir: process.cwd(),
            loader: 'tsx',
          },
          bundle: true,
          write: false,
          format: 'esm',
          platform: 'browser',
          jsx: 'automatic',
          sourcemap: false,
          minify: false,
          plugins: [
            {
              name: 'handoff-resolve-react',
              setup(build) {
                build.onResolve({ filter: /^react$/ }, () => ({
                  path: path.join(handoff.modulePath, 'node_modules/react/index.js'),
                }));
                build.onResolve({ filter: /^react-dom\/client$/ }, () => ({
                  path: path.join(handoff.modulePath, 'node_modules/react-dom/client.js'),
                }));
                build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
                  path: path.join(handoff.modulePath, 'node_modules/react/jsx-runtime.js'),
                }));
              },
            },
          ],
        });

        const inlinedJs = bundledClient.outputFiles[0].text;

        // 4. Emit fully inlined HTML
        const fullHtml = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <script id="__APP_PROPS__" type="application/json">${JSON.stringify(props)}</script>
            <script type="module">
              ${inlinedJs}
            </script>
          </head>
          <body>
            <div id="root">${renderedHtml}</div>
          </body>
        </html>`;

        this.emitFile({
          type: 'asset',
          fileName: `${id}-${key}.html`,
          source: fullHtml,
        });

        // TODO: Currently contains the same data as the first emitted file. Should be resolved before release.
        this.emitFile({
          type: 'asset',
          fileName: `${id}-${key}-inspect.html`,
          source: `<!DOCTYPE html>\n${fullHtml}`,
        });

        previews[key] = fullHtml;
        data.previews[key].url = `${id}-${key}.html`;
      }

      data.preview = '';
      data.code = trimPreview('TEST');
    },
  };
}
