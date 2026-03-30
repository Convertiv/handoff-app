import path from 'path';
import { RendererKind } from '../../declarations/types';
import { ComponentListObject } from '../../transformers/preview/types';

type RawDeclaration = Record<string, any>;

type NormalizeOptions = {
  declarationPath: string;
  fallbackId: string;
  warn: (message: string) => void;
};

const isCsfStoryFile = (filePath?: string): boolean => {
  return !!filePath && /\.stories\.(jsx|tsx|js|ts)$/.test(filePath);
};

const isReactComponentFile = (filePath?: string): boolean => {
  return !!filePath && /\.(jsx|tsx)$/.test(filePath) && !isCsfStoryFile(filePath);
};

const isHandlebarsFile = (filePath?: string): boolean => {
  return !!filePath && /\.hbs$/.test(filePath);
};

export const inferRendererFromEntries = (entries?: Record<string, string | undefined>): RendererKind | undefined => {
  if (!entries) return undefined;

  if (entries.story || isCsfStoryFile(entries.template)) {
    return 'csf';
  }
  if (entries.component || isReactComponentFile(entries.template)) {
    return 'react';
  }
  if (isHandlebarsFile(entries.template)) {
    return 'handlebars';
  }

  return undefined;
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
          `[handoff] Preview "${previewName}" in "${declarationPath}" defines both "args" and "values". Using "args".`
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
      `[handoff] "${declarationPath}" defines both "shouldDo" and "should_do". Using "shouldDo".`
    );
  }
  if (hasCamelShouldNotDo && hasSnakeShouldNotDo) {
    warn(
      `[handoff] "${declarationPath}" defines both "shouldNotDo" and "should_not_do". Using "shouldNotDo".`
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
  const resolvedRenderer: RendererKind | undefined =
    normalizedRaw.renderer || inferRendererFromEntries(entries);

  if (resolvedRenderer === 'react') {
    const componentPath = entries.component || entries.template;
    if (!componentPath) {
      throw new Error(
        `[handoff] Component "${options.fallbackId}" in "${options.declarationPath}" uses renderer "react" but is missing entries.component`
      );
    }
    entries.component = componentPath;
    entries.template = componentPath;
  }

  if (resolvedRenderer === 'csf') {
    const storyPath = entries.story || entries.template;
    if (!storyPath) {
      throw new Error(
        `[handoff] Component "${options.fallbackId}" in "${options.declarationPath}" uses renderer "csf" but is missing entries.story`
      );
    }
    entries.story = storyPath;
    entries.template = storyPath;
  }

  if (resolvedRenderer === 'handlebars') {
    if (!entries.template) {
      throw new Error(
        `[handoff] Component "${options.fallbackId}" in "${options.declarationPath}" uses renderer "handlebars" but is missing entries.template`
      );
    }
  }

  if (normalizedRaw.page && normalizedRaw.page.slices && !Array.isArray(normalizedRaw.page.slices)) {
    throw new Error(
      `[handoff] Component "${options.fallbackId}" in "${options.declarationPath}" has invalid page.slices; expected an array.`
    );
  }

  const normalizedPreviews = normalizePreviews(normalizedRaw.previews, options.declarationPath, options.warn);
  const explicitId = typeof normalizedRaw.id === 'string' && normalizedRaw.id.trim().length > 0 ? normalizedRaw.id.trim() : undefined;

  return {
    ...(normalizedRaw as ComponentListObject),
    id: explicitId || options.fallbackId,
    title: normalizedRaw.name || normalizedRaw.title || '',
    renderer: resolvedRenderer,
    entries,
    previews: normalizedPreviews,
  };
};
