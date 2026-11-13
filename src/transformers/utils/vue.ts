import fs from 'fs-extra';
import path from 'path';
import type * as TS from 'typescript';
import type { PluginOption } from 'vite';
import { Logger } from '../../utils/logger';
import { toSlotMetadata } from '../docgen';
import type { SlotMetadata } from '../preview/component';
import { importResolved, resolveModule } from './build';
import { DOCGEN_TYPE_BY_KIND, toTypeNode } from './type-nodes';
import { isAtLeast, packageDir, requireWorkspacePackages, useHandoffVite, type WorkspacePackage } from './workspace-packages';

const VUE_PLUGIN = '@vitejs/plugin-vue';

/**
 * Vue and its Vite plugin come from the workspace. 3.3 is the first Vue that resolves imported types in
 * `defineProps<T>()`, which the compiler needs to emit runtime props for most typed components.
 * `defineModel` needs 3.4, or 3.3 with its opt-in flag, which the build sets.
 */
const WORKSPACE_PACKAGES: WorkspacePackage[] = [
  { name: 'vue', min: '3.3', maxMajor: 3 },
  { name: VUE_PLUGIN, min: '6.0', maxMajor: 6, dev: true },
];

type HandoffContext = { workingPath: string; modulePath: string };

/** The part of a `vue-component-meta` checker that Handoff uses. */
type MetaChecker = {
  getComponentMeta(fileName: string, exportName?: string): any;
  updateFile(fileName: string, text: string): void;
  deleteFile(fileName: string): void;
  getProgram(): TS.Program | undefined;
};

type CheckerState = {
  checker: MetaChecker;
  /** Modification times of the workspace files the checker has read, so a changed file is read again. */
  files: Map<string, number>;
};

export type VueToolchain = {
  version: string;
  /** `@vitejs/plugin-vue`, bound to the workspace's `vue/compiler-sfc`. */
  vitePlugin: () => PluginOption;
  /** `vue/compiler-sfc` of the workspace, so the SFC parses the way the workspace's Vue compiles it. */
  compiler: any;
  /** The TypeScript that `vue-component-meta` uses, so its types and the type walk share one instance. */
  ts: typeof TS;
  /**
   * True when the checker must read a JavaScript SFC script as TypeScript. In JavaScript, TypeScript
   * infers a type parameter without a candidate as `any`, not `unknown`. The `defineComponent` types
   * of Vue before 3.5 then type the component instance as `any`, and `vue-component-meta` reads no
   * props from it.
   */
  readJsScriptsAsTs: boolean;
  createChecker: (rootDir: string, json: unknown) => MetaChecker;
  /** One checker per TypeScript config. A checker holds a language service, whose library types dominate its cost. */
  checkers: Map<string, CheckerState>;
};

const toolchains = new Map<string, Promise<VueToolchain>>();

const loadToolchain = async (handoff: HandoffContext): Promise<VueToolchain> => {
  const { vue: version } = requireWorkspacePackages('Vue', WORKSPACE_PACKAGES, handoff.workingPath);
  const vuePackage = resolveModule('vue/package.json', [handoff.workingPath]);
  const compiler = require(resolveModule('vue/compiler-sfc', [path.dirname(vuePackage)]));

  useHandoffVite(VUE_PLUGIN, handoff.workingPath, handoff.modulePath);
  const plugin = await importResolved(VUE_PLUGIN, [handoff.workingPath]);
  const createPlugin = plugin.default ?? plugin;
  // A workspace that pins its own vue-component-meta keeps it, with the TypeScript that it resolves.
  const metaDir = packageDir('vue-component-meta', [handoff.workingPath, handoff.modulePath]);
  const meta = require(metaDir);
  const ts = require(resolveModule('typescript', [metaDir, handoff.workingPath]));
  const needsModelFlag = !isAtLeast(version, '3.4');
  return {
    version,
    compiler,
    ts,
    readJsScriptsAsTs: !isAtLeast(version, '3.5'),
    vitePlugin: () => createPlugin({ compiler, ...(needsModelFlag ? { script: { defineModel: true } } : {}) }),
    createChecker: (rootDir, json) => meta.createCheckerByJson(rootDir, json, { schema: false }),
    checkers: new Map(),
  };
};

