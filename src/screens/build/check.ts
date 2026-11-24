import esbuild from 'esbuild';
import { builtinModules, createRequire } from 'module';
import path from 'path';
import { isCollection, isScreenOptions, type AnyCollection } from '../define';
import * as screensRuntime from '../runtime';
import type { CollectionMeta, ToolMeta } from '../manifest';
import type { ScreenTool, ScreenToolsDefinition } from '../server';
import { describeIssues, schemaProblems, validateValue, withDefaults } from '../validate';
import type { ScreenFiles } from './declarations';

/**
 * Build checks of a screen's import graphs, and the build-time read of its collections and tools.
 *
 * - The UI graph (`index.tsx`) must not reach server code, the database or the CLI.
 * - The server graph (`collections.ts`, `tools.ts`) must not reach React, Next or UI files, and may
 *   take only the pure helpers from `handoff-app/screens`.
 * - `collections.ts` and `options.ts` are shared by both, so they must not import Node built-ins either.
 *
 * Bare package imports are not followed: they are checked by name and left external.
 */

export class ScreenBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScreenBuildError';
  }
}

export type { CollectionMeta, ToolMeta };

export interface ScreenCheckResult {
  collections: CollectionMeta[];
  tools: ToolMeta[];
  /** Declared options with schema defaults filled. */
  options: Record<string, unknown>;
}

/**
 * What `handoff-app/screens` offers to server files: its runtime values, no hooks or components.
 * The names are listed, not `export *`, so esbuild reports a hook imported in server code.
 */
const SERVER_SAFE_SCREENS_SOURCE = `export { ${Object.keys(screensRuntime)
  .filter((name) => name !== 'default')
  .join(', ')} } from ${JSON.stringify(path.join(__dirname, '..', 'runtime.js'))};`;

const DATABASE_PACKAGES = ['drizzle-orm', 'pg', 'postgres', '@neondatabase/serverless', 'drizzle-kit'];
const UI_PACKAGES = ['react', 'react-dom', 'next', 'next-auth', 'lucide-react'];
const NODE_BUILTINS = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

