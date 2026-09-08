import { startCase } from 'lodash';
import path from 'path';
import type { ComponentListObject, PatternListObject } from '../transformers/preview/types';
import { validateCatalogItem } from './define';
import { findSiblingComponentFile, isInsideDirectory, resolvePropertySource } from './implementation';
import { createCatalogPreviews } from './previews';
import { entryKeyFor, sourceForFile, type RendererKind, type SourceFormat } from './renderers';
import type { CatalogItem, NormalizedImplementation } from './types';

type NormalizeOptions = {
  declarationPath: string;
  fallbackId: string;
  warn: (message: string) => void;
};

export type CatalogNormalizeResult = { kind: 'component'; item: ComponentListObject } | { kind: 'pattern'; item: PatternListObject };

type ResolvedImplementation = {
  renderer: RendererKind;
  sourceFormat?: SourceFormat;
  file?: string;
  exportName?: string;
};

/** Imported component values need a file path recovered from the declaration source. */
const resolveImplementation = (item: CatalogItem, options: NormalizeOptions): ResolvedImplementation => {
  const stamped = item.implementation as NormalizedImplementation;

  const source: ResolvedImplementation = { renderer: stamped.renderer, sourceFormat: stamped.format };
  if (stamped.file) {
    return { ...source, file: stamped.file };
  }

  const declarationDir = path.dirname(options.declarationPath);
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

/** Maps the authoring contract directly into the runtime read model. */
export const normalizeCatalogItem = (moduleExports: Record<string, unknown>, options: NormalizeOptions): CatalogNormalizeResult => {
  const item = moduleExports.default ?? moduleExports;
  validateCatalogItem(item);
  const { implementation, composition, __args, name, shouldDo, shouldNotDo, ...meta } = item;
  const id = typeof meta.id === 'string' && meta.id.trim() ? meta.id.trim() : options.fallbackId;
  const title = name || startCase(id);
  const directory = path.dirname(options.declarationPath);

  if (composition) {
    return {
      kind: 'pattern',
      item: {
        id,
        title,
        path: directory,
        description: meta.description,
        group: meta.group,
        tags: meta.tags,
        components: composition.map((ref) => ({
          id: ref.ref.trim(),
          preview: typeof ref.preview === 'string' ? ref.preview.trim() : undefined,
          args: ref.args ? { ...ref.args } : undefined,
        })),
      },
    };
  }

  const source = resolveImplementation(item, options);
  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(meta.entries ?? {})) {
    if (value) entries[key] = path.resolve(directory, value);
  }
  const entryKey = entryKeyFor(source.renderer, source.sourceFormat)!;
  if (!source.file) {
    throw new Error(`Catalog item "${id}" needs an implementation file. Set implementation to a file path.`);
  }
  entries[entryKey] = path.resolve(directory, source.file);
  // Existing builders consume template as the primary build input for every renderer.
  entries.template = entries[entryKey];
  const fromFile = sourceForFile(source.file);
  if (fromFile && fromFile.renderer !== source.renderer) {
    options.warn(
      `Catalog item "${id}" declares renderer "${source.renderer}", but "${source.file}" is a "${fromFile.renderer}" source. Fix implementation or its renderer module.`
    );
  }
  if (meta.page?.slices && !Array.isArray(meta.page.slices)) {
    throw new Error(`Catalog item "${id}" has invalid page.slices; expected an array.`);
  }
  return {
    kind: 'component',
    item: {
      ...meta,
      id,
      title: name || '',
      path: directory,
      should_do: shouldDo,
      should_not_do: shouldNotDo,
      renderer: source.renderer,
      sourceFormat: source.sourceFormat,
      entries,
      ...(source.exportName && source.exportName !== 'default' ? { componentExport: source.exportName } : {}),
      previews: createCatalogPreviews(moduleExports, options.declarationPath),
    } as ComponentListObject,
  };
};
