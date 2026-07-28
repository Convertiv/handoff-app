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
import path from 'path';
import { type EntryKind, isEntryCovered, writeEntries } from '../../config/entries';
import { isComponentDirectory, resolveComponentDeclaration } from '../../config/runtime';
import Handoff from '../../index';
import type { DeclarationFormat } from '../../types/config';
import { Logger } from '../../utils/logger';
import { createRegistryClient, type RegistryClient, RegistryClientError } from '../client';
import { resolveAuthenticatedRegistryConnection } from '../connection';
import { isSafePathSegment, isSafeRelativePath, resolvePathWithin } from '../path';
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
      `Cannot determine where to checkout the ${kind}: entries.${kind}s declares individual ${kind}s under different ` +
        `directories (${roots.map(relative).join(', ')}). Declare a single collection directory in handoff.config, ` +
        `or run checkout without --force to choose interactively.`
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
 * `entries.{components|patterns}`. Each entry is either a collection directory (used as-is) or a
 * single declared entity directory, in which case its parent is the collection root so the new
 * entity lands as a sibling rather than nested inside. Different parents mean the config is
 * ambiguous, so we ask the user; with nothing configured we fall back to the default subdir.
 */
const resolveCollectionRoot = async (handoff: Handoff, kind: TransferEntityKind): Promise<string> => {
  const configuredRoots = kind === 'component' ? handoff.config?.entries?.components : handoff.config?.entries?.patterns;
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

  return roots.length === 1 ? roots[0] : promptForCollectionRoot(handoff, kind, roots);
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
  return (['ts', 'js', 'cjs', 'json'] as const).includes(ext as DeclarationFormat) ? (ext as DeclarationFormat) : undefined;
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

/**
 * The single authored "primary" entry key per renderer. The normalizer derives the others (e.g. it
 * mirrors a React `component` into `template`, and a CSF `story` into `template`), so the stored
 * record carries duplicates that must not be re-authored. React authors `component`; handlebars and
 * CSF author `template` (a `.stories.*` template is what marks a CSF component).
 */
const PRIMARY_ENTRY_BY_RENDERER: Record<string, string> = {
  react: 'component',
  handlebars: 'template',
  csf: 'template',
};

/** Primary entry keys, in preference order, for an unknown renderer. */
const PRIMARY_ENTRY_KEYS = ['component', 'template', 'story'] as const;

/** Supporting entry keys kept verbatim regardless of renderer. */
const SUPPORTING_ENTRY_KEYS = ['js', 'scss', 'schema', 'templates'] as const;

const asString = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);
const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === 'string') ? (value as string[]) : undefined;

/**
 * Rebuild the authored `entries` for a renderer: keep only the renderer's primary entry key (so the
 * normalizer-duplicated keys are dropped) plus the supporting source entries (`js`/`scss`/`schema`/
 * `templates`). An unknown renderer keeps the first available primary key by preference order.
 */