const packageName = (specifier: string): string => {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

const isBare = (specifier: string): boolean => !specifier.startsWith('.') && !path.isAbsolute(specifier);

const CODE_FILE = /\.(m?[jt]sx?|cjs|cts|mts)$/;

type Graph = 'ui' | 'collections' | 'options' | 'tools';

/** Graphs that the UI and the server both load. */
const isShared = (graph: Graph): boolean => graph === 'collections' || graph === 'options';

const FILE_LABEL: Record<Graph, string> = { ui: 'index.tsx', collections: 'collections.ts', options: 'options.ts', tools: 'tools.ts' };

interface GuardOptions {
  graph: Graph;
  screen: ScreenFiles;
  workingPath: string;
  problems: string[];
  /** Server graphs resolve `handoff-app/screens` to this file instead of leaving it external. */
  safeScreensModule?: string;
}

const relative = (workingPath: string, file: string): string => path.relative(workingPath, file) || file;

const guardPlugin = ({ graph, screen, workingPath, problems, safeScreensModule }: GuardOptions): esbuild.Plugin => ({
  name: 'handoff-screen-guard',
  setup(build) {
    const report = (importer: string, message: string) => {
      const entry = `${relative(workingPath, importer)}: ${message}`;
      if (!problems.includes(entry)) problems.push(entry);
    };

    build.onResolve({ filter: /.*/ }, async (args) => {
      if (args.kind === 'entry-point' || args.pluginData?.guarded) return undefined;
      const specifier = args.path;
      const importer = args.importer;

      if (isBare(specifier)) {
        const name = packageName(specifier);
        if (specifier.startsWith('@handoff/')) {
          report(
            importer,
            `imports "${specifier}", an internal module. Use "handoff-app/screens"${graph === 'tools' ? ' or "handoff-app/screens/server"' : ''}.`
          );
        } else if (DATABASE_PACKAGES.includes(name)) {
          report(
            importer,
            `imports "${specifier}". Screens never use the database directly. Read and write through the collection stores (useDocument in the UI, collections.get() in tools.ts).`
          );
        } else if (name === 'handoff-app') {
          if (specifier === 'handoff-app/screens/server') {
            if (graph !== 'tools') {
              report(
                importer,
                `imports "handoff-app/screens/server", which is server code. Import it only from tools.ts; ${graph === 'ui' ? 'UI files use "handoff-app/screens"' : `${FILE_LABEL[graph]} uses "handoff-app/screens"`}.`
              );
            }
          } else if (specifier === 'handoff-app/screens') {
            if (safeScreensModule) return { path: safeScreensModule, namespace: 'handoff-screens-safe' };
          } else {
            report(
              importer,
              `imports "${specifier}", which loads the Handoff CLI. Import from "handoff-app/screens" or "handoff-app/screens/server".`
            );
          }
        } else if (graph !== 'ui' && UI_PACKAGES.includes(name)) {
          report(
            importer,
            `imports "${specifier}", which is UI code. collections.ts, options.ts, tools.ts and the files they import run on the server; move this import to index.tsx or a file only the UI imports.`
          );
        } else if (isShared(graph) && NODE_BUILTINS.has(specifier)) {
          report(
            importer,
            `imports "${specifier}". ${FILE_LABEL[graph]} is shared by the UI and the server, so it cannot use Node built-ins. Move this code to tools.ts.`
          );
        } else if (graph === 'ui' && NODE_BUILTINS.has(specifier)) {
          report(importer, `imports the Node built-in "${specifier}" in UI code, which runs in the browser.`);
        }
        return { path: specifier, external: true };
      }

      const resolved = await build.resolve(specifier, { kind: args.kind, resolveDir: args.resolveDir, pluginData: { guarded: true } });
      if (resolved.errors.length > 0) return undefined;
      const file = resolved.path;
      if (!CODE_FILE.test(file)) return { path: file, external: true };
      if (graph === 'ui' && screen.tools && file === screen.tools) {
        report(importer, `imports tools.ts, which is server code. The UI reaches tools only through the assistant.`);
      }
      if (graph !== 'ui' && (file === screen.ui || /\.[jt]sx$/.test(file))) {
        report(
          importer,
          `imports ${relative(workingPath, file)}, which is UI code, from server code. Move shared values to collections.ts or a .ts file.`
        );
      }
      return undefined;
    });

    build.onLoad({ filter: /.*/, namespace: 'handoff-screens-safe' }, () => ({
      contents: SERVER_SAFE_SCREENS_SOURCE,
      resolveDir: path.join(__dirname, '..'),
      loader: 'js',
    }));
  },
});

const MISSING_EXPORT = /No matching export in "([^"]+)" for import "([^"]+)"/;

/** Turn esbuild's errors into one message per problem, naming the file. */
const describeBuildFailure = (error: unknown, graph: Graph, workingPath: string): string[] => {
  const messages = (error as esbuild.BuildFailure).errors ?? [{ text: String(error) } as esbuild.Message];
  return messages.map((message) => {
    const file = message.location
      ? `${relative(workingPath, path.resolve(workingPath, message.location.file))}:${message.location.line}`
      : '';
    const missing = MISSING_EXPORT.exec(message.text);
    if (missing && missing[1].includes('handoff-screens-safe')) {
      return `${file}: imports "${missing[2]}" from "handoff-app/screens" in server code. ${FILE_LABEL[graph]} may use only defineCollection, types and the pure helpers; hooks and components belong in index.tsx.`;
    }
    return `${file ? `${file}: ` : ''}${message.text}`;
  });
};

const bundle = async (entry: string, options: GuardOptions, platform: 'browser' | 'node'): Promise<string | null> => {
  try {
    const result = await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      platform,
      format: platform === 'node' ? 'cjs' : 'esm',
      target: platform === 'node' ? 'node22' : 'es2020',
      jsx: 'automatic',
      logLevel: 'silent',
      plugins: [guardPlugin(options)],
    });
    return result.outputFiles[0]?.text ?? null;
  } catch (error) {
    options.problems.push(...describeBuildFailure(error, options.graph, options.workingPath));
    return null;
  }
};

