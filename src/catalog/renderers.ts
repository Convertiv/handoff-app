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
  },
  handlebars: {
    module: 'handoff-app/handlebars',
    entryKey: 'template',
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
};

/** Longest first, so `.stories.tsx` reads as a CSF source rather than a plain React source. */
const SUFFIXES_BY_LENGTH = Object.keys(SOURCE_SUFFIXES).sort((first, second) => second.length - first.length);

const RENDERER_KINDS = Object.keys(RENDERERS) as RendererKind[];
const SOURCE_FORMAT_KINDS = Object.keys(SOURCE_FORMATS) as SourceFormat[];

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

/** Declaration module that supplies a renderer, or undefined when it has no module of its own. */
export const moduleFor = (renderer: RendererKind | undefined): string | undefined => (renderer ? RENDERERS[renderer]?.module : undefined);