const buildEntries = (entries: unknown, renderer: string | undefined): Record<string, unknown> | undefined => {
  if (!isPlainObject(entries)) {
    return undefined;
  }
  const result: Record<string, unknown> = {};

  const primaryKey = renderer ? PRIMARY_ENTRY_BY_RENDERER[renderer] : undefined;
  if (primaryKey && typeof entries[primaryKey] === 'string') {
    result[primaryKey] = entries[primaryKey];
  } else if (!primaryKey) {
    const fallback = PRIMARY_ENTRY_KEYS.find((key) => typeof entries[key] === 'string');
    if (fallback) {
      result[fallback] = entries[fallback];
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
 * Rebuild the authored `previews` map (`DeclarationPreview`) from the stored previews, keeping only
 * authored fields (`title`, `args`) and dropping build-derived ones (rendered `url`, `usage`,
 * `sourcePreview`). The component normalizer maps authored `args` to `values`, so the stored record
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
    const args = raw.args !== undefined ? raw.args : raw.values;
    if (args !== undefined) preview.args = args;
    result[key] = preview;
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

/**
 * Synthesize an authored component declaration (`GenericDeclarationConfig`) from the normalized
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
  const renderer = asString(item.renderer);
  if (renderer) declaration.renderer = renderer;
  const entries = buildEntries(item.entries, renderer);
  if (entries) declaration.entries = entries;

  const previews = buildPreviews(item.previews);
  if (previews) declaration.previews = previews;

  const categories = asStringArray(item.categories);
  if (categories) declaration.categories = categories;
  const tags = asStringArray(item.tags);
  if (tags) declaration.tags = tags;

  const shouldDo = asStringArray(item.shouldDo) ?? asStringArray(item.should_do);
  if (shouldDo) declaration.shouldDo = shouldDo;
  const shouldNotDo = asStringArray(item.shouldNotDo) ?? asStringArray(item.should_not_do);
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
 * Rebuild the authored pattern component refs (`PatternComponentRef`) from the stored entries,
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
 * Synthesize an authored pattern declaration (`GenericPatternDeclarationConfig`) from the normalized
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

/**
 * Pick the renderer-specific `handoff-app` component factory from the record's renderer so the
 * synthesized declaration matches the authored contract for that renderer. `react`/`handlebars`/`csf`
 * each have a dedicated factory that stamps the renderer itself (so the renderer is dropped from the
 * authored config); an unknown/absent renderer falls back to the generic `defineComponent`, which
 * keeps `renderer` in the config.
 */
const resolveComponentFactory = (renderer: string | undefined): { name: string; stampsRenderer: boolean } => {
  switch (renderer) {
    case 'react':
      return { name: 'defineReactComponent', stampsRenderer: true };
    case 'handlebars':
      return { name: 'defineHandlebarsComponent', stampsRenderer: true };
    case 'csf':
      return { name: 'defineCsfComponent', stampsRenderer: true };
    default:
      return { name: 'defineComponent', stampsRenderer: false };
  }
};

/** Drop a key from an object without mutating it. */
const omit = (object: Record<string, unknown>, key: string): Record<string, unknown> => {
  const { [key]: _removed, ...rest } = object;
  return rest;
};

/** Turn a relative entry path into a module specifier (extension stripped, `./`-prefixed). */
const toImportSpecifier = (entryPath: string): string => {
  const withoutExt = entryPath.replace(COMPONENT_EXTENSION, '').split(path.sep).join('/');
  return withoutExt.startsWith('.') ? withoutExt : `./${withoutExt}`;
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

/** Wrap a config object in a factory call for the given code format (unquoted identifier keys). */
const wrapFactory = (factory: string, config: Record<string, unknown>, format: DeclarationFormat): string => {
  const literal = toJsLiteral(config);
  return format === 'ts'
    ? `import { ${factory} } from 'handoff-app';\n\nexport default ${factory}(${literal});\n`
    : `const { ${factory} } = require('handoff-app');\n\nmodule.exports = ${factory}(${literal});\n`;
};

/**
 * Synthesize the component declaration file. JSON declarations are the bare object (carrying
 * `renderer`/`entries`, which the loader reads directly). Code declarations use the renderer-specific
 * factory; React additionally imports the component from its `entries.component` source and passes it
 * as the factory's first argument (matching the authored `defineReactComponent` contract). When the
 * renderer is `react` but no component entry is available, it falls back to the generic factory.
 */
const renderComponentDeclaration = (declaration: Record<string, unknown>, format: DeclarationFormat): string => {
  if (format === 'json') {
    return `${JSON.stringify(declaration, null, 2)}\n`;
  }

  const renderer = asString(declaration.renderer);
  const factory = resolveComponentFactory(renderer);
  const componentEntry = isPlainObject(declaration.entries) ? asString(declaration.entries.component) : undefined;

  if (factory.name === 'defineReactComponent' && componentEntry) {
    const specifier = toImportSpecifier(componentEntry);
    const identifier = toComponentIdentifier(componentEntry, asString(declaration.id) ?? 'Component');
    const literal = toJsLiteral(omit(declaration, 'renderer'));
    return format === 'ts'
      ? `import { defineReactComponent } from 'handoff-app';\nimport ${identifier} from '${specifier}';\n\nexport default defineReactComponent(${identifier}, ${literal});\n`
      : `const { defineReactComponent } = require('handoff-app');\nconst ${identifier} = require('${specifier}').default;\n\nmodule.exports = defineReactComponent(${identifier}, ${literal});\n`;
  }

  // React without a resolvable component entry can't use defineReactComponent; keep renderer and use
  // the generic factory so the build still infers the renderer.
  const effective = factory.name === 'defineReactComponent' ? { name: 'defineComponent', stampsRenderer: false } : factory;
  const config = effective.stampsRenderer ? omit(declaration, 'renderer') : declaration;
  return wrapFactory(effective.name, config, format);
};

/** Synthesize the pattern declaration file via `definePattern` (or a bare object for JSON). */
const renderPatternDeclaration = (declaration: Record<string, unknown>, format: DeclarationFormat): string => {
  if (format === 'json') {
    return `${JSON.stringify(declaration, null, 2)}\n`;
  }
  return wrapFactory('definePattern', declaration, format);
};

/** Synthesize the declaration file contents for an entity, faithful to its renderer/kind contract. */
const synthesizeDeclaration = (kind: TransferEntityKind, item: Record<string, unknown>, format: DeclarationFormat): string =>
  kind === 'component'
    ? renderComponentDeclaration(buildComponentDeclaration(item), format)
    : renderPatternDeclaration(buildPatternDeclaration(item), format);

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
  const conflicts = [...sourceTargets.map((entry) => entry.absolutePath), declarationPath].filter((file) => fs.existsSync(file));
  if (!(await confirmOverwrite(handoff, conflicts))) {
    Logger.warn(`Checkout of ${kind} "${id}" cancelled; no files were written.`);
    return null;
  }

  await fs.ensureDir(targetDir);
  const written: string[] = [];
  for (const { file } of sourceTargets) {
    written.push(await writeSourceFile(targetDir, file));
  }

  const declaration = synthesizeDeclaration(kind, payload.item, format);
  await fs.writeFile(declarationPath, declaration, 'utf8');
  written.push(declarationPath);

  Logger.success(
    `Checked out ${kind} "${id}" into ${path.relative(handoff.workingPath, targetDir) || '.'} ` +
      `(${payload.files.length} source file(s) + ${declarationFileName}).`
  );
  return targetDir;
};

/**
 * Declare freshly checked-out entities in `entries.{components|patterns}` so the workspace build
 * picks them up. Ones already covered by a collection directory load on their own and are left
 * alone; the rest are added to the config automatically. If the config can't be edited (a computed
 * or unusual `entries` array), we print the paths for the user to add so nothing is silently orphaned.
 */
const registerCheckedOut = async (handoff: Handoff, kind: TransferEntityKind, targetDirs: string[]): Promise<void> => {
  if (kind === 'page') {
    return;
  }
  const entryKind: EntryKind = kind === 'component' ? 'components' : 'patterns';
  const uncovered = targetDirs.filter((dir) => !isEntryCovered(handoff, entryKind, dir));
  if (uncovered.length === 0) {
    return;
  }

  const result = await writeEntries(handoff, entryKind, uncovered);
  if (result.status === 'added') {
    const where = result.configPath ? path.relative(handoff.workingPath, result.configPath) || path.basename(result.configPath) : 'handoff.config';
    Logger.success(`Updated ${where} with ${result.added.length} ${entryKind} path(s).`);
    return;
  }

  const where = result.configPath ? path.relative(handoff.workingPath, result.configPath) : 'handoff.config';
  Logger.warn(`Could not update ${where} automatically. Add these to entries.${entryKind} manually:`);
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

/**
 * Checkout every published component, pattern, or page of the kind into this workspace. Enumerates
 * the registry's published ids, then checks each out through the shared client. A per-entity failure
 * is collected and never aborts the rest; the run throws at the end if any entity failed. Overwrite
 * prompting is per entity (skipped under `--force`).
 */
export const checkoutEntities = async (handoff: Handoff, kind: TransferEntityKind): Promise<void> => {
  const connection = await resolveConnectionOrThrow(handoff);
  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });

  let summaries;
  try {
    summaries = await client.listEntities(kind);
  } catch (error) {
    if (error instanceof RegistryClientError) {
      throw new CheckoutError(`Could not list ${kind}s from the registry at ${connection.url}: ${error.message}`);
    }
    throw error;
  }

  if (summaries.length === 0) {
    Logger.success(`No ${kind}s are published in the registry; nothing to checkout.`);
    return;
  }

  let checkedOut = 0;
  const failed: { id: string; message: string }[] = [];
  const targetDirs: string[] = [];
  for (const { id } of summaries) {
    try {
      const targetDir = await checkoutSingle(handoff, kind, id, client, connection.url);
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
    `${kind[0].toUpperCase()}${kind.slice(1)}s checkout complete — ${checkedOut} checked out${failed.length ? `, ${failed.length} failed` : ''}.`
  );
  if (failed.length > 0) {
    for (const failure of failed) {
      Logger.error(`  - ${failure.id}: ${failure.message}`);
    }
    throw new CheckoutError(`${failed.length} ${kind}(s) failed to checkout.`);
  }
};
