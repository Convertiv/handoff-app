import fs from 'fs-extra';
import type { TypeNode } from 'handoff-docgen';
import path from 'path';
import type * as TS from 'typescript';
import { pathToFileURL } from 'url';
import type { Plugin, PluginOption } from 'vite';
import { toSlotMetadata } from '../docgen';
import type { SlotMetadata } from '../preview/component';
import { resolveModule } from './build';

/**
 * Angular comes from the workspace, never from Handoff, so a project keeps its own Angular version.
 * `@angular/build` supplies the compiler that the Vite plugin drives.
 */
const WORKSPACE_PACKAGES = ['@angular/core', '@angular/platform-browser', '@angular/compiler-cli', '@angular/build'];

/**
 * Handoff needs TypeScript 5.6 or later, which Angular 18 does not accept. The compiler APIs that
 * Handoff reads are checked where they are used.
 */
const MIN_ANGULAR_MAJOR = 19;

/** Stops the type walk on deeply nested or recursive input types. */
const MAX_TYPE_DEPTH = 4;

/**
 * The Angular tooling is ESM-only, and tsc compiles `import()` to `require()` in this CommonJS
 * package. A function body keeps a real `import()`, as the Angular CLI does for the same reason.
 */
const importEsm = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

const importResolved = (id: string, searchDirs: string[]): Promise<any> => importEsm(pathToFileURL(resolveModule(id, searchDirs)).href);

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

const findMissingPackages = (workingPath: string): string[] =>
  WORKSPACE_PACKAGES.filter((name) => {
    try {
      resolveModule(`${name}/package.json`, [workingPath]);
      return false;
    } catch {
      return true;
    }
  });

const loadToolchain = async (handoff: HandoffContext): Promise<AngularToolchain> => {
  const missing = findMissingPackages(handoff.workingPath);
  if (missing.length) {
    throw new Error(`Angular previews need these packages in the workspace: ${missing.join(', ')}. Run: npm install -D ${missing.join(' ')}`);
  }

  const { version } = fs.readJsonSync(resolveModule('@angular/core/package.json', [handoff.workingPath]));
  if (Number.parseInt(version, 10) < MIN_ANGULAR_MAJOR) {
    throw new Error(`Angular previews need Angular ${MIN_ANGULAR_MAJOR} or later. The workspace has Angular ${version}.`);
  }

  const compilerCliPath = resolveModule('@angular/compiler-cli/package.json', [handoff.workingPath]);
  const [plugin, compilerCli] = await Promise.all([
    importResolved('@analogjs/vite-plugin-angular', [handoff.modulePath, handoff.workingPath]),
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

/**
 * Resolves the workspace's TypeScript `paths` (and `baseUrl`) imports, which Vite does not read. Only
 * a workspace source file resolves this way; a package import stays with Vite.
 */
export const tsconfigPathsPlugin = (toolchain: AngularToolchain, tsconfig: string): Plugin => {
  const { ts, compilerCli } = toolchain;
  const { options } = compilerCli.readConfiguration(tsconfig);
  const cache = ts.createModuleResolutionCache(path.dirname(tsconfig), (fileName) => fileName, options);
  return {
    name: 'handoff:tsconfig-paths',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || source.startsWith('.') || source.startsWith('\0') || path.isAbsolute(source)) return null;
      if (!/\.[cm]?tsx?$/.test(importer) || importer.split(/[\\/]/).includes('node_modules')) return null;
      const { resolvedModule } = ts.resolveModuleName(source, importer, options, ts.sys, cache);
      if (!resolvedModule || resolvedModule.isExternalLibraryImport || resolvedModule.resolvedFileName.endsWith('.d.ts')) return null;
      return resolvedModule.resolvedFileName;
    },
  };
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

/** Maps a TypeScript type to the docgen type tree that the properties table and the preview editor read. */
const toTypeNode = (ts: typeof TS, checker: TS.TypeChecker, type: TS.Type, depth = 0): TypeNode => {
  const display = checker.typeToString(type);
  if (depth > MAX_TYPE_DEPTH) return { kind: 'unknown', display, truncated: true };
  if (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike) && !type.isUnion()) {
    return { kind: 'primitive', display };
  }
  if (type.flags & ts.TypeFlags.Boolean) return { kind: 'primitive', display: 'boolean' };
  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return { kind: 'unknown', display };

  if (type.isUnion()) {
    const members = type.types.filter((member) => !(member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)));
    if (members.length && members.every((member) => member.flags & ts.TypeFlags.BooleanLiteral)) {
      return { kind: 'primitive', display: 'boolean' };
    }
    // A string or numeric enum is a union of its member literals, so it lists the values, not the member names.
    if (members.length > 1 && members.every((member) => member.isStringLiteral() || member.isNumberLiteral())) {
      return { kind: 'enum', display, members: members.map((member) => JSON.stringify((member as TS.LiteralType).value)) };
    }
    if (members.length === 1) return toTypeNode(ts, checker, members[0], depth);
    return { kind: 'union', display, children: members.map((member) => toTypeNode(ts, checker, member, depth + 1)) };
  }

  if (checker.isArrayType(type)) {
    const [elementType] = checker.getTypeArguments(type as TS.TypeReference);
    return { kind: 'array', display, elementType: elementType ? toTypeNode(ts, checker, elementType, depth + 1) : undefined };
  }
  if (type.getCallSignatures().length) return { kind: 'function', display };
  if (type.flags & ts.TypeFlags.Object) {
    return {
      kind: 'object',
      display,
      properties: checker.getPropertiesOfType(type).map((property) => {
        const declaration = property.valueDeclaration ?? property.declarations?.[0];
        const propertyType = declaration ? checker.getTypeOfSymbolAtLocation(property, declaration) : checker.getAnyType();
        return {
          name: property.getName(),
          optional: !!(property.flags & ts.SymbolFlags.Optional),
          type: toTypeNode(ts, checker, propertyType, depth + 1),
          description: ts.displayPartsToString(property.getDocumentationComment(checker)) || undefined,
        };
      }),
    };
  }
  return { kind: 'unknown', display };
};

const DOCGEN_TYPE_BY_KIND: Partial<Record<TypeNode['kind'], string>> = {
  enum: 'enum',
  array: 'array',
  object: 'object',
  function: 'function',
  unknown: 'unknown',
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
export const readAngularComponent = (toolchain: AngularToolchain, entry: string, tsconfig: string, exportName?: string): AngularComponentInfo => {
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
