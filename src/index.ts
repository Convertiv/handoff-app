import 'dotenv/config';
import fs from 'fs-extra';
import { Types as CoreTypes, Handoff as HandoffRunner, Providers } from 'handoff-core';
import path from 'path';
import buildApp, { devApp, watchApp, type BuildPackage, type BuildTarget } from './app-builder';
import { ejectConfig, ejectPages, ejectTheme } from './cli/eject';
import { makeComponent, makePage, makeTemplate } from './cli/make';
import { initConfigWithMetadata, initRuntimeConfig, validateConfig } from './config';
import pipeline, { buildComponents, buildPatterns } from './pipeline';
import { ALL_KIND_ORDER, ENTITY_WIRE_KIND, isRegistryEntityKind, REGISTRY_ENTITY_KINDS, type RegistryEntityKind } from './registry/content-kinds';
import type { TransferEntityKind } from './registry/transfer';
import { createFilesystemStore, type HandoffStore } from './store';
import processComponents, { ComponentSegment } from './transformers/preview/component/builder';
import { Config, ConfigFileEntry, RuntimeConfig } from './types/config';
import { Logger } from './utils/logger';
import { normalizePathForCompare, resolveWorkingPath } from './utils/path';
import { generateFilesystemSafeId } from './utils/path';

/** How a {@link Handoff} instance is set up. */
export interface HandoffOptions {
  debug?: boolean;
  force?: boolean;
  /**
   * Report what would happen instead of doing it: publish uploads nothing and needs no registry URL
   * or token, and checkout writes no workspace file. A publish dry run still runs the build, so build
   * output on disk is refreshed; pair it with `skipBuild` to leave that alone too.
   */
  dryRun?: boolean;
  /** Publish from the existing build output instead of running a fresh build. */
  skipBuild?: boolean;
  /** Partial config merged over the loaded config file. */
  config?: Partial<Config>;
  /** Explicit config file (the CLI's `-c, --config`), resolved from the working path. */
  configPath?: string;
}

/**
 * A content kind to act on, optionally narrowed to specific ids. The plain form is the common case
 * (`'components'`); the object form publishes or checks out only part of a kind.
 */
export type ContentTarget = RegistryEntityKind | { kind: RegistryEntityKind; ids?: string[] };

/**
 * Reject a kind we do not know. Plural kinds arrive from CLI arguments and HTTP payloads, so an
 * unrecognized one has to stop here: the entity paths below pick their store by elimination, and an
 * unchecked value would quietly resolve to pages.
 */
const assertContentKind = (kind: string): void => {
  if (!isRegistryEntityKind(kind)) {
    throw new Error(`Unknown content kind "${kind}". Supported kinds: ${REGISTRY_ENTITY_KINDS.join(', ')}.`);
  }
};

const normalizeTarget = (target: ContentTarget): { kind: RegistryEntityKind; ids?: string[] } =>
  typeof target === 'string' ? { kind: target } : target;

/**
 * Normalize an optional single-or-list selection to a list, or `undefined` for "everything". An empty
 * list means "everything" too: yargs defaults an omitted variadic positional to `[]`, and that has to
 * read as "no narrowing", not "no targets".
 */
const toSelection = (value?: string | string[]): string[] | undefined => {
  if (value === undefined) return undefined;
  const selection = Array.isArray(value) ? value : [value];
  return selection.length > 0 ? selection : undefined;
};

/**
 * The one id a selection names, if it names exactly one. Lets a single-target request keep the
 * cheaper targeted-build path whether it arrived as a string or a one-element list.
 */
const onlyId = (value?: string | string[]): string | undefined => {
  const selection = toSelection(value);
  return selection?.length === 1 ? selection[0] : undefined;
};

/**
 * Run one operation across several targets in order, reporting each failure as it happens and throwing
 * once at the end. Shared by {@link Handoff.publishAll} and {@link Handoff.checkoutAll} so a
 * multi-kind run behaves the same in both directions.
 */
