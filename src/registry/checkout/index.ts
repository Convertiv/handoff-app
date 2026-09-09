/**
 * Connected-workspace checkout orchestration.
 *
 * `checkout <components|patterns> <id>` reads a normalized registry record and its registry-safe
 * source files from the connected registry through the shared registry client, then writes them
 * into the local workspace in standard authoring form. The local **declaration is synthesized
 * locally** in the configured `runtime.workspace.declarationFormat` — declarations are never read
 * from the registry (they are workspace-only). Identity is matched by stable `id`, so a checked-out
 * entity maps to the correct logical component/pattern and can be re-authored and re-published.
 *
 * Available only from a connected workspace (`runtime.mode: workspace` + a configured
 * `registryConnection`). Overwriting existing local files is explicit: a `--force` flag or an
 * interactive confirmation.
 */

import * as p from '@clack/prompts';
import fs from 'fs-extra';
import { transformSync } from 'esbuild';
import { startCase } from 'lodash';
import path from 'path';
import { orderPreviews } from '../../catalog/previews';
import { validateCatalogItem } from '../../catalog/define';
import {
  entryKeyFor,
  moduleFor,
  isRendererKind,
  isSourceFormat,
  SOURCE_FORMATS,
  type ComponentSource,
  type RendererKind,
  type SourceFormat,
} from '../../catalog/renderers';
import { isEntryCovered, writeEntries } from '../../config/entries';
import { isComponentDirectory, resolveComponentDeclaration } from '../../config/runtime';
import Handoff from '../../index';
import type { DeclarationFormat } from '../../types/config';
import { Logger } from '../../utils/logger';
import { createRegistryClient, type RegistryClient, RegistryClientError } from '../client';
import { resolveAuthenticatedRegistryConnection } from '../connection';
import { isSafePathSegment, isSafeRelativePath, resolvePathWithin } from '../path';
import { quoteIds, selectIds, splitCatalogIds } from '../selection';
import type { CheckoutPayload, TransferEntityKind, TransferFile } from '../transfer';

/** A connected-workspace configuration or precondition failure surfaced to the CLI. */
export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}

/** Default authoring format synthesized when no existing file or configured preference applies. */
const DEFAULT_DECLARATION_FORMAT: DeclarationFormat = 'ts';

/** Default workspace subdirectory an entity is written into when none is configured. */
const DEFAULT_ENTITY_DIR: Record<TransferEntityKind, string> = {
  component: 'components',
  pattern: 'patterns',
  page: 'pages',
};

/** Source-file extensions stripped to form a module specifier for a React component import. */
const COMPONENT_EXTENSION = /\.(tsx|jsx|ts|js|cjs|mjs)$/i;

/**
 * Ensure the workspace is a connected workspace able to checkout: workspace runtime mode (a registry
 * host has no local workspace to write into) and a resolved registry URL + access token. Throws an
 * actionable {@link CheckoutError} naming the exact misconfiguration.
 */
export const resolveConnectionOrThrow = async (handoff: Handoff) => {
  const mode = handoff.config?.runtime?.mode ?? 'workspace';
  if (mode !== 'workspace') {
    throw new CheckoutError(
      `checkout is only available from a connected workspace (runtime.mode: "workspace"); this project is "${mode}". ` +
        'A registry host stores and serves entities; it has no local workspace to check them out into.'
    );
  }

  const connection = await resolveAuthenticatedRegistryConnection(handoff.config, handoff.workingPath);
  if (!connection.url) {
    throw new CheckoutError(
      `No registry is configured. Run \`handoff-app login --url <registry-url>\`, set runtime.registryConnection.url, ` +
        `or set the "${connection.urlEnv}" environment variable to the base URL of the registry to checkout from.`
    );
  }
  if (!connection.accessToken) {
    throw new CheckoutError(
      `No registry access token is configured. Run \`handoff-app login --url ${connection.url}\`, or set the ` +
        `"${connection.accessTokenEnv}" environment variable to a user-issued token for CI.`
    );
  }
  return connection;
};

/** Map a registry client error to an actionable checkout message. */
const describeFetchFailure = (error: RegistryClientError, kind: TransferEntityKind, id: string, registryUrl: string): string => {
  switch (error.code) {
    case 'not_found':
      return `No ${kind} "${id}" exists in the registry at ${registryUrl}.`;
    case 'runtime_mode_conflict':
      return `The registry at ${registryUrl} is not running in registry mode, so it cannot serve a checkout: ${error.message}`;
    case 'unauthorized':
      return `The registry rejected the access token (401). Run \`handoff-app login --url ${registryUrl}\` again, or replace the user-issued CI token.`;
    case 'forbidden':
      return `The registry token does not have permission to checkout this content (403). Authorize a token with registry:read access.`;
    default:
      return error.message;
  }
};

/**
 * Ask the user which collection directory a new entity should land in when the config is ambiguous.
 * Under `--force` (or any non-interactive run) there's no one to ask, so we fail with an actionable
 * message rather than guessing a root.
 */
