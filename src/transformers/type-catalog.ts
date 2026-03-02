import { createHash } from 'crypto';
import type { ComponentListObject } from './preview/types';
import type { SlotMetadata } from './preview/component';

/** Usage of a named type: component id + property path (e.g. "items.label") */
export interface TypeUsage {
  componentId: string;
  propertyPath: string;
}

/** Usage of a structural shape; optional generic name when it differs across usages */
export interface ShapeUsage extends TypeUsage {
  generic?: string;
}

export interface NamedTypeEntry {
  usages: TypeUsage[];
}

export interface ShapeClusterEntry {
  /** Human-readable summary of the shape (e.g. "{ label: string; url: string }") */
  shapeSummary: string;
  usages: ShapeUsage[];
}

export interface TypeCatalog {
  namedTypes: Record<string, NamedTypeEntry>;
  shapeClusters: Record<string, ShapeClusterEntry>;
}

const PRIMITIVE_NAMES = new Set([
  'string',
  'number',
  'boolean',
  'any',
  'unknown',
  'object',
  'array',
  'function',
  'text',
  'image',
  'button',
  'enum',
]);

/**
 * Normalize a type name for inclusion in named types (skip primitives and empty).
 */
function isNamedTypeName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const n = name.trim().toLowerCase();
  return n.length > 0 && !PRIMITIVE_NAMES.has(n);
}

/**
 * Build a deterministic normalized shape from SlotMetadata for hashing.
 * Format: { t: SlotType, g: generic } for primitives;
 * for object: { t, g, p: { [sortedKey]: shape } };
 * for array: { t, g, e: elementShape }.
 */
function normalizedShape(meta: SlotMetadata): unknown {
  const t = meta.type ?? 'any';
  const g = meta.generic ?? '';

  const base: Record<string, unknown> = { t, g };

  if (meta.type === 'object' && meta.properties && Object.keys(meta.properties).length > 0) {
    const p: Record<string, unknown> = {};
    for (const key of Object.keys(meta.properties).sort()) {
      p[key] = normalizedShape(meta.properties[key]);
    }
    base.p = p;
  } else if (meta.type === 'array' && meta.items) {
    base.e = normalizedShape({
      type: meta.items.type,
      generic: (meta.items as { generic?: string }).generic ?? (meta.items.properties ? 'object' : String(meta.items.type)),
      properties: meta.items.properties,
    } as SlotMetadata);
  }

  return base;
}

/**
 * Produce a short human-readable summary of a shape (one line).
 */
function shapeSummary(meta: SlotMetadata, depth = 0): string {
  const t = meta.type ?? 'any';
  const g = meta.generic ? ` (${meta.generic})` : '';

  if (t === 'object' && meta.properties && Object.keys(meta.properties).length > 0) {
    if (depth >= 2) return `object${g}`;
    const parts = Object.keys(meta.properties)
      .sort()
      .map((k) => `${k}: ${shapeSummary(meta.properties[k], depth + 1)}`);
    return `{ ${parts.join('; ')} }`;
  }
  if (t === 'array' && meta.items) {
    const el = shapeSummary(
      {
        type: meta.items.type,
        generic: (meta.items as { generic?: string }).generic,
        properties: meta.items.properties,
      } as SlotMetadata,
      depth + 1
    );
    return `Array<${el}>`;
  }
  return `${t}${g}`;
}

function hashShape(shape: unknown): string {
  const json = JSON.stringify(shape);
  return createHash('sha256').update(json).digest('hex').slice(0, 16);
}

/**
 * Walk all properties (including nested) and collect type names + shape usages.
 */
function walkProperties(
  componentId: string,
  properties: Record<string, SlotMetadata>,
  prefix: string,
  named: Map<string, TypeUsage[]>,
  shapes: Map<string, { shapeSummary: string; usages: ShapeUsage[] }>,
  enableStructuralSimilarity: boolean
): void {
  for (const [propName, meta] of Object.entries(properties)) {
    const propertyPath = prefix ? `${prefix}.${propName}` : propName;

    if (meta.generic && isNamedTypeName(meta.generic)) {
      const list = named.get(meta.generic) ?? [];
      list.push({ componentId, propertyPath });
      named.set(meta.generic, list);
    }
    if (meta.typeRefs?.length) {
      for (const ref of meta.typeRefs) {
        if (isNamedTypeName(ref)) {
          const list = named.get(ref) ?? [];
          list.push({ componentId, propertyPath });
          named.set(ref, list);
        }
      }
    }

    if (enableStructuralSimilarity && (meta.type === 'object' || meta.type === 'array')) {
      const shape = normalizedShape(meta);
      const shapeId = hashShape(shape);
      const existing = shapes.get(shapeId);
      const summary = shapeSummary(meta);
      const usage: ShapeUsage = { componentId, propertyPath, generic: meta.generic || undefined };
      if (existing) {
        existing.usages.push(usage);
      } else {
        shapes.set(shapeId, { shapeSummary: summary, usages: [usage] });
      }
    }

    if (meta.properties && Object.keys(meta.properties).length > 0) {
      walkProperties(componentId, meta.properties, propertyPath, named, shapes, enableStructuralSimilarity);
    }
    if (meta.items?.properties && Object.keys(meta.items.properties).length > 0) {
      walkProperties(
        componentId,
        meta.items.properties,
        `${propertyPath}[]`,
        named,
        shapes,
        enableStructuralSimilarity
      );
    }
  }
}

export interface BuildTypeCatalogOptions {
  /** Enable structural similarity (shape fingerprinting). Default true. */
  enableStructuralSimilarity?: boolean;
}

/**
 * Build the type catalog from the full component list.
 * Call after component data is ready (same data as components.json).
 */
export function buildTypeCatalog(
  componentData: ComponentListObject[],
  options: BuildTypeCatalogOptions = {}
): TypeCatalog {
  const enableStructuralSimilarity = options.enableStructuralSimilarity !== false;

  const named = new Map<string, TypeUsage[]>();
  const shapes = new Map<string, { shapeSummary: string; usages: ShapeUsage[] }>();

  for (const component of componentData) {
    const props = component.properties ?? {};
    if (Object.keys(props).length === 0) continue;
    walkProperties(component.id, props, '', named, shapes, enableStructuralSimilarity);
  }

  const namedTypes: Record<string, NamedTypeEntry> = {};
  for (const [typeName, usages] of named) {
    namedTypes[typeName] = { usages };
  }

  const shapeClusters: Record<string, ShapeClusterEntry> = {};
  for (const [shapeId, entry] of shapes) {
    if (entry.usages.length > 0) {
      shapeClusters[shapeId] = { shapeSummary: entry.shapeSummary, usages: entry.usages };
    }
  }

  return { namedTypes, shapeClusters };
}