const runKinds = async (
  targets: readonly ContentTarget[],
  verb: 'publish' | 'checkout',
  dryRun: boolean,
  run: (kind: RegistryEntityKind, ids?: string[]) => Promise<unknown>
): Promise<void> => {
  const kinds = targets.map(normalizeTarget);
  const failed: { kind: RegistryEntityKind; message: string }[] = [];
  for (const { kind, ids } of kinds) {
    try {
      await run(kind, ids);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ kind, message });
      Logger.error(`Failed to ${verb} ${kind}: ${message}`);
    }
  }

  const succeeded = kinds.length - failed.length;
  const outcome = verb === 'publish' ? 'published' : 'checked out';
  Logger.success(
    `${dryRun ? 'Dry run' : `${verb[0].toUpperCase()}${verb.slice(1)} complete`} — ${succeeded}/${kinds.length} kind(s) ` +
      `${dryRun ? `would be ${outcome}` : outcome}${failed.length ? `, ${failed.length} failed` : ''}.`
  );
  if (failed.length > 0) {
    throw new Error(`${failed.length} kind(s) failed to ${verb}: ${failed.map((entry) => entry.kind).join(', ')}.`);
  }
};

class Handoff {
  config: Config | null;
  debug: boolean = false;
  force: boolean = false;
  dryRun: boolean = false;
  skipBuild: boolean = false;
  modulePath: string = path.resolve(__filename, '../..');
  workingPath: string = resolveWorkingPath();
  exportsDirectory: string = 'exported';
  sitesDirectory: string = 'out';
  runtimeConfig?: RuntimeConfig | null;
  designMap: {
    colors: {};
    effects: {};
    typography: {};
  };

  private _store?: HandoffStore;

  /**
   * Normalized store over the current workspace runtime for components, patterns, pages, tokens,
   * and assets. It is created lazily and reads live from `runtimeConfig`.
   */
  get store(): HandoffStore {
    if (!this._store) {
      this._store = createFilesystemStore(this);
    }
    return this._store;
  }

  private _options: HandoffOptions = {};
  private _configFilePaths: string[] = [];
  private _configFileIndex: Map<string, ConfigFileEntry> = new Map();
  private _mainConfigFilePath?: string;
  private _documentationObjectCache?: CoreTypes.IDocumentationObject;
  private _handoffRunner?: ReturnType<typeof HandoffRunner> | null;

  constructor(options: HandoffOptions = {}) {
    this._options = options;
    this.construct(options);
  }

  private construct(options: HandoffOptions) {
    this.config = null;
    this.debug = options.debug ?? false;
    this.force = options.force ?? false;
    this.dryRun = options.dryRun ?? false;
    this.skipBuild = options.skipBuild ?? false;
    Logger.init({ debug: this.debug });
    this.init(options.config);
    global.handoff = this;
  }

  init(configOverride?: Partial<Config>): Handoff {
    const configResult = initConfigWithMetadata(configOverride ?? {}, {
      workingPath: this.workingPath,
      configPath: this._options.configPath,
    });
    const config = configResult.config;
    this.config = config;
    this._mainConfigFilePath = configResult.configPath;
    this.exportsDirectory = config.exportsOutputDirectory ?? this.exportsDirectory;
    this.sitesDirectory = config.sitesOutputDirectory ?? this.exportsDirectory;
    [this.runtimeConfig, this._configFilePaths, this._configFileIndex] = initRuntimeConfig(this);
    if(this.config.app.base_path && !process.env.HANDOFF_APP_BASE_PATH) {
      process.env.HANDOFF_APP_BASE_PATH = this.config.app.base_path ?? '';
    }
    return this;
  }

  reload(): Handoff {
    this.construct(this._options);
    return this;
  }

  preRunner(validate?: boolean): Handoff {
    if (!this.config) {
      throw Error('Handoff not initialized');
    }
    if (validate) {
      this.config = validateConfig(this.config);
    }
    return this;
  }

  async fetch(): Promise<Handoff> {
    this.preRunner();
    await pipeline(this);
    return this;
  }

  async component(name: string | null): Promise<Handoff> {
    this.preRunner();

    if (name) {
      name = name.replace('.hbs', '');
      await processComponents(this, name);
    } else {
      await buildComponents(this);
    }

    return this;
  }

  async pattern(): Promise<Handoff> {
    this.preRunner();
    await buildPatterns(this);
    return this;
  }

  async build(target: BuildTarget = 'static', skipComponents?: boolean, buildPackage?: BuildPackage): Promise<Handoff> {
    this.preRunner();
    await buildApp(this, target, skipComponents, buildPackage);
    return this;
  }

