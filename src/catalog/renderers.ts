/**
 * This module has no runtime imports, so every layer can use the renderer registry.
 * Import it directly to avoid the catalog barrel dependencies, including `fs-extra`.
 */

/** Add a renderer only with its preview support. */
export type RendererKind = 'react' | 'handlebars';

/** How an implementation file is written, independent of the renderer that renders it. */
export type SourceFormat = 'csf';

/** Key in `entries` that holds an implementation file. */
export type EntryKey = 'component' | 'template' | 'story';

export type ComponentSource = { renderer: RendererKind; sourceFormat?: SourceFormat };

type RendererDefinition = {
  /** Declaration module that supplies this renderer. */
  module: string;
  /** Entry key normalization writes the implementation file to. */
  entryKey: EntryKey;
  /** Entry key an author writes, which checkout re-emits. */
  authoredEntryKey: EntryKey;
  /** Extensions identifying this renderer's source, matched case-insensitively. */
  extensions: string[];
  deprecatedFactory: string;
};

type SourceFormatDefinition = {
  /** Renderers this format applies to. The first is the one a bare source file implies. */
  renderers: RendererKind[];
  entryKey: EntryKey;
  authoredEntryKey: EntryKey;
  matches: RegExp;
  deprecatedFactory: string;
};

export const RENDERERS: Record<RendererKind, RendererDefinition> = {
  react: {
    module: 'handoff-app/react',
    entryKey: 'component',
    authoredEntryKey: 'component',
    extensions: ['.tsx', '.jsx'],
    deprecatedFactory: 'defineReactComponent',
  },
  handlebars: {
    module: 'handoff-app/handlebars',
    entryKey: 'template',
    authoredEntryKey: 'template',
    extensions: ['.hbs'],
    deprecatedFactory: 'defineHandlebarsComponent',
  },
};

export const SOURCE_FORMATS: Record<SourceFormat, SourceFormatDefinition> = {
  csf: {
    renderers: ['react'],
    entryKey: 'story',
    // A `.stories.*` template is what marks a CSF item, so that is the key an author writes.
    authoredEntryKey: 'template',
    matches: /\.stories\.(jsx|tsx|js|ts)$/i,
    deprecatedFactory: 'defineCsfComponent',
  },
};

const RENDERER_KINDS = Object.keys(RENDERERS) as RendererKind[];
const SOURCE_FORMAT_KINDS = Object.keys(SOURCE_FORMATS) as SourceFormat[];

export const isRendererKind = (value: unknown): value is RendererKind => RENDERER_KINDS.includes(value as RendererKind);

export const isSourceFormat = (value: unknown): value is SourceFormat => SOURCE_FORMAT_KINDS.includes(value as SourceFormat);

/** Source formats take priority because `.stories.tsx` also matches the React `.tsx` extension. */
export const sourceForFile = (file: string | undefined): ComponentSource | undefined => {
  if (!file) return undefined;

  for (const format of SOURCE_FORMAT_KINDS) {
    const definition = SOURCE_FORMATS[format];
    if (definition.matches.test(file)) {
      return { renderer: definition.renderers[0], sourceFormat: format };
    }
  }

  const lowerCased = file.toLowerCase();
  for (const kind of RENDERER_KINDS) {
    if (RENDERERS[kind].extensions.some((extension) => lowerCased.endsWith(extension))) {
      return { renderer: kind };
    }
  }

  return undefined;
};

/** Renderer a source format implies on its own, for a declaration that names only the format. */
export const sourceForFormat = (format: unknown): ComponentSource | undefined =>
  isSourceFormat(format) ? { renderer: SOURCE_FORMATS[format].renderers[0], sourceFormat: format } : undefined;

/** Entry key normalization records the implementation file under, if the renderer is registered. */
export const entryKeyFor = (renderer: RendererKind | undefined, sourceFormat?: SourceFormat): EntryKey | undefined =>
  sourceFormat ? SOURCE_FORMATS[sourceFormat]?.entryKey : renderer ? RENDERERS[renderer]?.entryKey : undefined;

/** Entry key an author writes, which is what checkout re-emits. */
export const authoredEntryKeyFor = (renderer: RendererKind | undefined, sourceFormat?: SourceFormat): EntryKey | undefined =>
  sourceFormat ? SOURCE_FORMATS[sourceFormat]?.authoredEntryKey : renderer ? RENDERERS[renderer]?.authoredEntryKey : undefined;

/** Declaration module that supplies a renderer, or undefined when it has no module of its own. */
export const moduleFor = (renderer: RendererKind | undefined): string | undefined => (renderer ? RENDERERS[renderer]?.module : undefined);

/** Deprecated factory that stamps a renderer, for a declaration the catalog API cannot express. */
export const deprecatedFactoryFor = (renderer: RendererKind | undefined, sourceFormat?: SourceFormat): string | undefined => {
  if (sourceFormat) return SOURCE_FORMATS[sourceFormat]?.deprecatedFactory;
  return renderer ? RENDERERS[renderer]?.deprecatedFactory : undefined;
};

type StatedSource = { renderer?: unknown; sourceFormat?: unknown };

/**
 * Legacy declarations use `renderer: 'csf'` for React with a CSF source.
 * Unknown renderers stay unchanged so checkout can preserve them and the build can report them.
 */
export const readRenderer = (raw: StatedSource | undefined): { renderer?: RendererKind; sourceFormat?: SourceFormat } => {
  const stated = raw?.renderer;
  if (stated === undefined || stated === null || stated === '') return {};

  if (stated === 'csf') {
    return { renderer: 'react', sourceFormat: 'csf' };
  }

  const sourceFormat = isSourceFormat(raw?.sourceFormat) ? raw?.sourceFormat : undefined;
  return { renderer: stated as RendererKind, sourceFormat };
};