const promptForCollectionRoot = async (handoff: Handoff, kind: TransferEntityKind, roots: string[]): Promise<string> => {
  const relative = (root: string) => path.relative(handoff.workingPath, root) || '.';
  if (handoff.force) {
    throw new CheckoutError(
      `Cannot determine where to checkout the ${kind}: catalog.include declares directories under different ` +
        `parents (${roots.map(relative).join(', ')}), and none is named "${DEFAULT_ENTITY_DIR[kind]}". Declare a single ` +
        `collection directory in handoff.config, or run checkout without --force to choose interactively.`
    );
  }
  const choice = await p.select({
    message: `Where should the new ${kind} be checked out?`,
    options: roots.map((root) => ({ value: root, label: relative(root) })),
    initialValue: roots[0],
  });
  if (p.isCancel(choice)) {
    throw new CheckoutError('Checkout cancelled; no target directory chosen.');
  }
  return choice as string;
};

/**
 * Resolve the collection directory a new entity is cloned into from the configured
 * `catalog.include`. Each entry is either a collection directory (used as-is) or a
 * single declared entity directory, in which case its parent is the collection root so the new
 * entity lands as a sibling rather than nested inside. Different parents are settled by the
 * conventional directory name for the kind, and only then by asking the user. With nothing
 * configured we fall back to the default subdir.
 */
const resolveCollectionRoot = async (handoff: Handoff, kind: TransferEntityKind): Promise<string> => {
  const configuredRoots = handoff.config?.catalog?.include;
  if (!configuredRoots?.length) {
    return path.resolve(handoff.workingPath, DEFAULT_ENTITY_DIR[kind]);
  }

  const roots = [
    ...new Set(
      configuredRoots.map((entry) => {
        const resolved = path.resolve(handoff.workingPath, entry);
        return isComponentDirectory(resolved) ? path.dirname(resolved) : resolved;
      })
    ),
  ];

  if (roots.length === 1) {
    return roots[0];
  }

  // `catalog.include` is one list for both lanes, so a project that registers `components` and
  // `patterns` offers two roots for every checkout. Without this, every such project prompts, and a
  // non-interactive `--force` run fails.
  const conventional = roots.filter((root) => path.basename(root) === DEFAULT_ENTITY_DIR[kind]);
  if (conventional.length === 1) {
    return conventional[0];
  }

  return promptForCollectionRoot(handoff, kind, roots);
};

/**
 * Resolve the local directory the entity is written into. An already-checked-out or locally-declared
 * entity keeps its existing source directory (matched by stable `id`); otherwise it lands as a
 * sibling under its configured collection root (see {@link resolveCollectionRoot}).
 */
const resolveTargetDir = async (handoff: Handoff, kind: TransferEntityKind, id: string): Promise<string> => {
  const store = kind === 'component' ? handoff.store.components : handoff.store.patterns;
  const existing = await store.get(id);
  const existingDir = (existing as { path?: string } | null)?.path;
  if (existingDir) {
    return existingDir;
  }

  const root = await resolveCollectionRoot(handoff, kind);
  const targetDir = resolvePathWithin(root, id);
  if (!targetDir) {
    throw new CheckoutError(`Cannot checkout ${kind} with unsafe id "${id}".`);
  }
  return targetDir;
};

/** Read the extension of an existing local declaration in `dir`, if any maps to a known format. */
const existingDeclarationFormat = (dir: string): DeclarationFormat | undefined => {
  if (!fs.existsSync(dir)) {
    return undefined;
  }
  const declaration = resolveComponentDeclaration(dir, path.basename(dir));
  if (!declaration) {
    return undefined;
  }
  const ext = path.extname(declaration.fileName).slice(1).toLowerCase();
  return (['ts', 'js', 'cjs'] as const).includes(ext as DeclarationFormat) ? (ext as DeclarationFormat) : undefined;
};

/**
 * Resolve the declaration format: an existing local declaration's extension wins, else the
 * configured `runtime.workspace.declarationFormat`, else {@link DEFAULT_DECLARATION_FORMAT}.
 */
const resolveDeclarationFormat = (handoff: Handoff, dir: string): DeclarationFormat => {
  const configured = handoff.config?.runtime?.workspace?.declarationFormat;
  return existingDeclarationFormat(dir) ?? configured ?? DEFAULT_DECLARATION_FORMAT;
};

/** The declaration filename to write: reuse an existing local declaration, else `<id>.handoff.<format>`. */
const resolveDeclarationFileName = (dir: string, id: string, format: DeclarationFormat): string => {
  if (fs.existsSync(dir)) {
    const existing = resolveComponentDeclaration(dir, path.basename(dir));
    if (existing) {
      return existing.fileName;
    }
  }
  return `${id}.handoff.${format}`;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Supporting entry keys kept verbatim regardless of renderer. */
const SUPPORTING_ENTRY_KEYS = ['js', 'scss', 'schema', 'templates'] as const;

const asString = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);
const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === 'string') ? (value as string[]) : undefined;

/**
 * Normalization mirrors React `component` and CSF `story` entries into `template`. Checkout omits these duplicates
 * and preserves supporting entries (`js`/`scss`/`schema`/`templates`).
 */
