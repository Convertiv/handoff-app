import { startCase } from 'lodash';
import path from 'path';
import { findSiblingComponentFile, isInsideDirectory, resolvePropertySource } from './implementation';
import { createCatalogPreviews } from './previews';
import {
  entryKeyFor,
  isRendererKind,
  isSourceFormat,
  sourceForFile,
  sourceForFormat,
  type RendererKind,
  type SourceFormat,
} from './renderers';
import type { CatalogItem, NormalizedImplementation } from './types';

type NormalizeOptions = {
  declarationPath: string;
  fallbackId: string;
  warn: (message: string) => void;
};

export type CatalogNormalizeResult = { kind: 'component'; raw: Record<string, any> } | { kind: 'pattern'; raw: Record<string, any> };

type ResolvedImplementation = {
  renderer: RendererKind;
  sourceFormat?: SourceFormat;
  file?: string;
  exportName?: string;
};

/** JSON declarations can specify a renderer, a source format, or a path whose extension identifies the source. */
const readImplementation = (implementation: unknown, options: NormalizeOptions): NormalizedImplementation | undefined => {
  if (implementation && typeof implementation === 'object') {
    const candidate = implementation as Record<string, unknown>;

    if (typeof candidate.renderer === 'string') {
      if (!isRendererKind(candidate.renderer)) {
        options.warn(
          `Catalog item "${options.fallbackId}" states renderer "${candidate.renderer}", which Handoff has no renderer for. ` +
            `The item is documented, but no previews are built for it.`
        );
      }
      if (candidate.format !== undefined && !isSourceFormat(candidate.format)) {
        options.warn(`Catalog item "${options.fallbackId}" uses unknown source format "${candidate.format}", which is ignored.`);
        return { ...(candidate as NormalizedImplementation), format: undefined };
      }
      return candidate as NormalizedImplementation;
    }

    if (typeof candidate.format === 'string' && typeof candidate.file === 'string') {
      const source = sourceForFormat(candidate.format);
      if (!source) {
        options.warn(`Catalog item "${options.fallbackId}" uses unknown source format "${candidate.format}".`);
        return undefined;
      }
      return { renderer: source.renderer, format: source.sourceFormat, file: candidate.file };
    }
  }

  if (typeof implementation === 'string') {
    const source = sourceForFile(implementation);
    if (!source) {
      options.warn(
        `Catalog item "${options.fallbackId}" cannot tell which renderer "${implementation}" belongs to. ` +
          `State it as implementation: { renderer, file }.`
      );
      return undefined;
    }
    return { renderer: source.renderer, format: source.sourceFormat, file: implementation };
  }

  return undefined;
};

/** Imported component values need a file path recovered from the declaration source. */
const resolveImplementation = (item: CatalogItem, options: NormalizeOptions): ResolvedImplementation | undefined => {
  const stamped = readImplementation(item.implementation, options);
  if (!stamped) return undefined;

  const source: ResolvedImplementation = { renderer: stamped.renderer, sourceFormat: stamped.format };
  if (stamped.file) {
    return { ...source, file: stamped.file };
  }

  const declarationDir = path.dirname(options.declarationPath);
  const explicitEntry = item.entries?.component || item.entries?.story || item.entries?.template;
  if (explicitEntry) {
    return { ...source, file: explicitEntry };
  }

  const resolved = resolvePropertySource(options.declarationPath, 'implementation');
  if (resolved) {
    if (!isInsideDirectory(resolved.file, declarationDir)) {
      options.warn(
        `Catalog item "${options.fallbackId}" resolves its implementation to "${resolved.file}", outside "${declarationDir}". ` +
          `Previews still build, but the item cannot be published. Move the file into the item directory to publish it.`
      );
    }
    return { ...source, file: resolved.file, exportName: resolved.exportName };
  }

  const sibling = findSiblingComponentFile(declarationDir, options.declarationPath);
  if (sibling) {
    options.warn(
      `Catalog item "${options.fallbackId}" in "${options.declarationPath}" could not resolve the import behind ` +
        `"implementation". Using "${path.basename(sibling)}". Set "implementation" to the file path to be explicit.`
    );
    return { ...source, file: sibling };
  }

  options.warn(
    `Catalog item "${options.fallbackId}" in "${options.declarationPath}" could not resolve the import behind ` +
      `"implementation". Set "implementation" to the file path instead of the imported value.`
  );
  return source;
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

  const entryKey = source && entryKeyFor(source.renderer, source.sourceFormat);
  if (source?.file && entryKey) {
    entries[entryKey] = source.file;
  }

  // A JSON declaration carries no named exports, so its authored previews are all it has.
  const exportedPreviews = createCatalogPreviews(moduleExports, options.declarationPath);
  const previews = Object.keys(exportedPreviews).length > 0 ? exportedPreviews : meta.previews;

  return {
    kind: 'component',
    raw: {
      ...meta,
      renderer: source?.renderer,
      sourceFormat: source?.sourceFormat,
      entries,
      ...(source?.exportName && source.exportName !== 'default' ? { componentExport: source.exportName } : {}),
      previews,
    },
  };
};