  /**
   * Runs the package-owned registry database migrations against the configured PostgreSQL/Neon
   * database. Independent of {@link build} — it only reads config + DB env vars and applies the
   * bundled migration set.
   */
  async dbMigrate(): Promise<Handoff> {
    if (!this.config) {
      throw Error('Handoff not initialized');
    }
    const { runRegistryMigrations } = await import('./registry/db/migrate');
    await runRegistryMigrations(this);
    return this;
  }

  /**
   * Publish components, patterns, or pages from this connected workspace to the configured remote
   * registry. With a single `id` it publishes that one entity after a targeted build; with a list of
   * ids, or none, it builds the kind once and publishes the selected (or every declared) entity,
   * skipping ones whose content is unchanged on the registry (`--force` re-uploads all). Pages upload
   * their record and markdown source because they render at runtime. The publish module is loaded
   * lazily so the registry client and build code never enter the docs app bundle.
   */
  async publish(kind: TransferEntityKind, id?: string | string[]): Promise<Handoff> {
    this.preRunner();
    const single = onlyId(id);
    if (single) {
      const { publishEntity } = await import('./registry/publish');
      await publishEntity(this, kind, single);
    } else {
      const { publishEntities } = await import('./registry/publish');
      await publishEntities(this, kind, toSelection(id));
    }
    return this;
  }

  /**
   * Checkout components, patterns, or pages from the connected remote registry into this workspace.
   * With a single `id` it checks out that one entity; with a list of ids, or none, it checks out the
   * selected (or every published) entity of the kind. Overwriting existing local files requires
   * `--force` or an interactive confirmation. The checkout module is loaded lazily so the registry
   * client never enters the docs app bundle.
   */
  async checkout(kind: TransferEntityKind, id?: string | string[]): Promise<Handoff> {
    this.preRunner();
    const single = onlyId(id);
    if (single) {
      const { checkoutEntity } = await import('./registry/checkout');
      await checkoutEntity(this, kind, single);
    } else {
      const { checkoutEntities } = await import('./registry/checkout');
      await checkoutEntities(this, kind, toSelection(id));
    }
    return this;
  }

  /**
   * Publish design token sets from this connected workspace to the configured remote registry. Runs a
   * fresh token build (Figma extract + style transformers), discovers the logical sets, and uploads
   * each changed set (its extracted record + generated artifacts). Publishes every set when `setId` is
   * omitted, or only the named set(s) (`foundation/colors`, `component/<id>`). Loaded lazily so the
   * registry client/build code never enters the docs app bundle.
   */
  async publishTokens(setId?: string | string[]): Promise<Handoff> {
    this.preRunner();
    const { publishTokens } = await import('./registry/publish/tokens');
    await publishTokens(this, toSelection(setId));
    return this;
  }

  /**
   * Checkout design token sets from the connected remote registry into this workspace: reconstruct
   * the canonical local `tokens.json` and restore the generated token files to their configured output
   * paths. Checks out every published set when `setId` is omitted, or only the named set(s). Loaded
   * lazily so the registry client never enters the docs app bundle.
   */
  async checkoutTokens(setId?: string | string[]): Promise<Handoff> {
    this.preRunner();
    const { checkoutTokens } = await import('./registry/checkout/tokens');
    await checkoutTokens(this, toSelection(setId));
    return this;
  }

  /**
   * Publish asset collections (icons/logos/fonts) from this connected workspace to the configured
   * remote registry. Runs a fresh build (Figma extract + asset generation), discovers the collections,
   * uploads only content hashes the registry lacks, and finalizes each collection manifest atomically.
   * Publishes every collection when `collection` is omitted, or only the named one(s). Loaded lazily so
   * the registry client/build code never enters the docs app bundle.
   */
  async publishAssets(collection?: string | string[]): Promise<Handoff> {
    this.preRunner();
    const { publishAssets } = await import('./registry/publish/assets');
    await publishAssets(this, toSelection(collection));
    return this;
  }

  /**
   * Checkout asset collections from the connected remote registry into this workspace: recreate the
   * standard workspace asset files, collection JSON, icon sprite/manifest, and downloadable archives.
   * Checks out every published collection when `collection` is omitted, or only the named one(s).
   * Loaded lazily so the registry client never enters the docs app bundle.
   */
  async checkoutAssets(collection?: string | string[]): Promise<Handoff> {
    this.preRunner();
    const { checkoutAssets } = await import('./registry/checkout/assets');
    await checkoutAssets(this, toSelection(collection));
    return this;
  }

