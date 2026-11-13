/**
 * This module has no runtime imports, so every layer can use the renderer registry.
 * Import it directly to avoid the catalog barrel dependencies, including `fs-extra`.
 */

/** Add a renderer only with its preview support. */
export type RendererKind = 'react' | 'handlebars' | 'angular' | 'vue';

/** How an implementation file is written, independent of the renderer that renders it. */
export type SourceFormat = 'csf';

/** Key in `entries` that holds an implementation file. */
export type EntryKey = 'component' | 'template' | 'story';

export type ComponentSource = { renderer: RendererKind; sourceFormat?: SourceFormat };

/** How the docs label and highlight a renderer's code. Language names are Prism names the docs app registers. */
export type RendererCode = {
  label: string;
  /** Language of the implementation source. */
  language: string;
  /** Language of the generated usage snippet. */
  usageLanguage: string;
};

/**
 * How checkout writes the implementation into a synthesized declaration.
 *
 * - `import`: imports the recorded export, else the default export.
 * - `named-import`: imports the recorded export, else names the file. Use it for a renderer that
 *   finds the component by its type rather than by an export, where a default import binds nothing.
 * - `path`: names the file.
 *
 * An import types the previews from the implementation, so prefer it where the renderer allows it.
 */
export type CheckoutImplementation = 'import' | 'named-import' | 'path';

type RendererDefinition = {
  /** Declaration module that supplies this renderer. */
  module: string;
  /** Entry key normalization writes the implementation file to. */
  entryKey: EntryKey;
  /**
   * Packages that a declaration loads at run time instead of bundling. A declaration can import its
   * implementation, so without this the loader would bundle a whole framework into every declaration.
   */
  runtimePackages: string[];
  /**
   * Whether reading a declaration runs the implementation module it imports. Reading needs only the
   * catalog data. When false, the import binds placeholders instead, so the loader never runs code
   * that only the renderer's own build can run, such as Angular decorators or browser-only modules.
   */
  loadsImplementation: boolean;
  checkoutImplementation: CheckoutImplementation;
  code: RendererCode;
};

type SourceFormatDefinition = {
  /** Renderers this format applies to. */
  renderers: RendererKind[];
  entryKey: EntryKey;
  /** Export of the renderer module that declares an implementation in this format. */
  helper: string;
};

export const RENDERERS: Record<RendererKind, RendererDefinition> = {
  react: {
    module: 'handoff-app/react',
    entryKey: 'component',
    runtimePackages: ['react', 'react-dom'],
    // A React module is plain JavaScript, and a declaration may read values from it.
    loadsImplementation: true,
    checkoutImplementation: 'import',
    code: { label: 'React (TSX)', language: 'tsx', usageLanguage: 'tsx' },
  },
  handlebars: {
    module: 'handoff-app/handlebars',
    entryKey: 'template',
    runtimePackages: [],
    loadsImplementation: false,
    checkoutImplementation: 'path',
    code: { label: 'Handlebars', language: 'handlebars', usageLanguage: 'handlebars' },
  },
  angular: {
    module: 'handoff-app/angular',
    entryKey: 'component',
    runtimePackages: ['@angular/*'],
    // Decorators need the workspace compiler options, and a component often touches the DOM on load.
    loadsImplementation: false,
    checkoutImplementation: 'named-import',
    code: { label: 'Angular (TS)', language: 'typescript', usageLanguage: 'html' },
  },
  vue: {
    module: 'handoff-app/vue',
    entryKey: 'component',
    runtimePackages: ['vue', '@vue/*'],
    // A single-file component is not JavaScript, so only the renderer's own build can load it.
    loadsImplementation: false,
    checkoutImplementation: 'import',
    code: { label: 'Vue (SFC)', language: 'markup', usageLanguage: 'html' },
  },
};

export const SOURCE_FORMATS: Record<SourceFormat, SourceFormatDefinition> = {
  csf: {
    renderers: ['react'],
    entryKey: 'story',
    helper: 'fromCSF',
  },
};

/** Which renderers can own a file name, and the source format the name implies. */
export type SourceClaim = { renderers: RendererKind[]; format?: SourceFormat };

/**
 * This table never decides a renderer. The declaration states it, and the table only checks the
 * implementation file against it. Keying by suffix keeps one row per file name: a suffix that more
 * than one renderer owns lists them all, and a duplicate key is a compile error. A file that no
 * row claims is not checked.
 */
const SOURCE_SUFFIXES: Record<string, SourceClaim> = {
  '.stories.tsx': { renderers: ['react'], format: 'csf' },
  '.stories.jsx': { renderers: ['react'], format: 'csf' },
  '.stories.ts': { renderers: ['react'], format: 'csf' },
  '.stories.js': { renderers: ['react'], format: 'csf' },
  '.tsx': { renderers: ['react'] },
  '.jsx': { renderers: ['react'] },
  '.hbs': { renderers: ['handlebars'] },
  // Angular CLI before v20 names every component this way. Newer projects drop the suffix, so a plain
  // `.ts` file stays unclaimed.
  '.component.ts': { renderers: ['angular'] },
  '.vue': { renderers: ['vue'] },
};

/** Longest first, so `.stories.tsx` reads as a CSF source rather than a plain React source. */
const SUFFIXES_BY_LENGTH = Object.keys(SOURCE_SUFFIXES).sort((first, second) => second.length - first.length);

const RENDERER_KINDS = Object.keys(RENDERERS) as RendererKind[];
const SOURCE_FORMAT_KINDS = Object.keys(SOURCE_FORMATS) as SourceFormat[];

/** Every renderer's run-time packages, for loaders that evaluate declarations of any renderer. */
export const RUNTIME_PACKAGES: string[] = RENDERER_KINDS.flatMap((renderer) => RENDERERS[renderer].runtimePackages);

export const isRendererKind = (value: unknown): value is RendererKind => RENDERER_KINDS.includes(value as RendererKind);

export const isSourceFormat = (value: unknown): value is SourceFormat => SOURCE_FORMAT_KINDS.includes(value as SourceFormat);

/** What the file name says about a source, matched case-insensitively. Undefined when no suffix claims it. */
export const sourceForFile = (file: string | undefined): SourceClaim | undefined => {
  if (!file) return undefined;

  const lowerCased = file.toLowerCase();
  const suffix = SUFFIXES_BY_LENGTH.find((candidate) => lowerCased.endsWith(candidate));
  return suffix ? SOURCE_SUFFIXES[suffix] : undefined;
};

/** Entry key normalization records the implementation file under, if the renderer is registered. */
export const entryKeyFor = (renderer: RendererKind | undefined, sourceFormat?: SourceFormat): EntryKey | undefined =>
  sourceFormat ? SOURCE_FORMATS[sourceFormat]?.entryKey : renderer ? RENDERERS[renderer]?.entryKey : undefined;

/**
 * The renderer whose entry point a declaration imports, read from its source text before it runs.
 * Undefined when it imports none, as a composition does.
 */
export const rendererImportedBy = (sourceCode: string): RendererKind | undefined =>
  RENDERER_KINDS.find(
    (renderer) => sourceCode.includes(`'${RENDERERS[renderer].module}'`) || sourceCode.includes(`"${RENDERERS[renderer].module}"`)
  );

/** Declaration module that supplies a renderer, or undefined when it has no module of its own. */
export const moduleFor = (renderer: RendererKind | undefined): string | undefined => (renderer ? RENDERERS[renderer]?.module : undefined);
