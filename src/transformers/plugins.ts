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
          title: data.title,
        });

        return await prettier.format(`<html lang="en">${compiled}</html>`, { parser: 'html' });
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
      data.format = 'html';
      data.preview = '';
      data.code = trimPreview(template);
      data.html = trimPreview(previews[Object.keys(previews)[0]]);
    },
  };
}

async function buildAndEvaluateModule(entryPath: string, handoff?: Handoff): Promise<{ exports: any }> {
  // Default esbuild configuration
  const defaultBuildConfig: esbuild.BuildOptions = {
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    jsx: 'automatic',
    external: ['react', 'react-dom', '@opentelemetry/api'],
  };

  // Apply user's SSR build config hook if provided
  const buildConfig = handoff?.config?.hooks?.ssrBuildConfig ? handoff.config.hooks.ssrBuildConfig(defaultBuildConfig) : defaultBuildConfig;

  // Compile the module
  const build = await esbuild.build(buildConfig);
  const { text: code } = build.outputFiles[0];

  // Evaluate the compiled code
  const mod: any = { exports: {} };
  const func = new Function('require', 'module', 'exports', code);
  func(require, mod, mod.exports);

  return mod;
}

export function ssrRenderPlugin(
  data: TransformComponentTokensResult,
  components: CoreTypes.IDocumentationObject['components'],
  handoff?: Handoff
): Plugin {
  return {
    name: 'vite-plugin-ssr-static-render',
    apply: 'build',
    resolveId(id) {
      console.log('resolveId', id);
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
      const code = fs.readFileSync(entry, 'utf8');

      // Load schema if schema entry exists
      if (data.entries?.schema) {
        const schemaPath = path.resolve(data.entries.schema);
        const ext = path.extname(schemaPath);
        if (ext === '.ts' || ext === '.tsx') {
          // Build and evaluate schema module
          const schemaMod = await buildAndEvaluateModule(schemaPath, handoff);

          // Get schema from exports using hook or default to exports.default
          const schema = handoff?.config?.hooks?.getSchemaFromExports
            ? handoff.config.hooks.getSchemaFromExports(schemaMod.exports)
            : schemaMod.exports.default;

          // Apply schema to properties if schema exists and is valid
          if (schema?.type === 'object') {
            if (handoff?.config?.hooks?.schemaToProperties) {
              data.properties = handoff.config.hooks.schemaToProperties(schema);
            }
          }
        }
      }

      // Build and evaluate component module
      const mod = await buildAndEvaluateModule(entry, handoff);
      const Component = mod.exports.default;

      // Look for exported schema in component file only if no separate schema file was provided
      if (!data.entries?.schema) {
        // Get schema from exports using hook or default to exports.schema
        const schema = handoff?.config?.hooks?.getSchemaFromExports
          ? handoff.config.hooks.getSchemaFromExports(mod.exports)
          : mod.exports.schema;

        if (schema?.type === 'object') {
          if (handoff?.config?.hooks?.schemaToProperties) {
            data.properties = handoff.config.hooks.schemaToProperties(schema);
          }
        }
      }

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

      let html = '';

      for (const key in data.previews) {
        const props = data.previews[key].values;
        const renderedHtml = ReactDOMServer.renderToString(React.createElement(Component, data.previews[key].values));

        // 3. Hydration source: baked-in, references user entry
        const clientSource = `
          import React from 'react';
          import { hydrateRoot } from 'react-dom/client';
          import Component from '${normalizePath(entry)}';

          const raw = document.getElementById('__APP_PROPS__')?.textContent || '{}';
          const props = JSON.parse(raw);
          hydrateRoot(document.getElementById('root'), <Component {...props} block={props} />);
        `;

        // Default client-side build configuration
        const defaultClientBuildConfig: esbuild.BuildOptions = {
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
          plugins: [handoffResolveReactEsbuildPlugin(handoff.workingPath, handoff.modulePath)],
        };

        // Apply user's client build config hook if provided
        const clientBuildConfig = handoff?.config?.hooks?.clientBuildConfig
          ? handoff.config.hooks.clientBuildConfig(defaultClientBuildConfig)
          : defaultClientBuildConfig;

        const bundledClient = await esbuild.build(clientBuildConfig);

        const inlinedJs = bundledClient.outputFiles[0].text;

        // 4. Emit fully inlined HTML
        html = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <script id="__APP_PROPS__" type="application/json">${JSON.stringify(props)}</script>
            <script type="module">
              ${inlinedJs}
            </script>
            <title>${data.previews[key].title}</title>
          </head>
          <body>
            <div id="root">${renderedHtml}</div>
          </body>
        </html>`;

        this.emitFile({
          type: 'asset',
          fileName: `${id}-${key}.html`,
          source: `<!DOCTYPE html>
<head>
  <link rel="stylesheet" href="/api/component/shared.css">
  <link rel="stylesheet" href="/api/component/${id}.css">
  <link rel="stylesheet" href="/assets/css/preview.css">
</head>
<body>
  ${pretty}
</body>`,
        });

        this.emitFile({
          type: 'asset',
          fileName: `${id}-${key}-inspect.html`,
          source: html,
        });

        previews[key] = html;
        data.previews[key].url = `${id}-${key}.html`;
      }

      html = await prettier.format(html, { parser: 'html' });

      data.preview = '';
      data.code = trimPreview(html);
    },
  };
}

function resolveModule(id: string, searchDirs: string[]): string {
  for (const dir of searchDirs) {
    try {
      const resolved = require.resolve(id, {
        paths: [path.resolve(dir)],
      });
      return resolved;
    } catch (_) {
      // skip
    }
  }
  throw new Error(`Module "${id}" not found in:\n${searchDirs.join('\n')}`);
}

function handoffResolveReactEsbuildPlugin(workingPath: string, handoffModulePath: string) {
  const searchDirs = [workingPath, path.join(handoffModulePath, 'node_modules')];

  return {
    name: 'handoff-resolve-react',
    setup(build: any) {
      build.onResolve({ filter: /^react$/ }, () => ({
        path: resolveModule('react', searchDirs),
      }));

      build.onResolve({ filter: /^react-dom\/client$/ }, () => ({
        path: resolveModule('react-dom/client', searchDirs),
      }));

      build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
        path: resolveModule('react/jsx-runtime', searchDirs),
      }));
    },
  };
}