/**
 * Loaded once per workspace, and only when a Vue component builds. A failure is not kept, so
 * installing a missing package fixes the next build of a running `start`.
 */
export const loadVueToolchain = (handoff: HandoffContext): Promise<VueToolchain> => {
  const key = path.resolve(handoff.workingPath);
  let toolchain = toolchains.get(key);
  if (!toolchain) {
    toolchain = loadToolchain(handoff);
    toolchains.set(key, toolchain);
    toolchain.catch(() => toolchains.delete(key));
  }
  return toolchain;
};

const VUE_FILE_EXTENSION = { extension: 'vue', isMixedContent: true, scriptKind: 7 /* ScriptKind.Deferred */ };

export type VueTsconfig = {
  /** Undefined when the workspace has no `tsconfig.json`. */
  file?: string;
  options: TS.CompilerOptions;
};

/**
 * The TypeScript config that owns the component. A solution-style `tsconfig.json`, as `create-vue`
 * writes, has no options of its own and lists its projects in `references`; the first project whose
 * files include the component owns it, as in the Vue editor tooling.
 */
export const findVueTsconfig = (ts: typeof TS, workingPath: string, entry: string): VueTsconfig => {
  const parse = (file: string) => {
    const parsed = ts.getParsedCommandLineOfConfigFile(
      file,
      {},
      { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} } as any,
      undefined,
      undefined,
      [VUE_FILE_EXTENSION as any]
    );
    return parsed ?? undefined;
  };
  const root = path.resolve(workingPath, 'tsconfig.json');
  if (!fs.existsSync(root)) return { options: {} };
  const rootConfig = parse(root);
  const normalizedEntry = path.resolve(entry);
  for (const reference of rootConfig?.projectReferences ?? []) {
    const file = ts.resolveProjectReferencePath(reference);
    const config = fs.existsSync(file) ? parse(file) : undefined;
    if (config?.fileNames.some((name) => path.resolve(name) === normalizedEntry)) return { file, options: config.options };
  }
  return { file: root, options: rootConfig?.options ?? {} };
};

const getChecker = (toolchain: VueToolchain, workingPath: string, tsconfig: VueTsconfig): CheckerState => {
  const key = tsconfig.file ?? workingPath;
  let state = toolchain.checkers.get(key);
  if (!state) {
    // The config lists no files, so the checker reads only the components it is asked about and their imports.
    const json = {
      ...(tsconfig.file ? { extends: tsconfig.file } : {}),
      compilerOptions: tsconfig.file
        ? { noEmit: true, composite: false }
        : {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            jsx: 'preserve',
            skipLibCheck: true,
            noEmit: true,
          },
      files: [],
      include: [],
    };
    state = { checker: toolchain.createChecker(workingPath, json), files: new Map() };
    toolchain.checkers.set(key, state);
  }
  return state;
};

const modifiedTime = (file: string): number | undefined => {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return undefined;
  }
};

/** The text that the checker reads for a file: an SFC whose scripts have no `lang` gets `lang="ts"` when the toolchain needs it. */
const checkerText = (toolchain: VueToolchain, file: string): string => {
  const text = fs.readFileSync(file, 'utf8');
  if (!toolchain.readJsScriptsAsTs || !file.endsWith('.vue')) return text;
  const { descriptor } = toolchain.compiler.parse(text, { filename: file });
  const openingTags = [descriptor.script, descriptor.scriptSetup]
    .filter((block) => block && !block.lang && !block.src)
    .map((block) => text.lastIndexOf('<script', block.loc.start.offset))
    .filter((offset) => offset >= 0)
    .sort((first, second) => second - first);
  let result = text;
  for (const offset of openingTags) {
    const end = offset + '<script'.length;
    result = `${result.slice(0, end)} lang="ts"${result.slice(end)}`;
  }
  return result;
};

/** A checker caches every file it reads. A long-running `start` must see edits, so changed files are read again. */
const refreshChecker = (toolchain: VueToolchain, state: CheckerState, entry: string): void => {
  for (const [file, mtime] of state.files) {
    const current = modifiedTime(file);
    if (current === mtime) continue;
    if (current === undefined) {
      state.checker.deleteFile(file);
      state.files.delete(file);
    } else {
      state.checker.updateFile(file, checkerText(toolchain, file));
      state.files.set(file, current);
    }
  }
  if (!state.files.has(entry)) {
    state.checker.updateFile(entry, checkerText(toolchain, entry));
  }
};

