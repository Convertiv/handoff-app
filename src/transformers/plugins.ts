import esbuild from 'esbuild';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { Types as CoreTypes } from 'handoff-core';
import { parse } from 'node-html-parser';
import path from 'path';
import prettier from 'prettier';
import React from 'react';
import { withCustomConfig } from 'react-docgen-typescript';
import ReactDOMServer from 'react-dom/server';
import { Plugin, normalizePath } from 'vite';
import Handoff from '..';
import { SlotMetadata, SlotType } from './preview/component';
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

const convertDocgenToProperties = (docgenProps: any[]): { [key: string]: SlotMetadata } => {
  const properties: { [key: string]: SlotMetadata } = {};
  
  for (const prop of docgenProps) {
    const { name, type, required, description, defaultValue } = prop;
    
    // Convert react-docgen-typescript type to our SlotType enum
    let propType = SlotType.TEXT;
    if (type?.name === 'boolean') {
      propType = SlotType.BOOLEAN;
    } else if (type?.name === 'number') {
      propType = SlotType.NUMBER;
    } else if (type?.name === 'array') {
      propType = SlotType.ARRAY;
    } else if (type?.name === 'object') {
      propType = SlotType.OBJECT;
    } else if (type?.name === 'function') {
      propType = SlotType.FUNCTION;
    } else if (type?.name === 'enum') {
      propType = SlotType.ENUM;
    }
    
    properties[name] = {
      id: name,
      name: name,
      description: description || '',
      generic: '',
      type: propType,
      default: defaultValue?.value || undefined,
      rules: {
        required: required || false,
      },
    };
  }
  
  return properties;
};

/**
 * Validates if a schema object is valid for property conversion
 * @param schema - The schema object to validate
 * @returns True if schema is valid, false otherwise
 */
const isValidSchemaObject = (schema: any): boolean => {
  return schema && 
         typeof schema === 'object' && 
         schema.type === 'object' && 
         schema.properties && 
         typeof schema.properties === 'object';
};

/**
 * Safely loads schema from module exports
 * @param moduleExports - The module exports object
 * @param handoff - Handoff instance for configuration
 * @param exportKey - The export key to look for ('default' or 'schema')
 * @returns The schema object or null if not found/invalid
 */
const loadSchemaFromExports = (
  moduleExports: any, 
  handoff: Handoff, 
  exportKey: 'default' | 'schema' = 'default'
): any => {
  try {
    const schema = handoff.config?.hooks?.getSchemaFromExports
      ? handoff.config.hooks.getSchemaFromExports(moduleExports)
      : moduleExports[exportKey];
    
    return schema;
  } catch (error) {
    console.warn(`Failed to load schema from exports (${exportKey}):`, error);
    return null;
  }
};

/**
 * Generates component properties using react-docgen-typescript
 * @param entry - Path to the component/schema file
 * @param handoff - Handoff instance for configuration
 * @returns Generated properties or null if failed
 */
