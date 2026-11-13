import fs from 'fs-extra';
import path from 'path';
import type * as TS from 'typescript';
import type { PluginOption } from 'vite';
import { toSlotMetadata } from '../docgen';
import type { SlotMetadata } from '../preview/component';
import { importResolved, resolveModule } from './build';
import { DOCGEN_TYPE_BY_KIND, toTypeNode } from './type-nodes';
import { requireWorkspacePackages, useHandoffVite, type WorkspacePackage } from './workspace-packages';

const ANALOG_PLUGIN = '@analogjs/vite-plugin-angular';

/**
 * Angular and its build tooling come from the workspace, so a project keeps its own Angular version.
 * `@angular/build` supplies the compiler that the Analog Vite plugin drives. Angular 19 is the floor
 * because Handoff needs TypeScript 5.6 or later, which Angular 18 does not accept. The compiler APIs
 * that Handoff reads are checked where they are used.
 */
const WORKSPACE_PACKAGES: WorkspacePackage[] = [
  { name: '@angular/core', min: '19.0' },
  { name: '@angular/platform-browser' },
  { name: '@angular/compiler-cli', dev: true },
  { name: '@angular/build', dev: true },
  { name: ANALOG_PLUGIN, min: '2.9', maxMajor: 2, dev: true },
];

type HandoffContext = { workingPath: string; modulePath: string };

export type AngularToolchain = {
  /** `@analogjs/vite-plugin-angular`: compiles the component ahead of time inside the preview build. */
  vitePlugin: (options: { tsconfig: string; workspaceRoot: string; disableTypeChecking?: boolean }) => PluginOption[];
  compilerCli: any;
  ts: typeof TS;
  /**
   * Parsed declaration files, by path, shared by every program of the workspace. Library types such
   * as `lib.dom.d.ts` and `@angular/core` dominate a program's cost and rarely change.
   */
  declarations: Map<string, { mtimeMs: number; sourceFile: TS.SourceFile }>;
};

const toolchains = new Map<string, Promise<AngularToolchain>>();

const loadToolchain = async (handoff: HandoffContext): Promise<AngularToolchain> => {
  requireWorkspacePackages('Angular', WORKSPACE_PACKAGES, handoff.workingPath);
  useHandoffVite(ANALOG_PLUGIN, handoff.workingPath, handoff.modulePath);

  const compilerCliPath = resolveModule('@angular/compiler-cli/package.json', [handoff.workingPath]);
  const [plugin, compilerCli] = await Promise.all([
    importResolved(ANALOG_PLUGIN, [handoff.workingPath]),
    importResolved('@angular/compiler-cli', [handoff.workingPath]),
  ]);
  // The compiler and the type walk must share one TypeScript instance, so resolve it the way the compiler does.
  const ts = require(resolveModule('typescript', [path.dirname(compilerCliPath), handoff.workingPath]));
  return { vitePlugin: plugin.default ?? plugin.angular, compilerCli, ts, declarations: new Map() };
};

/**
 * Loaded once per workspace, and only when an Angular component builds. A failure is not kept, so
 * installing a missing package fixes the next build of a running `start`.
 */
export const loadAngularToolchain = (handoff: HandoffContext): Promise<AngularToolchain> => {
  const key = path.resolve(handoff.workingPath);
  let toolchain = toolchains.get(key);
  if (!toolchain) {
    toolchain = loadToolchain(handoff);
    toolchains.set(key, toolchain);
    toolchain.catch(() => toolchains.delete(key));
  }
  return toolchain;
};

/**
 * Writes the TypeScript config that compiles one component. It extends the workspace config, so paths
 * and compiler options apply, and it lists only the component, so the compiler reads only that file
 * and its imports. It also turns emit on: an editor-only config usually sets `noEmit`, and the compiler
 * then produces nothing.
 */
export const writeCompilationTsconfig = (handoff: HandoffContext, componentId: string, entry: string): string => {
  const workspaceConfig = path.resolve(handoff.workingPath, 'tsconfig.json');
  const hasWorkspaceConfig = fs.existsSync(workspaceConfig);
  const config = {
    ...(hasWorkspaceConfig ? { extends: workspaceConfig } : {}),
    compilerOptions: {
      ...(hasWorkspaceConfig
        ? {}
        : { target: 'ES2022', module: 'ES2022', moduleResolution: 'bundler', experimentalDecorators: true, skipLibCheck: true }),
      noEmit: false,
      emitDeclarationOnly: false,
      composite: false,
      incremental: false,
    },
    files: [entry],
    include: [],
  };
  const file = path.resolve(handoff.workingPath, '.handoff', '.cache', 'angular', `${componentId}.tsconfig.json`);
  const content = `${JSON.stringify(config, null, 2)}\n`;
  // An unchanged file keeps its timestamp, so nothing that watches the cache reacts to a rebuild.
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) fs.outputFileSync(file, content);
  return file;
};