  /**
   * Publish one content kind named by its plural form (`components`, `tokens`, …). The entry point for
   * callers working in the plural vocabulary, so the plural-to-transfer-path mapping lives in one
   * place.
   */
  async publishKind(kind: RegistryEntityKind, id?: string | string[]): Promise<Handoff> {
    assertContentKind(kind);
    if (kind === 'tokens') return this.publishTokens(id);
    if (kind === 'assets') return this.publishAssets(id);
    return this.publish(ENTITY_WIRE_KIND[kind], id);
  }

  /** Checkout one content kind named by its plural form. Mirrors {@link publishKind}. */
  async checkoutKind(kind: RegistryEntityKind, id?: string | string[]): Promise<Handoff> {
    assertContentKind(kind);
    if (kind === 'tokens') return this.checkoutTokens(id);
    if (kind === 'assets') return this.checkoutAssets(id);
    return this.checkout(ENTITY_WIRE_KIND[kind], id);
  }

  /**
   * Publish every content kind, or the given subset of kinds and ids, in dependency order: tokens and
   * assets first (rendered component artifacts reference the CSS variables and asset URLs they
   * produce), then components, patterns and pages. A failing kind is reported and never aborts the
   * rest; the run throws at the end if any kind failed.
   */
  async publishAll(targets: readonly ContentTarget[] = ALL_KIND_ORDER): Promise<Handoff> {
    await runKinds(targets, 'publish', this.dryRun, (kind, ids) => this.publishKind(kind, ids));
    return this;
  }

  /** Checkout every content kind, or the given subset, in the same order. Mirrors {@link publishAll}. */
  async checkoutAll(targets: readonly ContentTarget[] = ALL_KIND_ORDER): Promise<Handoff> {
    await runKinds(targets, 'checkout', this.dryRun, (kind, ids) => this.checkoutKind(kind, ids));
    return this;
  }

  async ejectConfig(): Promise<Handoff> {
    this.preRunner();
    await ejectConfig(this);
    return this;
  }

  async ejectPages(): Promise<Handoff> {
    this.preRunner();
    await ejectPages(this);
    return this;
  }

  async ejectTheme(): Promise<Handoff> {
    this.preRunner();
    await ejectTheme(this);
    return this;
  }

  async makeTemplate(component: string, state: string): Promise<Handoff> {
    this.preRunner();
    await makeTemplate(this, component, state);
    return this;
  }

  async makePage(name: string, parent: string): Promise<Handoff> {
    this.preRunner();
    await makePage(this, name, parent);
    return this;
  }

  async makeComponent(name: string): Promise<Handoff> {
    this.preRunner();
    await makeComponent(this, name);
    return this;
  }

  async start(): Promise<Handoff> {
    this.preRunner();
    await watchApp(this);
    return this;
  }

  async dev(): Promise<Handoff> {
    this.preRunner();
    await devApp(this);
    return this;
  }

  async validateComponents(skipBuild?: boolean): Promise<Handoff> {
    this.preRunner();
    if (!skipBuild) {
      await processComponents(this, undefined, ComponentSegment.Validation);
    }
    return this;
  }

  /**
   * Retrieves the documentation object, using cached version if available
   * @returns {Promise<CoreTypes.IDocumentationObject | undefined>} The documentation object or undefined if not found
   */
  async getDocumentationObject(): Promise<CoreTypes.IDocumentationObject | undefined> {
    if (this._documentationObjectCache) {
      return this._documentationObjectCache;
    }
    const documentationObject = await this.readJsonFile(this.getTokensFilePath());
    this._documentationObjectCache = documentationObject;
    return documentationObject;
  }

  async getRunner(): Promise<ReturnType<typeof HandoffRunner>> {
    if (!!this._handoffRunner) {
      return this._handoffRunner;
    }

    const apiCredentials = {
      projectId: this.config.figma_project_id,
      accessToken: this.config.dev_access_token,
    };

    // Initialize the provider
    const provider = Providers.RestApiProvider(apiCredentials);

    this._handoffRunner = HandoffRunner(
      provider,
      {
        options: {
          transformer: this.runtimeConfig.options,
        },
      },
      {
        log: (msg: string): void => {
          Logger.log(msg);
        },
        err: (msg: string): void => {
          Logger.error(msg);
        },
        warn: (msg: string): void => {
          Logger.warn(msg);
        },
        success: (msg: string): void => {
          Logger.success(msg);
        },
      }
    );

    return this._handoffRunner;
  }

