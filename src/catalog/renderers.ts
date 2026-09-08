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
  /** Extensions identifying this renderer's source, matched case-insensitively. */
  extensions: string[];
};

type SourceFormatDefinition = {
  /** Renderers this format applies to. Also used to diagnose file mismatches. */
  renderers: RendererKind[];
  entryKey: EntryKey;
  matches: RegExp;
};

export const RENDERERS: Record<RendererKind, RendererDefinition> = {
  react: {
    module: 'handoff-app/react',
    entryKey: 'component',
    extensions: ['.tsx', '.jsx'],
  },
  handlebars: {
    module: 'handoff-app/handlebars',
    entryKey: 'template',
    extensions: ['.hbs'],
  },
};

export const SOURCE_FORMATS: Record<SourceFormat, SourceFormatDefinition> = {
  csf: {
    renderers: ['react'],
    entryKey: 'story',
    matches: /\.stories\.(jsx|tsx|js|ts)$/i,
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

/** Entry key normalization records the implementation file under, if the renderer is registered. */
export const entryKeyFor = (renderer: RendererKind | undefined, sourceFormat?: SourceFormat): EntryKey | undefined =>
  sourceFormat ? SOURCE_FORMATS[sourceFormat]?.entryKey : renderer ? RENDERERS[renderer]?.entryKey : undefined;

/** Declaration module that supplies a renderer, or undefined when it has no module of its own. */
export const moduleFor = (renderer: RendererKind | undefined): string | undefined => (renderer ? RENDERERS[renderer]?.module : undefined);