const buildEntries = (
  entries: unknown,
  source: Partial<ComponentSource>,
  options: { includePrimary?: boolean } = {}
): Record<string, unknown> | undefined => {
  if (!isPlainObject(entries)) {
    return undefined;
  }
  const result: Record<string, unknown> = {};

  // A catalog item names its implementation through `implementation`, so re-emitting the primary
  // entry key would state the same fact twice.
  const primaryKey = entryKeyFor(source.renderer, source.sourceFormat);
  if (options.includePrimary !== false) {
    if (primaryKey && typeof entries[primaryKey] === 'string') {
      result[primaryKey] = entries[primaryKey];
    }
  }

  for (const key of SUPPORTING_ENTRY_KEYS) {
    if (entries[key] !== undefined) {
      result[key] = entries[key];
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

/**
 * Rebuild the authored preview map from the stored previews, keeping only
 * authored fields (`title`, `args`) and dropping build-derived ones (rendered `url`, `usage`,
 * `sourcePreview`). Catalog normalization maps authored `args` to `values`, so the stored record
 * carries `values`; checkout re-emits it as `args` to match the authoring convention (the form
 * `make`/`scaffold` generate). Both rebuild identically.
 */
const buildPreviews = (previews: unknown): Record<string, unknown> | undefined => {
  if (!isPlainObject(previews)) {
    return undefined;
  }
  const result: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(previews)) {
    if (!isPlainObject(raw)) {
      continue;
    }
    const preview: Record<string, unknown> = {};
    if (typeof raw.title === 'string') preview.title = raw.title;
    const args = raw.values;
    if (args !== undefined) preview.args = args;
    result[key] = preview;
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

/**
 * Synthesize an authored component declaration from the normalized
 * record. Only authored fields are kept; registry-/build-derived data (`path`, `image`,
 * `properties`/docgen, rendered preview URLs, `internalPatternPreviews`, `validations`, `variant`,
 * review `metadata`) is dropped so the local build regenerates it. `name` carries the record title
 * (the authored contract uses `name`; normalization maps it back to `title`); `shouldDo`/
 * `shouldNotDo` are emitted in their camelCase authored form.
 */
const buildComponentDeclaration = (item: Record<string, unknown>): Record<string, unknown> => {
  const declaration: Record<string, unknown> = {};
  const id = asString(item.id);
  if (id) declaration.id = id;
  declaration.name = asString(item.title) ?? asString(item.name) ?? id ?? '';

  const description = asString(item.description);
  if (description) declaration.description = description;
  const group = asString(item.group);
  if (group) declaration.group = group;
  const type = asString(item.type);
  if (type) declaration.type = type;
  const source = {
    renderer: item.renderer as ComponentSource['renderer'],
    sourceFormat: item.sourceFormat as ComponentSource['sourceFormat'],
  };
  if (source.renderer) declaration.renderer = source.renderer;
  if (source.sourceFormat) declaration.sourceFormat = source.sourceFormat;
  const componentExport = asString(item.componentExport);
  if (componentExport) declaration.componentExport = componentExport;
  const entries = buildEntries(item.entries, source);
  if (entries) declaration.entries = entries;

  const previews = buildPreviews(
    isPlainObject(item.previews) ? orderPreviews(item.previews, asStringArray(item.previewOrder) ?? []) : undefined
  );
  if (previews) declaration.previews = previews;

  const categories = asStringArray(item.categories);
  if (categories) declaration.categories = categories;
  const tags = asStringArray(item.tags);
  if (tags) declaration.tags = tags;

  const shouldDo = asStringArray(item.should_do);
  if (shouldDo) declaration.shouldDo = shouldDo;
  const shouldNotDo = asStringArray(item.should_not_do);
  if (shouldNotDo) declaration.shouldNotDo = shouldNotDo;

  const figma = asString(item.figma);
  if (figma) declaration.figma = figma;
  const figmaComponentId = asString(item.figmaComponentId);
  if (figmaComponentId) declaration.figmaComponentId = figmaComponentId;
  if (isPlainObject(item.page)) declaration.page = item.page;
  if (isPlainObject(item.options)) declaration.options = item.options;

  return declaration;
};

/**
 * Rebuild the authored pattern component refs from the stored entries,
 * keeping only `id`/`preview`/`args` and dropping build-time resolution fields (`resolvedPreview`,
 * `resolved`).
 */
const buildPatternComponents = (components: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(components)) {
    return [];
  }
  return components.filter(isPlainObject).map((entry) => {
    const ref: Record<string, unknown> = {};
    const id = asString(entry.id);
    if (id) ref.id = id;
    const preview = asString(entry.preview);
    if (preview) ref.preview = preview;
    if (isPlainObject(entry.args)) ref.args = entry.args;
    return ref;
  });
};

/**
 * Synthesize an authored pattern declaration from the normalized
 * record. Only the authored fields (`id`, `name`, `description`, `group`, `tags`, `components`) are
 * kept; derived fields (`path`, rendered `url`, review `metadata`) are dropped.
 */
const buildPatternDeclaration = (item: Record<string, unknown>): Record<string, unknown> => {
  const declaration: Record<string, unknown> = {};
  const id = asString(item.id);
  if (id) declaration.id = id;
  declaration.name = asString(item.title) ?? asString(item.name) ?? id ?? '';

  const description = asString(item.description);
  if (description) declaration.description = description;
  const group = asString(item.group);
  if (group) declaration.group = group;
  const tags = asStringArray(item.tags);
  if (tags) declaration.tags = tags;

  declaration.components = buildPatternComponents(item.components);
  return declaration;
};

/** Drop a key from an object without mutating it. */
const omit = (object: Record<string, unknown>, key: string): Record<string, unknown> => {
  const { [key]: _removed, ...rest } = object;
  return rest;
};

const omitSource = (object: Record<string, unknown>): Record<string, unknown> => omit(omit(object, 'renderer'), 'sourceFormat');

/** Turn a relative entry path into a module specifier (extension stripped, `./`-prefixed). */
const toImportSpecifier = (entryPath: string): string => {
  const withoutExt = entryPath.replace(COMPONENT_EXTENSION, '').split(path.sep).join('/');
  return withoutExt.startsWith('.') ? withoutExt : `./${withoutExt}`;
};

/**
 * Turn a relative entry path into a `./`-prefixed file path. Unlike a module specifier this keeps
 * the extension, because `fromCSF('./Card.stories.tsx')` and a `.hbs` implementation name files.
 */
const toFilePath = (entryPath: string): string => {
  const normalized = entryPath.split(path.sep).join('/');
  return normalized.startsWith('.') ? normalized : `./${normalized}`;
};

/** Derive a safe PascalCase identifier for the imported React component. */
const toComponentIdentifier = (entryPath: string, fallback: string): string => {
  const base = path.basename(entryPath).replace(COMPONENT_EXTENSION, '');
  const pascal = (base || fallback)
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return /^[A-Za-z_$]/.test(pascal) ? pascal : `Component${pascal}`;
};

/** Keys matching this are emitted unquoted in JS/TS object literals; others are single-quoted. */
const JS_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** A value emitted verbatim into a literal, such as an imported identifier or a `fromCSF(...)` call. */
class RawExpression {
  constructor(public readonly code: string) {}
}

/** Serialize a string as a single-quoted JS literal (repo style), escaping safely. */
const singleQuote = (value: string): string => {
  let out = "'";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (char === '\\') out += '\\\\';
    else if (char === "'") out += "\\'";
    else if (char === '\n') out += '\\n';
    else if (char === '\r') out += '\\r';
    else if (char === '\t') out += '\\t';
    else if (code < 0x20) out += `\\u${code.toString(16).padStart(4, '0')}`;
    else out += char;
  }
  return `${out}'`;
};

/**
 * Serialize a value as a JS/TS object literal mirroring `JSON.stringify(value, null, 2)` formatting,
 * except identifier-safe object keys are emitted unquoted (`id: 'button'` rather than
 * `"id": "button"`) and strings are single-quoted to match the repo's authoring style. `undefined`
 * entries are dropped.
 */
const toJsLiteral = (value: unknown, indentLevel = 0): string => {
  const pad = '  '.repeat(indentLevel);
  const padInner = '  '.repeat(indentLevel + 1);

  if (value instanceof RawExpression) {
    return value.code;
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return singleQuote(value);
  }
  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const items = value.map((item) => `${padInner}${toJsLiteral(item, indentLevel + 1)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    return '{}';
  }
  const lines = entries.map(([key, v]) => {
    const renderedKey = JS_IDENTIFIER.test(key) ? key : singleQuote(key);
    return `${padInner}${renderedKey}: ${toJsLiteral(v, indentLevel + 1)}`;
  });
  return `{\n${lines.join(',\n')}\n${pad}}`;
};

/**
 * Re-shape stored previews for the catalog API: the display title becomes `name`, and is omitted
 * when it matches what `startCase` derives from the export name.
 */
const toCatalogPreviews = (previews: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
  if (!previews) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(previews)) {
    if (!isPlainObject(raw)) continue;
    const preview: Record<string, unknown> = {};
    const title = asString(raw.title);
    if (title && title !== startCase(key)) preview.name = title;
    if (raw.args !== undefined) preview.args = raw.args;
    result[key] = preview;
  }
  return result;
};

const previewKeysAreIdentifiers = (previews: Record<string, unknown> | undefined): boolean =>
  !previews || Object.keys(previews).every((key) => JS_IDENTIFIER.test(key));

const withImplementation = (item: Record<string, unknown>, implementation: unknown): Record<string, unknown> => {
  const ordered: Record<string, unknown> = {};
  const placed = new Set(['implementation']);

  for (const key of ['id', 'name', 'description', 'group']) {
    if (item[key] !== undefined) {
      ordered[key] = item[key];
      placed.add(key);
    }
  }
  ordered.implementation = implementation;

  for (const [key, value] of Object.entries(item)) {
    if (!placed.has(key)) ordered[key] = value;
  }
  return ordered;
};

const buildImplementationImport = (
  declaration: Record<string, unknown>,
  componentEntry: string,
  format: DeclarationFormat
): { statement: string; identifier: string } => {
  const specifier = toImportSpecifier(componentEntry);
  const exportName = asString(declaration.componentExport);
  const identifier = exportName ?? toComponentIdentifier(componentEntry, asString(declaration.id) ?? 'Component');

  if (format === 'ts') {
    const clause = exportName ? `{ ${exportName} }` : identifier;
    return { statement: `import ${clause} from '${specifier}';`, identifier };
  }

  const accessor = exportName ? `.${exportName}` : '.default';
  return { statement: `const ${identifier} = require('${specifier}')${accessor};`, identifier };
};

const buildPreviewExports = (previews: Record<string, unknown> | undefined, format: DeclarationFormat, previewType?: string): string => {
  if (!previews || Object.keys(previews).length === 0) {
    return '';
  }

  const statements = Object.entries(previews).map(([key, preview]) => {
    const literal = toJsLiteral(preview);
    return format === 'ts'
      ? `export const ${key} = ${literal}${previewType ? ` satisfies ${previewType}` : ''};`
      : `exports.${key} = ${literal};`;
  });

  return `\n${statements.join('\n\n')}\n`;
};

const renderCatalogDeclaration = (options: {
  format: DeclarationFormat;
  entryPoint: string;
  imports: string[];
  named: string[];
  item: Record<string, unknown>;
  previews?: Record<string, unknown>;
}): string => {
  const { format, entryPoint, imports, named, item, previews } = options;
  const literal = toJsLiteral(item);
  const hasPreviews = !!previews && Object.keys(previews).length > 0;

  if (format === 'ts') {
    const typeImport = hasPreviews ? [...named, 'type Preview'] : named;
    const head = [`import { ${typeImport.join(', ')} } from '${entryPoint}';`, ...imports].join('\n');

    if (!hasPreviews) {
      return `${head}\n\nexport default defineCatalogItem(${literal});\n`;
    }

    return (
      `${head}\n\nconst item = defineCatalogItem(${literal});\n\nexport default item;\n\n` +
      `type ItemPreview = Preview<typeof item>;\n${buildPreviewExports(previews, format, 'ItemPreview')}`
    );
  }

  const head = [`const { ${named.join(', ')} } = require('${entryPoint}');`, ...imports].join('\n');
  return `${head}\n\nexports.default = defineCatalogItem(${literal});\n${buildPreviewExports(previews, format)}`;
};

type ImplementationContext = {
  declaration: Record<string, unknown>;
  /** The implementation file, from the entry key the renderer or format owns. */
  entry: string;
  format: DeclarationFormat;
  previews: Record<string, unknown> | undefined;
};

type ImplementationDeclaration = {
  entryPoint: string;
  imports: string[];
  named: string[];
  implementation: unknown;
  previews?: Record<string, unknown>;
};

/**
 * How each renderer authors its implementation. A source format claims an item before its renderer,
 * because a CSF item is also a React item and the React row would claim it first. The maps are
 * exhaustive, so a new renderer fails to compile until checkout can write its declaration.
 */
const FORMAT_DECLARATIONS: Record<SourceFormat, (context: ImplementationContext) => ImplementationDeclaration> = {
  // The story file owns the previews, so the declaration carries none.
  csf: ({ entry }) => ({
    entryPoint: moduleFor('react'),
    imports: [],
    named: ['defineCatalogItem', 'fromCSF'],
    implementation: new RawExpression(`fromCSF('${toFilePath(entry)}')`),
  }),
};

const RENDERER_DECLARATIONS: Record<RendererKind, (context: ImplementationContext) => ImplementationDeclaration> = {
  handlebars: ({ entry, previews }) => ({
    entryPoint: moduleFor('handlebars'),
    imports: [],
    named: ['defineCatalogItem'],
    implementation: toFilePath(entry),
    previews: toCatalogPreviews(previews),
  }),
  react: ({ declaration, entry, format, previews }) => {
    const { statement, identifier } = buildImplementationImport(declaration, entry, format);
    return {
      entryPoint: moduleFor('react'),
      imports: [statement],
      named: ['defineCatalogItem'],
      implementation: new RawExpression(identifier),
      previews: toCatalogPreviews(previews),
    };
  },
};

/** Emit only catalog declarations, with previews as named exports. */
const renderComponentDeclaration = (declaration: Record<string, unknown>, format: DeclarationFormat): string => {
  const source = {
    renderer: declaration.renderer as ComponentSource['renderer'],
    sourceFormat: declaration.sourceFormat as ComponentSource['sourceFormat'],
  };
  const { renderer, sourceFormat } = source;
  const previews = isPlainObject(declaration.previews) ? declaration.previews : undefined;
  const entries = isPlainObject(declaration.entries) ? declaration.entries : undefined;

  if (
    !isRendererKind(renderer) ||
    (sourceFormat !== undefined && (!isSourceFormat(sourceFormat) || !SOURCE_FORMATS[sourceFormat].renderers.includes(renderer)))
  ) {
    throw new CheckoutError(`Catalog item "${declaration.id}" has invalid renderer/source-format metadata. Rebuild and republish it.`);
  }
  if (!previewKeysAreIdentifiers(previews) && sourceFormat !== 'csf') {
    throw new CheckoutError(
      `Catalog item "${declaration.id}" has preview names that cannot be exported. Rename them and update composition references before publishing.`
    );
  }
  const item = omit(omit(omitSource(declaration), 'previews'), 'componentExport');
  const supportingEntries = buildEntries(declaration.entries, source, { includePrimary: false });
  if (supportingEntries) item.entries = supportingEntries;
  else delete item.entries;

  const entry = entries ? asString(entries[entryKeyFor(renderer, sourceFormat)]) : undefined;
  if (!entry) {
    throw new CheckoutError(`Catalog item "${declaration.id}" has no valid implementation source. Rebuild and republish it.`);
  }

  const build = sourceFormat ? FORMAT_DECLARATIONS[sourceFormat] : RENDERER_DECLARATIONS[renderer];
  const { implementation, ...parts } = build({ declaration, entry, format, previews });
  return renderCatalogDeclaration({ format, ...parts, item: withImplementation(item, implementation) });
};

/** Synthesize the composition declaration file via `defineCatalogItem`. */
const renderPatternDeclaration = (declaration: Record<string, unknown>, format: DeclarationFormat): string => {
  const { components, ...rest } = declaration;
  const item: Record<string, unknown> = {
    ...rest,
    composition: (Array.isArray(components) ? components : []).map((ref) => {
      const { id, ...refRest } = ref as Record<string, unknown>;
      return { ref: id, ...refRest };
    }),
  };

  validateCatalogItem(item);
  return renderCatalogDeclaration({ format, entryPoint: 'handoff-app/pattern', imports: [], named: ['defineCatalogItem'], item });
};

/** Synthesize the declaration file contents for an entity, faithful to its renderer/kind contract. */
const synthesizeDeclaration = (kind: TransferEntityKind, item: Record<string, unknown>, format: DeclarationFormat): string => {
  const declaration =
    kind === 'component'
      ? renderComponentDeclaration(buildComponentDeclaration(item), format)
      : renderPatternDeclaration(buildPatternDeclaration(item), format);
  try {
    transformSync(declaration, { loader: format === 'ts' ? 'ts' : 'js', logLevel: 'silent' });
  } catch {
    throw new CheckoutError(
      `Catalog item "${item.id}" cannot be exported as ${format}. Use valid, distinct preview and component export names, then republish.`
    );
  }
  return declaration;
};

/**
 * Confirm overwriting any local files the checkout would replace. Returns `true` to proceed. With
 * `--force` (or when nothing would be overwritten) it proceeds without prompting; otherwise it asks
 * for explicit confirmation and treats a cancel/decline as an abort.
 */
const confirmOverwrite = async (handoff: Handoff, conflicts: string[]): Promise<boolean> => {
  if (conflicts.length === 0 || handoff.force) {
    return true;
  }
  const relative = conflicts.map((file) => `  - ${path.relative(handoff.workingPath, file)}`).join('\n');
  const proceed = await p.confirm({
    message: `Checkout will overwrite ${conflicts.length} existing local file(s):\n${relative}\nOverwrite?`,
    initialValue: false,
  });
  return !p.isCancel(proceed) && proceed === true;
};

/** Write a registry source file at its relative path under the target directory. */
const writeSourceFile = async (targetDir: string, file: TransferFile): Promise<string> => {
  const absolutePath = resolvePathWithin(targetDir, file.path);
  if (!absolutePath) {
    throw new CheckoutError(`Registry returned an unsafe source file path "${file.path}".`);
  }
  await fs.ensureDir(path.dirname(absolutePath));
  await fs.writeFile(absolutePath, file.content, 'utf8');
  return absolutePath;
};

/**
 * Report the files a checkout would create or replace, and write nothing. Called once the real
 * checkout has computed its targets but before it prompts or writes, so a dry run exercises the same
 * path resolution and conflict detection as the real thing. Shared by the entity, page, token and
 * asset checkout paths.
 */
export const reportPlannedWrites = (handoff: Handoff, label: string, targets: string[], conflicts: string[]): void => {
  const conflicting = new Set(conflicts);
  Logger.info(`Would checkout ${label} (${targets.length} file(s)):`);
  for (const target of targets) {
    const relative = path.relative(handoff.workingPath, target) || target;
    Logger.info(`  ${conflicting.has(target) ? 'overwrite' : 'create'}: ${relative}`);
  }
};

/**
 * Checkout a page: write its single verbatim `.md` (transfer path `<id>.md`) back under
 * `<workingPath>/pages/`. Unlike components/patterns there is no declaration to synthesize — the
 * markdown file is itself the authored source — so the page round-trips byte-for-byte.
 */
const checkoutPage = async (handoff: Handoff, id: string, payload: CheckoutPayload): Promise<void> => {
  const pagesRoot = path.resolve(handoff.workingPath, DEFAULT_ENTITY_DIR.page);
  const targets = payload.files.map((file) => {
    const target = resolvePathWithin(pagesRoot, file.path);
    if (!target) {
      throw new CheckoutError(`Registry returned an unsafe page source path "${file.path}".`);
    }
    return target;
  });
  const conflicts = targets.filter((file) => fs.existsSync(file));
  if (handoff.dryRun) {
    reportPlannedWrites(handoff, `page "${id}"`, targets, conflicts);
    return;
  }
  if (!(await confirmOverwrite(handoff, conflicts))) {
    Logger.warn(`Checkout of page "${id}" cancelled; no files were written.`);
    return;
  }
  for (const file of payload.files) {
    await writeSourceFile(pagesRoot, file);
  }
  Logger.success(
    `Checked out page "${id}" into ${path.relative(handoff.workingPath, pagesRoot) || '.'} ` + `(${payload.files.length} markdown file(s)).`
  );
};

/**
 * Checkout one entity through an already-resolved client: precondition checks → fetch the normalized
 * record + source files → resolve the local target → explicit-overwrite guard → write source files
 * and synthesize the local declaration. Shared by the single-id and bulk entry points so both behave
 * identically. Throws {@link CheckoutError} with actionable messaging on any precondition or fetch
 * failure.
 */
const checkoutSingle = async (
  handoff: Handoff,
  kind: TransferEntityKind,
  id: string,
  client: RegistryClient,
  registryUrl: string
): Promise<string | null> => {
  const validId = kind === 'page' ? isSafeRelativePath(id) : isSafePathSegment(id);
  if (!validId) {
    throw new CheckoutError(`Cannot checkout ${kind} with unsafe id "${id}".`);
  }

  Logger.info(`Fetching ${kind} "${id}" from ${registryUrl}…`);
  let payload: CheckoutPayload;
  try {
    payload = await client.checkout(kind, id);
  } catch (error) {
    if (error instanceof RegistryClientError) {
      throw new CheckoutError(describeFetchFailure(error, kind, id, registryUrl));
    }
    throw error;
  }

  // Pages round-trip as a single verbatim `.md` with no declaration synthesis, and aren't
  // declared in `entries`, so there's nothing to register.
  if (kind === 'page') {
    await checkoutPage(handoff, id, payload);
    return null;
  }

  const targetDir = await resolveTargetDir(handoff, kind, id);
  const format = resolveDeclarationFormat(handoff, targetDir);
  const declarationFileName = resolveDeclarationFileName(targetDir, id, format);
  const declarationPath = path.join(targetDir, declarationFileName);

  // Compute everything that would be written, then gate overwrite of any pre-existing file.
  const sourceTargets = payload.files.map((file) => {
    const absolutePath = resolvePathWithin(targetDir, file.path);
    if (!absolutePath) {
      throw new CheckoutError(`Registry returned an unsafe source file path "${file.path}".`);
    }
    return { file, absolutePath };
  });
  const declaration = synthesizeDeclaration(kind, payload.item, format);
  const plannedWrites = [...sourceTargets.map((entry) => entry.absolutePath), declarationPath];
  const conflicts = plannedWrites.filter((file) => fs.existsSync(file));
  if (handoff.dryRun) {
    // Returning null also skips `registerCheckedOut`, so a dry run never edits handoff.config either.
    reportPlannedWrites(handoff, `${kind} "${id}"`, plannedWrites, conflicts);
    return null;
  }
  if (!(await confirmOverwrite(handoff, conflicts))) {
    Logger.warn(`Checkout of ${kind} "${id}" cancelled; no files were written.`);
    return null;
  }

  await fs.ensureDir(targetDir);
  const written: string[] = [];
  for (const { file } of sourceTargets) {
    written.push(await writeSourceFile(targetDir, file));
  }

  await fs.writeFile(declarationPath, declaration, 'utf8');
  written.push(declarationPath);

  Logger.success(
    `Checked out ${kind} "${id}" into ${path.relative(handoff.workingPath, targetDir) || '.'} ` +
      `(${payload.files.length} source file(s) + ${declarationFileName}).`
  );
  return targetDir;
};

/**
 * Declare freshly checked-out entities in `catalog.include` so the workspace build
 * picks them up. Ones already covered by a collection directory load on their own and are left
 * alone; the rest are added to the config automatically. If the config can't be edited (a computed
 * or unusual `entries` array), we print the paths for the user to add so nothing is silently orphaned.
 */
const registerCheckedOut = async (handoff: Handoff, kind: TransferEntityKind, targetDirs: string[]): Promise<void> => {
  if (kind === 'page') {
    return;
  }
  const entryKind = kind === 'component' ? 'components' : 'patterns';
  const uncovered = targetDirs.filter((dir) => !isEntryCovered(handoff, dir));
  if (uncovered.length === 0) {
    return;
  }

  const result = await writeEntries(handoff, uncovered);
  if (result.status === 'added') {
    const where = result.configPath
      ? path.relative(handoff.workingPath, result.configPath) || path.basename(result.configPath)
      : 'handoff.config';
    Logger.success(`Updated ${where} with ${result.added.length} ${entryKind} path(s).`);
    return;
  }

  const where = result.configPath ? path.relative(handoff.workingPath, result.configPath) : 'handoff.config';
  Logger.warn(`Could not update ${where} automatically. Add these to catalog.include manually:`);
  result.pending.forEach((rel) => Logger.warn(`  - ${rel}`));
};

/**
 * Checkout a single component, pattern, or page from the connected registry into this workspace.
 * Overwriting existing local files requires `--force` or an interactive confirmation.
 */
export const checkoutEntity = async (handoff: Handoff, kind: TransferEntityKind, id: string): Promise<void> => {
  const connection = await resolveConnectionOrThrow(handoff);
  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });
  const targetDir = await checkoutSingle(handoff, kind, id, client, connection.url);
  if (targetDir) {
    await registerCheckedOut(handoff, kind, [targetDir]);
  }
};

/** List the ids the registry publishes for one kind, naming the registry in a listing failure. */
const listPublishedIds = async (kind: TransferEntityKind, client: RegistryClient, registryUrl: string): Promise<string[]> => {
  try {
    const summaries = await client.listEntities(kind);
    return summaries.map((summary) => summary.id);
  } catch (error) {
    if (error instanceof RegistryClientError) {
      throw new CheckoutError(`Could not list ${kind}s from the registry at ${registryUrl}: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Check out the given ids of one kind and register what landed. The caller selects the ids, because a
 * catalog run resolves them across both entity lanes before any of them is written.
 *
 * A per-entity failure is collected and never aborts the rest. Failures are reported here, and the
 * count is returned so the caller raises one error for the whole run.
 */
const checkoutSelected = async (
  handoff: Handoff,
  kind: TransferEntityKind,
  targets: string[],
  client: RegistryClient,
  registryUrl: string
): Promise<number> => {
  let checkedOut = 0;
  const failed: { id: string; message: string }[] = [];
  const targetDirs: string[] = [];
  for (const id of targets) {
    try {
      const targetDir = await checkoutSingle(handoff, kind, id, client, registryUrl);
      if (targetDir) {
        targetDirs.push(targetDir);
      }
      checkedOut += 1;
    } catch (error) {
      failed.push({ id, message: error instanceof Error ? error.message : String(error) });
    }
  }

  // Register everything checked out in one pass, so the config is edited (and confirmed) once.
  await registerCheckedOut(handoff, kind, targetDirs);

  Logger.success(
    `${kind[0].toUpperCase()}${kind.slice(1)}s checkout complete — ${checkedOut} ${handoff.dryRun ? 'would be checked out' : 'checked out'}` +
      `${failed.length ? `, ${failed.length} failed` : ''}.`
  );
  for (const failure of failed) {
    Logger.error(`  - ${failure.id}: ${failure.message}`);
  }
  return failed.length;
};

/**
 * Checkout every published component, pattern, or page of the kind into this workspace. Enumerates
 * the registry's published ids, then checks each out through the shared client. A per-entity failure
 * is collected and never aborts the rest; the run throws at the end if any entity failed. Overwrite
 * prompting is per entity (skipped under `--force`).
 */
export const checkoutEntities = async (handoff: Handoff, kind: TransferEntityKind, ids?: string[]): Promise<void> => {
  const connection = await resolveConnectionOrThrow(handoff);
  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });

  const published = await listPublishedIds(kind, client, connection.url);
  const { selected: targets, unknown } = selectIds(published, ids);
  if (unknown.length > 0) {
    throw new CheckoutError(
      `No ${kind} named ${quoteIds(unknown)} is published in the registry. ` + `Published ${kind}s: ${published.join(', ') || '(none)'}.`
    );
  }

  if (targets.length === 0) {
    Logger.success(`No ${kind}s are published in the registry; nothing to checkout.`);
    return;
  }

  const failed = await checkoutSelected(handoff, kind, targets, client, connection.url);
  if (failed > 0) {
    throw new CheckoutError(`${failed} ${kind}(s) failed to checkout.`);
  }
};

/** The entity lanes a catalog run visits, in dependency order: a pattern composes components. */
const CATALOG_LANES = ['component', 'pattern'] as const;

/**
 * Checkout published catalog items into this workspace: every one, or only `ids` when given. An item
 * was published as a component or as a pattern depending on its declaration, so the lane is looked up
 * in the registry and the caller never names one.
 *
 * A failing lane is reported and never aborts the other. The run throws at the end if any item
 * failed.
 */
export const checkoutCatalog = async (handoff: Handoff, ids?: string[]): Promise<void> => {
  const connection = await resolveConnectionOrThrow(handoff);
  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });

  const available = {
    component: await listPublishedIds('component', client, connection.url),
    pattern: await listPublishedIds('pattern', client, connection.url),
  };

  let lanes: { kind: TransferEntityKind; targets: string[] }[];
  if (ids) {
    const split = splitCatalogIds(ids, available);
    if (split.ambiguous.length > 0) {
      throw new CheckoutError(
        `${quoteIds(split.ambiguous)} is published both as a component and as a pattern. Ask the registry owner to fix the id.`
      );
    }
    if (split.unknown.length > 0) {
      const publishedIds = [...available.component, ...available.pattern];
      throw new CheckoutError(
        `No catalog item named ${quoteIds(split.unknown)} is published in the registry. ` +
          `Published catalog items: ${publishedIds.join(', ') || '(none)'}.`
      );
    }
    lanes = CATALOG_LANES.map((kind) => ({ kind, targets: split.lanes[kind] }));
  } else {
    lanes = CATALOG_LANES.map((kind) => ({ kind, targets: available[kind] }));
  }

  const selected = lanes.filter((lane) => lane.targets.length > 0);
  if (selected.length === 0) {
    Logger.success('No catalog items are published in the registry; nothing to checkout.');
    return;
  }

  let failed = 0;
  for (const lane of selected) {
    failed += await checkoutSelected(handoff, lane.kind, lane.targets, client, connection.url);
  }
  if (failed > 0) {
    throw new CheckoutError(`${failed} catalog item(s) failed to checkout.`);
  }
};