/** `key` is the class property name, which preview args use; `binding` is the name a template binds. */
export type AngularInput = { key: string; binding: string };

export type AngularComponentInfo = {
  /** The export of the component file that holds the component: `default` or a name. */
  exportName: string;
  selector: string;
  inputs: AngularInput[];
  /** The input properties, keyed by class property name, like the preview args. */
  properties: Record<string, SlotMetadata>;
  /**
   * Templates and stylesheets that the compiled sources reference by URL. No import names them, so
   * the build cache would miss a change to them otherwise.
   */
  resourceFiles: string[];
  /** `@angular/core` names it `provideExperimentalZonelessChangeDetection` before Angular 20. */
  zonelessProvider: string;
};

const SIGNAL_INPUT_TYPES = new Set(['InputSignal', 'InputSignalWithTransform', 'ModelSignal']);

/**
 * The value type of an input: `T` for a signal input such as `InputSignal<T>`, else the property type.
 * With a transform, this is the type the component reads, such as `boolean` for `booleanAttribute`.
 */
const inputValueType = (ts: typeof TS, checker: TS.TypeChecker, type: TS.Type): TS.Type => {
  const name = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName();
  if (!name || !SIGNAL_INPUT_TYPES.has(name)) return type;
  const typeArguments =
    type.aliasTypeArguments ?? (type.flags & ts.TypeFlags.Object ? checker.getTypeArguments(type as TS.TypeReference) : undefined);
  return typeArguments?.[0] ?? type;
};

/** The value of a default that the source states as a constant, such as `'md'`, `[]` or `Tone.Info`; else `undefined`. */
const staticValue = (ts: typeof TS, checker: TS.TypeChecker, node: TS.Expression): unknown => {
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    return staticValue(ts, checker, node.expression);
  }
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
    return -Number(node.operand.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map((element) => staticValue(ts, checker, element));
    return items.includes(undefined) ? undefined : items;
  }
  if (ts.isObjectLiteralExpression(node)) {
    const entries = node.properties.map((property) =>
      ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        ? [property.name.text, staticValue(ts, checker, property.initializer)]
        : [undefined, undefined]
    );
    return entries.some(([key, value]) => key === undefined || value === undefined) ? undefined : Object.fromEntries(entries);
  }
  // A constant or an enum member has a literal type.
  const type = checker.getTypeAtLocation(node);
  return type.isStringLiteral() || type.isNumberLiteral() ? type.value : undefined;
};

/**
 * A decorator input holds its default in its initializer. A signal input is a direct call of Angular's
 * `input()` or `model()`, which the compiler requires, so its default is the first argument, and
 * `.required()` has none. The callee is not read by name, so an import alias or `ng.input()` works.
 */
const readDefault = (ts: typeof TS, checker: TS.TypeChecker, declaration: TS.Declaration | undefined, isSignal: boolean): unknown => {
  if (!declaration || !ts.isPropertyDeclaration(declaration) || !declaration.initializer) return undefined;
  const initializer = declaration.initializer;
  if (!isSignal) return staticValue(ts, checker, initializer);
  if (!ts.isCallExpression(initializer)) return undefined;
  const callee = initializer.expression;
  if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'required') return undefined;
  return initializer.arguments[0] ? staticValue(ts, checker, initializer.arguments[0]) : undefined;
};

/** A compiler host that reuses the toolchain's parsed declaration files while their file is unchanged. */
const createCachingHost = (toolchain: AngularToolchain, options: TS.CompilerOptions): TS.CompilerHost => {
  const host: TS.CompilerHost = toolchain.compilerCli.createCompilerHost({ options });
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    // ngtsc adds shim references to workspace sources, so only declaration files are shared.
    if (!fileName.endsWith('.d.ts')) return getSourceFile(fileName, languageVersion, onError, shouldCreate);
    let mtimeMs: number;
    try {
      mtimeMs = fs.statSync(fileName).mtimeMs;
    } catch {
      return getSourceFile(fileName, languageVersion, onError, shouldCreate);
    }
    const cached = toolchain.declarations.get(fileName);
    if (cached?.mtimeMs === mtimeMs) return cached.sourceFile;
    const sourceFile = getSourceFile(fileName, languageVersion, onError, shouldCreate);
    if (sourceFile) toolchain.declarations.set(fileName, { mtimeMs, sourceFile });
    return sourceFile;
  };
  return host;
};

/** The class declaration behind an export, following `export { X as Y }` and re-exports. */
const exportedClass = (ts: typeof TS, checker: TS.TypeChecker, symbol: TS.Symbol): TS.ClassDeclaration | undefined => {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return target.declarations?.find((declaration): declaration is TS.ClassDeclaration => ts.isClassDeclaration(declaration));
};

