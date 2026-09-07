import path from 'path';
import {
  moduleFor,
  readRenderer,
  sourceForFile,
  type ComponentSource,
  type RendererKind,
  type SourceFormat,
} from '../../catalog/renderers';
import { ComponentListObject } from '../../transformers/preview/types';

type RawDeclaration = Record<string, any>;

type NormalizeOptions = {
  declarationPath: string;
  fallbackId: string;
  warn: (message: string) => void;
};

/**
 * Entry keys and template extensions identify the source when no renderer is specified.
 * `component` implies React regardless of extension. CSF takes priority because `.stories.tsx` also matches `.tsx`.
 */
export const inferSourceFromEntries = (
  entries?: Record<string, string | undefined>
): ComponentSource | undefined => {
  if (!entries) return undefined;

  if (entries.story) {
    return { renderer: 'react', sourceFormat: 'csf' };
  }

  const fromTemplate = sourceForFile(entries.template);
  if (fromTemplate?.sourceFormat) {
    return fromTemplate;
  }
  if (entries.component) {
    return { renderer: 'react' };
  }

  return fromTemplate;
};

/** A declared renderer takes priority over file extensions. Warn here before a mismatch fails in a renderer plugin. */
const warnOnFileMismatch = (
  stated: { renderer?: RendererKind; sourceFormat?: SourceFormat },
  entries: Record<string, string>,
  options: NormalizeOptions
): void => {
  if (!stated.renderer) return;

  const file = entries.component ?? entries.story ?? entries.template;
  const fromFile = sourceForFile(file);
  if (!fromFile || fromFile.renderer === stated.renderer) return;

  options.warn(
    `Component "${options.fallbackId}" states renderer "${stated.renderer}", but its implementation file ` +
      `"${path.relative(path.dirname(options.declarationPath), file)}" is a "${fromFile.renderer}" source, ` +
      `so the build will fail. Declare it with defineCatalogItem from "${moduleFor(fromFile.renderer)}", or ` +
      `point "implementation" at a file the renderer can read.`
  );
};

const resolveEntryPaths = (entries: Record<string, string | undefined>, declarationPath: string): Record<string, string> => {
  const declarationDir = path.dirname(declarationPath);
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(entries)) {
    if (!value) continue;
    resolved[key] = path.resolve(declarationDir, value);
  }

  return resolved;
};

const normalizePreviews = (
  previews: Record<string, any> | undefined,
  declarationPath: string,
  warn: (message: string) => void
): Record<string, any> | undefined => {
  if (!previews) return previews;
  const normalized: Record<string, any> = { ...previews };

  for (const [previewName, previewValue] of Object.entries(previews)) {
    if (!previewValue || typeof previewValue !== 'object') continue;
    const preview = { ...previewValue } as Record<string, any>;

    if (preview.args !== undefined) {
      if (preview.values !== undefined) {
        warn(
          `Preview "${previewName}" in "${declarationPath}" defines both "args" and "values". Using "args".`
        );
      }
      preview.values = preview.args;
      delete preview.args;
    }

    normalized[previewName] = preview;
  }

  return normalized;
};

const normalizeBestPracticeFields = (
  raw: RawDeclaration,
  declarationPath: string,
  warn: (message: string) => void
): RawDeclaration => {
  const normalized = { ...raw };
  const hasCamelShouldDo = normalized.shouldDo !== undefined;
  const hasSnakeShouldDo = normalized.should_do !== undefined;
  const hasCamelShouldNotDo = normalized.shouldNotDo !== undefined;
  const hasSnakeShouldNotDo = normalized.should_not_do !== undefined;

  if (hasCamelShouldDo && hasSnakeShouldDo) {
    warn(
      `"${declarationPath}" defines both "shouldDo" and "should_do". Using "shouldDo".`
    );
  }
  if (hasCamelShouldNotDo && hasSnakeShouldNotDo) {
    warn(
      `"${declarationPath}" defines both "shouldNotDo" and "should_not_do". Using "shouldNotDo".`
    );
  }

  if (hasCamelShouldDo) {
    normalized.should_do = normalized.shouldDo;
  }
  if (hasCamelShouldNotDo) {
    normalized.should_not_do = normalized.shouldNotDo;
  }
  if (!hasCamelShouldDo && hasSnakeShouldDo) {
    normalized.shouldDo = normalized.should_do;
  }
  if (!hasCamelShouldNotDo && hasSnakeShouldNotDo) {
    normalized.shouldNotDo = normalized.should_not_do;
  }

  return normalized;
};

export const normalizeComponentDeclaration = (raw: RawDeclaration, options: NormalizeOptions): ComponentListObject => {
  const normalizedRaw = normalizeBestPracticeFields(
    { ...raw },
    options.declarationPath,
    options.warn
  );
  const entries = resolveEntryPaths({ ...(normalizedRaw.entries || {}) }, options.declarationPath);

  const stated = readRenderer(normalizedRaw);
  warnOnFileMismatch(stated, entries, options);

  const inferred = inferSourceFromEntries(entries);
  const renderer = stated.renderer ?? inferred?.renderer;
  // An inferred format only applies to the renderer it was inferred for.
  const sourceFormat =
    stated.sourceFormat ?? (renderer === inferred?.renderer ? inferred?.sourceFormat : undefined);

  // Format before renderer: a CSF item is a React item, so the React branch would claim it first.
  if (sourceFormat === 'csf') {
    const storyPath = entries.story || entries.template;
    if (!storyPath) {
      throw new Error(
        `Component "${options.fallbackId}" in "${options.declarationPath}" uses format "csf" but is missing entries.story`
      );
    }
    entries.story = storyPath;
    entries.template = storyPath;
  } else if (renderer === 'react') {
    const componentPath = entries.component || entries.template;
    if (!componentPath) {
      throw new Error(
        `Component "${options.fallbackId}" in "${options.declarationPath}" uses renderer "react" but is missing entries.component`
      );
    }
    entries.component = componentPath;
    entries.template = componentPath;
  } else if (renderer === 'handlebars') {
    if (!entries.template) {
      throw new Error(
        `Component "${options.fallbackId}" in "${options.declarationPath}" uses renderer "handlebars" but is missing entries.template`
      );
    }
  }

  if (normalizedRaw.page && normalizedRaw.page.slices && !Array.isArray(normalizedRaw.page.slices)) {
    throw new Error(
      `Component "${options.fallbackId}" in "${options.declarationPath}" has invalid page.slices; expected an array.`
    );
  }

  const normalizedPreviews = normalizePreviews(normalizedRaw.previews, options.declarationPath, options.warn);
  const explicitId = typeof normalizedRaw.id === 'string' && normalizedRaw.id.trim().length > 0 ? normalizedRaw.id.trim() : undefined;

  return {
    ...(normalizedRaw as ComponentListObject),
    id: explicitId || options.fallbackId,
    title: normalizedRaw.name || normalizedRaw.title || '',
    renderer,
    sourceFormat,
    entries,
    previews: normalizedPreviews,
    // Source location of the entity (declaration directory), retained so the store can expose a
    // stable source reference for checkout/publish.
    path: path.dirname(options.declarationPath),
  };
};
