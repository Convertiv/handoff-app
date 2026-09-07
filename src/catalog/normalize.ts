import { startCase } from 'lodash';
import path from 'path';
import type { RendererKind } from '../declarations/types';
import { findSiblingComponentFile, isInsideDirectory, resolvePropertySource } from './implementation';
import { createCatalogPreviews } from './previews';
import type { CatalogItem, SourceDescriptor } from './types';

type NormalizeOptions = {
  declarationPath: string;
  fallbackId: string;
  warn: (message: string) => void;
};

export type CatalogNormalizeResult = { kind: 'component'; raw: Record<string, any> } | { kind: 'pattern'; raw: Record<string, any> };

/** Entry key each renderer reads its implementation from. */
const ENTRY_KEY_BY_RENDERER: Record<RendererKind, 'component' | 'template' | 'story'> = {
  react: 'component',
  handlebars: 'template',
  csf: 'story',
};

const isSourceDescriptor = (value: unknown): value is SourceDescriptor => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.format === 'string' && typeof candidate.file === 'string';
};

const rendererForFormat = (format: string): RendererKind | undefined =>
  format === 'csf' || format === 'react' || format === 'handlebars' ? format : undefined;

const rendererForPath = (filePath: string): RendererKind => {
  if (/\.stories\.(jsx|tsx|js|ts)$/.test(filePath)) return 'csf';
  if (/\.hbs$/.test(filePath)) return 'handlebars';
  return 'react';
};

type ImplementationSource = { renderer: RendererKind; file?: string; exportName?: string };

/**
 * Works out which renderer an item uses and which file holds its implementation.
 *
 * `implementation` accepts a value, a path string, or a source descriptor from a helper such as
 * `fromCSF`. Only the value form needs the file recovered from the source.
 */
const resolveImplementation = (item: CatalogItem, options: NormalizeOptions): ImplementationSource | undefined => {
  const implementation = item.implementation;
  const declarationDir = path.dirname(options.declarationPath);
  const explicitEntry = item.entries?.component || item.entries?.story || item.entries?.template;

  if (isSourceDescriptor(implementation)) {
    const renderer = rendererForFormat(implementation.format);
    if (!renderer) {
      options.warn(`Catalog item "${options.fallbackId}" uses unknown source format "${implementation.format}".`);
      return undefined;
    }
    return { renderer, file: implementation.file };
  }

  if (typeof implementation === 'string') {
    return { renderer: rendererForPath(implementation), file: implementation };
  }

  if (typeof implementation !== 'function' && typeof implementation !== 'object') return undefined;

  // A value was imported, so only the source text says which file it came from.
  if (explicitEntry) {
    return { renderer: 'react', file: explicitEntry };
  }

  const resolved = resolvePropertySource(options.declarationPath, 'implementation');
  if (resolved) {
    if (!isInsideDirectory(resolved.file, declarationDir)) {
      options.warn(
        `Catalog item "${options.fallbackId}" resolves its implementation to "${resolved.file}", outside "${declarationDir}". ` +
          `Previews still build, but the item cannot be published. Move the file into the item directory to publish it.`
      );
    }
    return { renderer: 'react', file: resolved.file, exportName: resolved.exportName };
  }

  const sibling = findSiblingComponentFile(declarationDir, options.declarationPath);
  if (sibling) {
    options.warn(
      `Catalog item "${options.fallbackId}" in "${options.declarationPath}" could not resolve the import behind ` +
        `"implementation". Using "${path.basename(sibling)}". Set "implementation" to the file path to be explicit.`
    );
    return { renderer: 'react', file: sibling };
  }

  options.warn(
    `Catalog item "${options.fallbackId}" in "${options.declarationPath}" could not resolve the import behind ` +
      `"implementation". Set "implementation" to the file path instead of the imported value.`
  );
  return { renderer: 'react' };
};

/** Converts catalog declarations to the raw shapes accepted by the component and pattern normalizers. */
export const normalizeCatalogItem = (moduleExports: Record<string, unknown>, options: NormalizeOptions): CatalogNormalizeResult => {
  const item = (moduleExports.default ?? moduleExports) as CatalogItem;
  const { implementation, composition, __args, ...meta } = item as Record<string, any>;

  if (Array.isArray(composition)) {
    const id = typeof meta.id === 'string' && meta.id.trim() ? meta.id.trim() : options.fallbackId;
    return {
      kind: 'pattern',
      raw: {
        ...meta,
        id,
        name: meta.name || meta.title || startCase(id),
        components: composition.map((ref: any) => ({
          id: ref?.ref ?? ref?.id,
          preview: ref?.preview,
          args: ref?.args,
        })),
      },
    };
  }

  const source = resolveImplementation(item, options);
  const entries = { ...(meta.entries ?? {}) };

  if (source?.file) {
    entries[ENTRY_KEY_BY_RENDERER[source.renderer]] = source.file;
  }

  return {
    kind: 'component',
    raw: {
      ...meta,
      renderer: source?.renderer,
      entries,
      ...(source?.exportName && source.exportName !== 'default' ? { componentExport: source.exportName } : {}),
      previews: createCatalogPreviews(moduleExports, options.declarationPath),
    },
  };
};