const evaluate = (code: string, file: string): Record<string, unknown> => {
  const mod: { exports: Record<string, unknown> } = { exports: {} };
  const evaluator = new Function('require', 'module', 'exports', '__filename', '__dirname', code);
  evaluator(createRequire(file), mod, mod.exports, file, path.dirname(file));
  return mod.exports;
};

const unavailable = (what: string) => () => {
  throw new Error(`${what} is not available while the build reads tools.ts. Call it inside a tool handler.`);
};

const readCollections = (exports: Record<string, unknown>, file: string, problems: string[], workingPath: string): AnyCollection[] => {
  const where = relative(workingPath, file);
  const collections = Object.values(exports).filter(isCollection);
  if (collections.length === 0) problems.push(`${where}: exports no collection. Export each defineCollection({ ... }) result.`);
  const seen = new Set<string>();
  for (const collection of collections) {
    if (seen.has(collection.name)) {
      problems.push(`${where}: the collection name "${collection.name}" is used twice. Give each collection of a screen its own name.`);
    }
    seen.add(collection.name);
    if (collection.schema?.type !== 'object') {
      problems.push(`${where}: collection "${collection.name}" needs a schema with \`type: 'object'\` at the root.`);
    }
    problems.push(...schemaProblems(collection.schema, `collection "${collection.name}" schema`).map((problem) => `${where}: ${problem}`));
    for (let version = 2; version <= collection.version; version++) {
      if (collection.migrate && typeof collection.migrate[version] !== 'function') {
        problems.push(
          `${where}: collection "${collection.name}" is at version ${collection.version} but has no migrate step for version ${version}.`
        );
      }
    }
  }
  return collections;
};

const readOptions = (
  exports: Record<string, unknown>,
  screen: ScreenFiles,
  problems: string[],
  workingPath: string
): Record<string, unknown> => {
  const where = relative(workingPath, screen.options!);
  const definition = exports.default ?? exports;
  if (!isScreenOptions(definition)) {
    problems.push(`${where}: must default-export defineScreenOptions({ schema }) from "handoff-app/screens".`);
    return {};
  }
  const schemaIssues = schemaProblems(definition.schema, 'options schema').map((problem) => `${where}: ${problem}`);
  if (schemaIssues.length > 0) {
    problems.push(...schemaIssues);
    return {};
  }
  const value = withDefaults(definition.schema, screen.optionValues ?? {}) as Record<string, unknown>;
  const issues = validateValue(definition.schema, value, 'options');
  if (issues.length > 0) problems.push(`the declared options do not match the schema in ${where}: ${describeIssues(issues)}`);
  return value;
};