const recordCheckerFiles = (state: CheckerState, program: TS.Program | undefined): void => {
  for (const sourceFile of program?.getSourceFiles() ?? []) {
    const file = path.resolve(sourceFile.fileName);
    if (state.files.has(file) || file.split(path.sep).includes('node_modules')) continue;
    const mtime = modifiedTime(file);
    if (mtime !== undefined) state.files.set(file, mtime);
  }
};

/** The value of a default that the source states as a constant, such as `'md'`, `[]`, or a factory `() => ({ a: 1 })`. */
const literalValue = (ts: typeof TS, node: TS.Expression): unknown => {
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node))
    return literalValue(ts, node.expression);
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand))
    return -Number(node.operand.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map((element) => literalValue(ts, element));
    return items.includes(undefined) ? undefined : items;
  }
  if (ts.isObjectLiteralExpression(node)) {
    const entries = node.properties.map((property) =>
      ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        ? [property.name.text, literalValue(ts, property.initializer)]
        : [undefined, undefined]
    );
    return entries.some(([key, value]) => key === undefined || value === undefined) ? undefined : Object.fromEntries(entries);
  }
  // Vue requires a factory for an object or array default.
  if (ts.isArrowFunction(node) && !node.parameters.length && !ts.isBlock(node.body)) return literalValue(ts, node.body);
  return undefined;
};