  /**
   * Gets the project ID, falling back to filesystem-safe working path if figma_project_id is missing
   * @returns {string} The project ID to use for path construction
   */
  getProjectId(): string {
    if (this.config?.figma_project_id) {
      return this.config.figma_project_id;
    }
    // Fallback to filesystem-safe transformation of working path
    return generateFilesystemSafeId(this.workingPath);
  }

  /**
   * Gets the output path for the current project
   * @returns {string} The absolute path to the output directory
   */
  getOutputPath(): string {
    return path.resolve(this.workingPath, this.exportsDirectory, this.getProjectId());
  }

  /**
   * Gets the path to the tokens.json file
   * @returns {string} The absolute path to the tokens.json file
   */
  getTokensFilePath(): string {
    return path.join(this.getOutputPath(), 'tokens.json');
  }

  /**
   * Gets the path to the preview.json file
   * @returns {string} The absolute path to the preview.json file
   */
  getPreviewFilePath(): string {
    return path.join(this.getOutputPath(), 'preview.json');
  }

  /**
   * Gets the path to the tokens directory
   * @returns {string} The absolute path to the tokens directory
   */
  getVariablesFilePath(): string {
    return path.join(this.getOutputPath(), 'tokens');
  }

  /**
   * Gets the generated docs API root (`<workingPath>/public/api`) — the tree holding the asset
   * collection JSON, per-asset icon/logo bodies, and the icon sprite + manifest.
   * @returns {string} The absolute path to the public docs API directory
   */
  getAssetsApiPath(): string {
    return path.resolve(this.workingPath, 'public', 'api');
  }

  /**
   * Gets the path to the icons.zip file
   * @returns {string} The absolute path to the icons.zip file
   */
  getIconsZipFilePath(): string {
    return path.join(this.getOutputPath(), 'icons.zip');
  }

  /**
   * Gets the path to the logos.zip file
   * @returns {string} The absolute path to the logos.zip file
   */
  getLogosZipFilePath(): string {
    return path.join(this.getOutputPath(), 'logos.zip');
  }

  /**
   * Gets the list of config file paths
   * @returns {string[]} Array of absolute paths to config files
   */
  getConfigFilePaths(): string[] {
    const combined = this._mainConfigFilePath ? [this._mainConfigFilePath, ...this._configFilePaths] : this._configFilePaths;
    return Array.from(new Set(combined));
  }

  /**
   * Gets the selected main config file path if one exists.
   */
  getMainConfigFilePath(): string | undefined {
    return this._mainConfigFilePath;
  }

  getConfigFileEntry(configPath: string): ConfigFileEntry | undefined {
    return this._configFileIndex.get(normalizePathForCompare(configPath));
  }

  /**
   * Clears all cached data
   * @returns {void}
   */
  clearCaches(): void {
    this._documentationObjectCache = undefined;
  }

  /**
   * Reads and parses a JSON file
   * @param {string} path - Path to the JSON file
   * @returns {Promise<any>} The parsed JSON content or undefined if file cannot be read
   */
  private async readJsonFile(path: string) {
    try {
      return await fs.readJSON(path);
    } catch (e) {
      return undefined;
    }
  }
}

export type { ComponentObject as Component } from './transformers/preview/types';
export type { Config, RegisterHandlebarsHelpersContext } from './types/config';
export { defineConfig } from './config';
export {
  defineComponent,
  defineCsfComponent,
  defineHandlebarsComponent,
  definePattern,
  defineReactComponent,
} from './declarations';
export { defineAssetStorage } from './registry/asset-storage/define';
export type {
  AssetStorage,
  AssetStorageContext,
  AssetStorageFactory,
  AssetStorageInput,
  AssetStorageReadResult,
} from './registry/asset-storage/types';
export type {
  CsfDeclarationConfig,
  DeclarationPreview,
  GenericDeclarationConfig,
  GenericPatternDeclarationConfig,
  HandlebarsDeclarationConfig,
  PatternComponentRef,
  ReactDeclarationConfig,
  RendererKind,
} from './declarations';

// Export transformers and types from handoff-core
export { Transformers as CoreTransformers, TransformerUtils as CoreTransformerUtils, Types as CoreTypes } from 'handoff-core';

export default Handoff;