const generatePropertiesFromDocgen = async (
  entry: string, 
  handoff: Handoff
): Promise<{ [key: string]: SlotMetadata } | null> => {
  try {
    // Use root project's tsconfig.json
    const tsconfigPath = path.resolve(handoff.workingPath, 'tsconfig.json');
    
    // Check if tsconfig exists
    if (!fs.existsSync(tsconfigPath)) {
      console.warn(`TypeScript config not found at ${tsconfigPath}, using default configuration`);
    }
    
    const parser = withCustomConfig(tsconfigPath, {
      savePropValueAsString: true,
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    });
    
    const docgenResults = parser.parse(entry);
    
    if (docgenResults.length > 0) {
      const componentDoc = docgenResults[0];
      if (componentDoc.props && Object.keys(componentDoc.props).length > 0) {
        return convertDocgenToProperties(Object.values(componentDoc.props));
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to generate docs with react-docgen-typescript for ${entry}:`, error);
    return null;
  }
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

async function buildAndEvaluateModule(entryPath: string, handoff: Handoff): Promise<{ exports: any }> {
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
  const buildConfig = handoff.config?.hooks?.ssrBuildConfig
    ? handoff.config.hooks.ssrBuildConfig(defaultBuildConfig)
    : defaultBuildConfig;

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
  handoff: Handoff
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

      // Determine properties using a hierarchical approach
      let properties: { [key: string]: SlotMetadata } | null = null;
      let Component: any = null;

      // Step 1: Handle separate schema file (if exists)
      if (data.entries?.schema) {
        const schemaPath = path.resolve(data.entries.schema);
        const ext = path.extname(schemaPath);
        
        if (ext === '.ts' || ext === '.tsx') {
          try {
            const schemaMod = await buildAndEvaluateModule(schemaPath, handoff);
            
            // Get schema from exports.default (separate schema files export as default)
            const schema = loadSchemaFromExports(schemaMod.exports, handoff, 'default');

            if (isValidSchemaObject(schema)) {
              // Valid schema object - convert to properties
              if (handoff.config?.hooks?.schemaToProperties) {
                properties = handoff.config.hooks.schemaToProperties(schema);
              }
            } else if (schema) {
              // Schema exists but is not a valid schema object (e.g., type/interface)
              // Use react-docgen-typescript to document the schema file
              properties = await generatePropertiesFromDocgen(schemaPath, handoff);
            }
          } catch (error) {
            console.warn(`Failed to load separate schema file ${schemaPath}:`, error);
          }
        } else {
          console.warn(`Schema file has unsupported extension: ${ext}`);
        }
      }

      // Step 2: Load component and handle component-embedded schema (only if no separate schema)
      if (!data.entries?.schema) {
        try {
          const mod = await buildAndEvaluateModule(entry, handoff);
          Component = mod.exports.default;

          // Check for exported schema in component file (exports.schema)
          const schema = loadSchemaFromExports(mod.exports, handoff, 'schema');

          if (isValidSchemaObject(schema)) {
            // Valid schema object - convert to properties
            if (handoff.config?.hooks?.schemaToProperties) {
              properties = handoff.config.hooks.schemaToProperties(schema);
            }
          } else if (schema) {
            // Schema exists but is not a valid schema object (e.g., type/interface)
            // Use react-docgen-typescript to document the schema
            properties = await generatePropertiesFromDocgen(entry, handoff);
          } else {
            // No schema found - use react-docgen-typescript to analyze component props
            properties = await generatePropertiesFromDocgen(entry, handoff);
          }
        } catch (error) {
          console.warn(`Failed to load component file ${entry}:`, error);
        }
      }

      // Step 3: Load component for rendering (if not already loaded)
      if (!Component) {
        try {
          const mod = await buildAndEvaluateModule(entry, handoff);
          Component = mod.exports.default;
        } catch (error) {
          console.error(`Failed to load component for rendering: ${entry}`, error);
          return;
        }
      }

      // Apply the determined properties
      if (properties) {
        data.properties = properties;
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
        const renderedHtml = ReactDOMServer.renderToString(
          React.createElement(Component, { ...data.previews[key].values, block: { ...data.previews[key].values } })
        );
        const pretty = await prettier.format(renderedHtml, { parser: 'html' });

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
        const clientBuildConfig = handoff.config?.hooks?.clientBuildConfig
          ? handoff.config.hooks.clientBuildConfig(defaultClientBuildConfig)
          : defaultClientBuildConfig;

        const bundledClient = await esbuild.build(clientBuildConfig);

        const inlinedJs = bundledClient.outputFiles[0].text;

        // 4. Emit fully inlined HTML
        html = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="stylesheet" href="/api/component/main.css" />
            <link rel="stylesheet" href="/api/component/${id}.css" />
            <link rel="stylesheet" href="/assets/css/preview.css" />
            <script id="__APP_PROPS__" type="application/json">${JSON.stringify(props)}</script>
            <script type="module">
              ${inlinedJs}
            </script>
            <title>${data.previews[key].title}</title>
          </head>
          <body>
            <div id="root">${pretty}</div>
          </body>
        </html>`;

        this.emitFile({
          type: 'asset',
          fileName: `${id}-${key}.html`,
          source: html,
        });
        // TODO: remove this once we have a way to render inspect mode
        this.emitFile({
          type: 'asset',
          fileName: `${id}-${key}-inspect.html`,
          source: html,
        });

        previews[key] = html;
        data.previews[key].url = `${id}-${key}.html`;
      }

      html = await prettier.format(html, { parser: 'html' });
      data.format = 'react';

      data.preview = '';
      data.code = trimPreview(code);
      data.html = trimPreview(html);
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