const parseDefault = (ts: typeof TS, text: string | undefined): unknown => {
  if (text === undefined) return undefined;
  const sourceFile = ts.createSourceFile('default.ts', `(${text})`, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const statement = sourceFile.statements[0];
  return statement && ts.isExpressionStatement(statement) ? literalValue(ts, statement.expression) : undefined;
};

/** A component name for templates: the file name in PascalCase, or the directory name for an `index.vue`. */
const componentTag = (entry: string): string => {
  const base = path.basename(entry, '.vue');
  const name = base.toLowerCase() === 'index' ? path.basename(path.dirname(entry)) : base;
  const tag = name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
  return /^[A-Za-z]/.test(tag) ? tag : `Component${tag}`;
};

export type VueProp = {
  /** The prop name as the component declares it, in camelCase. Preview args use it. */
  name: string;
  /** True when the component emits `update:<name>`, so a parent can bind it with `v-model`. */
  model: boolean;
};

export type VueComponentInfo = {
  tag: string;
  props: VueProp[];
  properties: Record<string, SlotMetadata>;
  /** The SFC and the files its blocks name with `src`, which the compiler reads outside the module graph. */
  watchFiles: string[];
};

/** Files that SFC blocks load with `src`. A package path or an alias is left to the module graph. */
const blockSourceFiles = (toolchain: VueToolchain, entry: string, source: string): string[] => {
  const { descriptor } = toolchain.compiler.parse(source, { filename: entry });
  const blocks = [descriptor.template, descriptor.script, descriptor.scriptSetup, ...descriptor.styles, ...descriptor.customBlocks];
  return blocks
    .map((block) => block?.src as string | undefined)
    .filter((src): src is string => !!src && (src.startsWith('.') || path.isAbsolute(src)))
    .map((src) => path.resolve(path.dirname(entry), src));
};

/**
 * The JSDoc of props that `<script setup>` declares, read from the `defineProps<T>()` type argument and
 * from the variable that holds each `defineModel()`. `vue-component-meta` reads JSDoc through the props
 * type of the component, which Vue's own types before 3.5 rebuild without the declarations, and which a
 * `defineModel()` next to runtime `defineProps({...})` leaves out on every version.
 */
const readScriptSetupDescriptions = (ts: typeof TS, program: TS.Program, checker: TS.TypeChecker, entry: string): Map<string, string> => {
  const descriptions = new Map<string, string>();
  const documentation = (symbol: TS.Symbol | undefined) => (symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)) : '');
  const visit = (node: TS.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'defineProps' && node.typeArguments?.length) {
        for (const symbol of checker.getPropertiesOfType(checker.getTypeFromTypeNode(node.typeArguments[0]))) {
          if (!descriptions.has(symbol.name)) descriptions.set(symbol.name, documentation(symbol));
        }
      }
      if (node.expression.text === 'defineModel') {
        const [first] = node.arguments;
        const name = first && ts.isStringLiteralLike(first) ? first.text : 'modelValue';
        let declaration: TS.Node | undefined = node.parent;
        while (declaration && !ts.isVariableDeclaration(declaration) && !ts.isStatement(declaration)) declaration = declaration.parent;
        if (declaration && ts.isVariableDeclaration(declaration) && !descriptions.has(name)) {
          descriptions.set(name, documentation(checker.getSymbolAtLocation(declaration.name)));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  // The checker's program holds the SFC as the TypeScript that the Vue language tools generate, which keeps the script code.
  const sourceFile = program.getSourceFile(entry);
  if (sourceFile) visit(sourceFile);
  return descriptions;
};

/**
 * Reads the props of the default export of an SFC with `vue-component-meta`, which runs the Vue
 * language tools on the TypeScript program. It covers `<script setup>` with `defineProps<T>()`
 * (imported types included), `withDefaults`, runtime props, the Options API, and `defineModel()`, and
 * reads the JSDoc of each prop. Emits are not props.
 */
export const readVueComponent = (toolchain: VueToolchain, workingPath: string, entry: string, tsconfig: VueTsconfig): VueComponentInfo => {
  const source = fs.readFileSync(entry, 'utf8');
  const watchFiles = [entry, ...blockSourceFiles(toolchain, entry, source)];

  const state = getChecker(toolchain, workingPath, tsconfig);
  refreshChecker(toolchain, state, entry);
  const meta = state.checker.getComponentMeta(entry, 'default');
  const program = state.checker.getProgram();
  recordCheckerFiles(state, program);
  const checker = program?.getTypeChecker();

  const { ts } = toolchain;
  const models = new Set<string>(
    (meta.events ?? [])
      .map((event: { name: string }) => event.name)
      .filter((name: string) => name.startsWith('update:'))
      .map((name: string) => name.slice(7))
  );
  const props: VueProp[] = [];
  const properties: Record<string, SlotMetadata> = {};
  let scriptSetupDescriptions: Map<string, string> | undefined;
  const describe = (name: string, description: string | undefined): string => {
    if (description || !program || !checker) return description ?? '';
    scriptSetupDescriptions ??= readScriptSetupDescriptions(ts, program, checker, path.resolve(entry));
    return scriptSetupDescriptions.get(name) ?? '';
  };
  for (const prop of meta.props ?? []) {
    // A global prop, such as `class` or `key`, belongs to every component.
    if (prop.global) continue;
    const type: TS.Type | undefined = prop.getTypeObject?.() ?? prop.rawType;
    const deepType =
      type && checker ? toTypeNode(ts, checker, type) : { kind: 'unknown' as const, display: String(prop.type ?? 'unknown') };
    props.push({ name: prop.name, model: models.has(prop.name) });
    properties[prop.name] = toSlotMetadata({
      name: prop.name,
      required: !!prop.required,
      description: describe(prop.name, prop.description),
      defaultValue: parseDefault(ts, prop.default),
      docgenType: DOCGEN_TYPE_BY_KIND[deepType.kind] ?? deepType.display,
      deepType,
    });
  }

  if (!props.length) warnOnMissingProps(toolchain, entry, source);
  return { tag: componentTag(entry), props, properties, watchFiles };
};

/**
 * Warns when the compiler finds props that the checker did not read, so that docs without props do
 * not go unnoticed. The preview still passes args to these props, because it reads them from the
 * compiled component.
 */
const warnOnMissingProps = (toolchain: VueToolchain, entry: string, source: string): void => {
  let names: string[];
  try {
    const { descriptor } = toolchain.compiler.parse(source, { filename: entry });
    if (!descriptor.script && !descriptor.scriptSetup) return;
    const { bindings } = toolchain.compiler.compileScript(descriptor, { id: 'handoff-props' });
    names = Object.entries(bindings ?? {})
      .filter(([, type]) => type === 'props' || type === 'props-aliased')
      .map(([name]) => name);
  } catch (error) {
    Logger.debug(`Could not check the props of ${entry}: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  if (names.length) {
    Logger.warn(
      `Vue component ${entry} declares the props ${names.join(', ')}, but Handoff could not read them. Its docs and usage show no props.`
    );
  }
};