const readTools = (
  exports: Record<string, unknown>,
  screen: ScreenFiles,
  collections: AnyCollection[],
  options: Record<string, unknown>,
  problems: string[],
  workingPath: string
): ScreenTool[] => {
  const where = relative(workingPath, screen.tools!);
  const definition = (exports.default ?? exports) as ScreenToolsDefinition;
  if (definition?.kind !== 'handoff-screen-tools') {
    problems.push(`${where}: must default-export defineScreenTools(...) from "handoff-app/screens/server".`);
    return [];
  }
  const names = new Set(collections.map((collection) => collection.name));
  let tools: ScreenTool[];
  try {
    tools = definition.create({
      collections: {
        get: (collection) => {
          if (!isCollection(collection) || !names.has(collection.name)) {
            throw new Error(
              `collections.get() received a collection that ${screen.collections ? 'collections.ts does not export' : 'this screen does not have'}.`
            );
          }
          const fail = unavailable(`collections.get(${collection.name})`);
          return { get: fail, list: fail, create: fail, put: fail, update: fail, remove: fail } as never;
        },
      },
      options: {
        get: (definition) => {
          if (!isScreenOptions(definition)) throw new Error('options.get() needs the default export of options.ts.');
          return options as never;
        },
      },
      docs: {
        component: unavailable('docs.component()'),
        components: unavailable('docs.components()'),
        pattern: unavailable('docs.pattern()'),
        patterns: unavailable('docs.patterns()'),
        assessArgs: unavailable('docs.assessArgs()'),
      },
      caller: null,
    });
  } catch (error) {
    problems.push(`${where}: defineScreenTools() failed: ${(error as Error).message}`);
    return [];
  }
  if (!Array.isArray(tools)) {
    problems.push(`${where}: the defineScreenTools() callback must return a list of defineTool(...) results.`);
    return [];
  }
  const seen = new Set<string>();
  for (const tool of tools) {
    if (tool?.kind !== 'handoff-tool') {
      problems.push(`${where}: every item the callback returns must be a defineTool(...) result.`);
      continue;
    }
    if (seen.has(tool.name)) problems.push(`${where}: the tool name "${tool.name}" is used twice.`);
    seen.add(tool.name);
    if (tool.inputSchema?.type !== 'object') problems.push(`${where}: tool "${tool.name}" needs an inputSchema with \`type: 'object'\`.`);
    problems.push(...schemaProblems(tool.inputSchema, `tool "${tool.name}" inputSchema`).map((problem) => `${where}: ${problem}`));
  }
  return tools;
};

/** Check one screen and read its collections and tools. Throws {@link ScreenBuildError} with every problem found. */
export const checkScreen = async (screen: ScreenFiles, workingPath: string): Promise<ScreenCheckResult> => {
  const problems: string[] = [];
  const safeScreensModule = 'handoff-app/screens';

  await bundle(screen.ui, { graph: 'ui', screen, workingPath, problems }, 'browser');

  let collections: AnyCollection[] = [];
  let collectionsExports: Record<string, unknown> | null = null;
  if (screen.collections) {
    const code = await bundle(screen.collections, { graph: 'collections', screen, workingPath, problems, safeScreensModule }, 'node');
    if (code) {
      try {
        collectionsExports = evaluate(code, screen.collections);
        collections = readCollections(collectionsExports, screen.collections, problems, workingPath);
      } catch (error) {
        problems.push(`${relative(workingPath, screen.collections)}: could not be loaded: ${(error as Error).message}`);
      }
    }
  }

  let options: Record<string, unknown> = {};
  if (screen.options) {
    const code = await bundle(screen.options, { graph: 'options', screen, workingPath, problems, safeScreensModule }, 'node');
    if (code) {
      try {
        options = readOptions(evaluate(code, screen.options), screen, problems, workingPath);
      } catch (error) {
        problems.push(`${relative(workingPath, screen.options)}: could not be loaded: ${(error as Error).message}`);
      }
    }
  } else if (screen.optionValues) {
    problems.push(
      `the declaration passes \`options\`, but the screen has no ${screen.packageName ? `"${screen.module}/options" export` : 'options.ts'} that declares them. Remove \`options\` or declare them with defineScreenOptions().`
    );
  }

  let tools: ScreenTool[] = [];
  if (screen.tools) {
    const code = await bundle(screen.tools, { graph: 'tools', screen, workingPath, problems, safeScreensModule }, 'node');
    if (code) {
      try {
        tools = readTools(evaluate(code, screen.tools), screen, collections, options, problems, workingPath);
      } catch (error) {
        problems.push(`${relative(workingPath, screen.tools)}: could not be loaded: ${(error as Error).message}`);
      }
    }
  }

  if (problems.length > 0) {
    throw new ScreenBuildError(
      `Screen "${screen.id}" has ${problems.length === 1 ? 'a problem' : 'problems'}:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`
    );
  }

  return {
    collections: collections.map((collection) => ({ name: collection.name, version: collection.version, mcp: collection.mcp })),
    tools: tools.map((tool) => ({ name: tool.name, scope: tool.scope })),
    options,
  };
};