/**
 * Reads the selector and the inputs of the component in `entry` from the Angular compiler's own
 * directive metadata, so aliases, required inputs, `model()` and inherited inputs follow Angular's
 * rules. `exportName` picks the component when the file exports more than one.
 */
export const readAngularComponent = (
  toolchain: AngularToolchain,
  entry: string,
  tsconfig: string,
  exportName?: string
): AngularComponentInfo => {
  const { compilerCli, ts } = toolchain;
  const { options, rootNames, errors } = compilerCli.readConfiguration(tsconfig);
  if (errors?.length) {
    throw new Error(`Cannot read the TypeScript config: ${ts.flattenDiagnosticMessageText(errors[0].messageText, '\n')}`);
  }
  // The language service option: the compiler then exposes the directive metadata that it resolved.
  const compilerOptions = { ...options, noEmit: true, _enableTemplateTypeChecker: true };
  const program = new compilerCli.NgtscProgram(rootNames, compilerOptions, createCachingHost(toolchain, compilerOptions));
  const typeChecker = program.compiler?.getTemplateTypeChecker?.();
  if (typeof typeChecker?.getDirectiveMetadata !== 'function') {
    throw new Error('This version of @angular/compiler-cli has no directive metadata API that Angular previews can read.');
  }

  const tsProgram: TS.Program = program.getTsProgram();
  const checker = tsProgram.getTypeChecker();
  const sourceFile = tsProgram.getSourceFile(entry);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  const components = (moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [])
    .map((symbol) => {
      const declaration = exportedClass(ts, checker, symbol);
      return { exportName: symbol.getName(), declaration, meta: declaration && typeChecker.getDirectiveMetadata(declaration) };
    })
    .filter((candidate) => candidate.meta?.isComponent);
  const component = exportName ? components.find((candidate) => candidate.exportName === exportName) : components[0];
  if (!component) {
    throw new Error(`No exported Angular component found in "${entry}"${exportName ? ` with the export "${exportName}"` : ''}.`);
  }
  const { declaration, meta } = component;
  if (!meta.isStandalone) {
    throw new Error(`"${declaration.name?.text}" is not a standalone component. Angular previews render standalone components only.`);
  }

  const instanceType = checker.getTypeAtLocation(declaration);
  const inputs: AngularInput[] = [];
  const properties: Record<string, SlotMetadata> = {};
  // Inherited inputs are included, the base class's first.
  for (const input of meta.inputs) {
    const key: string = input.classPropertyName;
    const symbol = checker.getPropertyOfType(instanceType, key);
    const propertyDeclaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    const deepType =
      symbol && propertyDeclaration
        ? toTypeNode(ts, checker, inputValueType(ts, checker, checker.getTypeOfSymbolAtLocation(symbol, propertyDeclaration)))
        : undefined;
    const binding: string = input.bindingPropertyName;
    inputs.push({ key, binding });
    properties[key] = toSlotMetadata({
      name: key,
      required: !!input.required,
      description: symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)) : '',
      defaultValue: readDefault(ts, checker, propertyDeclaration, !!input.isSignal),
      docgenType: deepType ? (DOCGEN_TYPE_BY_KIND[deepType.kind] ?? deepType.display) : 'unknown',
      deepType,
    });
    properties[key].name = binding;
  }

  const resourceFiles = tsProgram
    .getSourceFiles()
    .filter((file) => !file.isDeclarationFile && !file.fileName.split('/').includes('node_modules'))
    .flatMap((file) => program.compiler.getResourceDependencies(file) as string[]);

  return {
    exportName: component.exportName,
    selector: meta.selector ?? '',
    inputs,
    properties,
    resourceFiles,
    zonelessProvider: readZonelessProvider(ts, tsProgram, checker, entry, compilerOptions),
  };
};

const readZonelessProvider = (ts: typeof TS, program: TS.Program, checker: TS.TypeChecker, entry: string, options: TS.CompilerOptions) => {
  const core = ts.resolveModuleName('@angular/core', entry, options, ts.sys).resolvedModule;
  const coreFile = core && program.getSourceFile(core.resolvedFileName);
  const coreSymbol = coreFile && checker.getSymbolAtLocation(coreFile);
  const exported = new Set((coreSymbol ? checker.getExportsOfModule(coreSymbol) : []).map((symbol) => symbol.getName()));
  const provider = ['provideZonelessChangeDetection', 'provideExperimentalZonelessChangeDetection'].find((name) => exported.has(name));
  if (!provider) throw new Error('@angular/core has no zoneless change detection provider.');
  return provider;
};
