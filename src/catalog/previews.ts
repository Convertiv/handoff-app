import fs from 'fs-extra';
import { startCase } from 'lodash';
import type { OptionalPreviewRender } from '../transformers/preview/types';
import type { CatalogPreview } from './types';

/**
 * A declaration module exports more than previews: the item itself, the implementation it
 * re-exports, helper values. Accept only a plain object that owns `args` or `name`, so an exported
 * component or helper is never mistaken for a preview.
 *
 * `getCsfStoryEntries` does not fit here: on a CSF file every named export is a story, and on a
 * declaration file it is not.
 */
const isPreviewDeclaration = (value: unknown): boolean => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.prototype.hasOwnProperty.call(value, 'args') || Object.prototype.hasOwnProperty.call(value, 'name');
};

/** Matches an exported binding, an export list, or a CommonJS export assignment. */
const EXPORT_PATTERNS: { pattern: RegExp; list?: boolean }[] = [
  { pattern: /\bexport\s+(?:async\s+)?(?:const|let|var|function\s*\*?|class)\s+([A-Za-z_$][\w$]*)/g },
  { pattern: /\bexport\s*(?!type[\s{])\{([^}]*)\}/g, list: true },
  { pattern: /\bexports\.([A-Za-z_$][\w$]*)\s*=/g },
];

/** Reads the exported name an export-list specifier binds: `A as B` exports `B`, `A` exports `A`. */
const readExportedName = (specifier: string): string | undefined => {
  const name = specifier.trim().replace(/^type\s+/, '');
  if (!name) return undefined;
  const aliased = name.match(/^[A-Za-z_$][\w$]*\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (aliased) return aliased[1];
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : undefined;
};

/**
 * Exported names in the order the source declares them.
 *
 * The evaluated module cannot supply this order. esbuild emits its export map alphabetically, and
 * an ESM namespace object has sorted keys by specification.
 */
export const readExportOrderFromSource = (sourceCode: string): string[] => {
  const found: { index: number; name: string }[] = [];

  for (const { pattern, list } of EXPORT_PATTERNS) {
    for (const match of sourceCode.matchAll(pattern)) {
      const names = list ? match[1].split(',').map(readExportedName) : [match[1]];
      names.forEach((name, offset) => {
        if (name) found.push({ index: match.index! + offset, name });
      });
    }
  }

  const order: string[] = [];
  const seen = new Set<string>();
  for (const { name } of found.sort((a, b) => a.index - b.index)) {
    if (seen.has(name)) continue;
    seen.add(name);
    order.push(name);
  }

  return order;
};

/** Exported names in source order, or an empty list when the file cannot be read. */
export const readExportOrder = (filePath: string): string[] => {
  try {
    return readExportOrderFromSource(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
};

/**
 * Re-keys previews into the given order. A preview the order does not mention is placed after the
 * ordered ones, so an export form the parser does not recognize falls back to the evaluated order
 * rather than dropping the preview.
 */
export const orderPreviews = <T>(previews: Record<string, T>, order: string[]): Record<string, T> => {
  if (order.length === 0) return previews;

  const ranked = new Set(order.filter((name) => name in previews));
  const rest = Object.keys(previews).filter((name) => !ranked.has(name));

  return Object.fromEntries([...ranked, ...rest].map((name) => [name, previews[name]]));
};

/** Collects the named exports of a declaration module as previews, in declaration order. */
export const createCatalogPreviews = (
  moduleExports: Record<string, unknown>,
  declarationPath?: string
): Record<string, OptionalPreviewRender> => {
  const previews: Record<string, OptionalPreviewRender> = {};

  for (const [exportName, value] of Object.entries(moduleExports ?? {})) {
    if (exportName === 'default' || exportName === '__esModule') continue;
    if (!isPreviewDeclaration(value)) continue;
    if (value && typeof value === 'object' && ('values' in value || 'title' in value)) {
      throw new Error(`Preview "${exportName}" uses removed fields. Use args and name. See UPGRADE.md#catalog-items.`);
    }

    const preview = value as CatalogPreview;
    previews[exportName] = {
      title: preview.name || startCase(exportName),
      values: { ...(preview.args ?? {}) },
      url: preview.url ?? '',
      ...(preview.usage ? { usage: preview.usage } : {}),
    };
  }

  return declarationPath ? orderPreviews(previews, readExportOrder(declarationPath)) : previews;
};
