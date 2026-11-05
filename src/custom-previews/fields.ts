import type { TypeNode, TypeNodeProperty } from 'handoff-docgen';
import type { SlotMetadata } from '../transformers/preview/component';
import { literalNodeValue, literalValue, type ComponentContract } from './contract';

// Type-only imports, like `contract.ts`: the browser form editor imports this module.

export type FieldKind = 'text' | 'number' | 'boolean' | 'enum' | 'object' | 'array' | 'image' | 'button' | 'function' | 'json';

export type Field =
  | { kind: 'text' | 'number' | 'boolean' | 'json' }
  | { kind: 'enum'; options: unknown[] }
  | { kind: 'object' | 'image' | 'button'; fields: FieldEntry[] }
  | { kind: 'array'; item: Field }
  | { kind: 'function'; signature: string };

export type FieldEntry = {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  field: Field;
};

/** Keys from the args root. A number is an array index. */
export type FieldPath = (string | number)[];

const TEXT: Field = { kind: 'text' };
const JSON_FIELD: Field = { kind: 'json' };

const DECLARED_TYPES = new Set(['image', 'button', 'function', 'enum', 'boolean', 'number', 'array', 'object']);

const SHAPE_KEYS = { image: ['src', 'alt'], button: ['label', 'url'] } as const;

type Shape = 'image' | 'button';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// The CSF shape rule from `inferSlotType()`, applied to a default value and to a docgen object type alike.
const shapeOfKeys = (isString: (key: string) => boolean): Shape | null => {
  if (isString('src') && isString('alt')) return 'image';
  if ((isString('label') || isString('text')) && (isString('url') || isString('href'))) return 'button';
  return null;
};

const shapeOfValue = (value: unknown): Shape | null => (isPlainObject(value) ? shapeOfKeys((key) => typeof value[key] === 'string') : null);

const shapeOfNode = (node: TypeNode): Shape | null =>
  shapeOfKeys(
    (key) => node.properties?.some((property) => property.name === key && resolveTypeNode(property.type).kind === 'text') ?? false
  );

const literalField = (values: unknown[]): Field => {
  const options = values.filter((value, index) => values.findIndex((other) => JSON.stringify(other) === JSON.stringify(value)) === index);
  if (options.length === 2 && options.includes(true) && options.includes(false)) return { kind: 'boolean' };
  return { kind: 'enum', options };
};

const isReactNode = (node: TypeNode): boolean => node.display === 'ReactNode' || node.display.startsWith('ReactElement');

const nodeFields = (properties: TypeNodeProperty[]): FieldEntry[] =>
  properties.flatMap((property) => {
    if (property.name.startsWith('__@')) return [];
    const field = resolveTypeNode(property.type);
    if (field.kind === 'function') return [];
    return [
      { key: property.name, label: property.name, description: property.description || undefined, required: !property.optional, field },
    ];
  });

/** Resolves a docgen type to a field. Types the form cannot edit safely fall back to a JSON box. */
export const resolveTypeNode = (node: TypeNode): Field => {
  switch (node.kind) {
    case 'union': {
      const members = (node.children ?? []).filter((child) => child.display !== 'undefined' && child.display !== 'null');
      // ReactNode expands to about ten members; a string is the useful value for a preview.
      if (isReactNode(node) || members.some(isReactNode)) return TEXT;
      if (members.length === 1) return resolveTypeNode(members[0]);
      const literals = members.map(literalNodeValue);
      if (members.length > 0 && literals.every((value) => value !== undefined)) return literalField(literals);
      return JSON_FIELD;
    }
    case 'primitive': {
      if (node.display === 'string') return TEXT;
      if (node.display === 'number') return { kind: 'number' };
      if (node.display === 'boolean') return { kind: 'boolean' };
      const value = literalNodeValue(node);
      return value === undefined ? JSON_FIELD : literalField([value]);
    }
    case 'literal': {
      const value = literalNodeValue(node);
      return value === undefined ? JSON_FIELD : literalField([value]);
    }
    case 'enum':
      return node.members?.length ? literalField(node.members.map((member) => literalValue(member) ?? member)) : JSON_FIELD;
    case 'array':
      return { kind: 'array', item: node.elementType ? resolveTypeNode(node.elementType) : JSON_FIELD };
    case 'object': {
      const fields = nodeFields(node.properties ?? []);
      return fields.length ? { kind: shapeOfNode(node) ?? 'object', fields } : JSON_FIELD;
    }
    case 'function':
      return { kind: 'function', signature: node.display };
    default:
      return JSON_FIELD;
  }
};

const valueField = (value: unknown): Field => {
  if (typeof value === 'string') return TEXT;
  if (typeof value === 'number') return { kind: 'number' };
  if (typeof value === 'boolean') return { kind: 'boolean' };
  if (Array.isArray(value)) return { kind: 'array', item: value.length ? valueField(value[0]) : TEXT };
  if (isPlainObject(value)) {
    const fields = valueFields(value);
    return fields.length ? { kind: shapeOfValue(value) ?? 'object', fields } : JSON_FIELD;
  }
  return JSON_FIELD;
};

const valueFields = (value: Record<string, unknown>): FieldEntry[] =>
  Object.entries(value).map(([key, child]) => ({ key, label: key, required: false, field: valueField(child) }));

const slotFields = (properties: Record<string, SlotMetadata> | undefined): FieldEntry[] =>
  Object.entries(properties ?? {}).flatMap(([key, slot]) => {
    // A malformed descriptor costs its own row, never the form.
    if (!isPlainObject(slot)) return [];
    return [
      {
        key,
        label: slot.name || key,
        description: slot.description || undefined,
        required: Boolean(slot.rules?.required),
        field: resolveField(slot),
      },
    ];
  });

const deepArrayNode = (node: TypeNode | undefined): TypeNode | undefined => {
  if (!node) return undefined;
  if (node.kind === 'array') return node;
  if (node.kind !== 'union') return undefined;
  const members = (node.children ?? []).filter((child) => child.display !== 'undefined' && child.display !== 'null');
  return members.length === 1 ? deepArrayNode(members[0]) : undefined;
};

const resolveArrayItem = (slot: SlotMetadata): Field => {
  const items = slot.items;
  const itemType = items?.type as string | undefined;
  if (items?.properties && Object.keys(items.properties).length > 0) {
    return { kind: itemType === 'image' || itemType === 'button' ? itemType : 'object', fields: slotFields(items.properties) };
  }
  const arrayNode = deepArrayNode(slot.deepType);
  if (arrayNode?.elementType) return resolveTypeNode(arrayNode.elementType);
  const first = Array.isArray(slot.default) ? slot.default[0] : undefined;
  if (itemType && itemType !== 'array') {
    return resolveField({ name: '', description: '', generic: '', type: items!.type, default: first });
  }
  return first === undefined ? TEXT : valueField(first);
};

const resolveCompound = (type: 'object' | 'image' | 'button', slot: SlotMetadata): Field => {
  const deepObject = slot.deepType ? resolveTypeNode(slot.deepType) : undefined;
  const fromDeep = deepObject && 'fields' in deepObject ? deepObject : undefined;
  const fields = slotFields(slot.properties);
  const shape = type === 'object' ? (fromDeep && fromDeep.kind !== 'object' ? fromDeep.kind : shapeOfValue(slot.default)) : type;
  const kind = shape ?? 'object';

  if (fields.length) return { kind, fields };
  if (fromDeep) return { kind, fields: fromDeep.fields };
  if (isPlainObject(slot.default) && Object.keys(slot.default).length) return { kind, fields: valueFields(slot.default) };
  if (kind === 'object') return JSON_FIELD;
  return { kind, fields: SHAPE_KEYS[kind].map((key) => ({ key, label: key, required: false, field: TEXT })) };
};

/**
 * Maps one contract entry to the control the form draws. A declared non-`text` type wins; `text`, `any`
 * or no type resolve from `deepType`, because docgen reports most React props as `text`.
 */
export const resolveField = (slot: SlotMetadata): Field => {
  const type = slot.type as string | undefined;
  if (type && DECLARED_TYPES.has(type)) {
    switch (type) {
      case 'boolean':
      case 'number':
        return { kind: type };
      case 'function':
        return { kind: 'function', signature: slot.generic || slot.deepType?.display || 'function' };
      case 'enum': {
        const resolved = slot.deepType ? resolveTypeNode(slot.deepType) : undefined;
        // A Storybook select control does not carry its options into the contract.
        return resolved?.kind === 'enum' ? resolved : TEXT;
      }
      case 'array':
        return { kind: 'array', item: resolveArrayItem(slot) };
      default:
        return resolveCompound(type as 'object' | 'image' | 'button', slot);
    }
  }
  if (slot.deepType) {
    const resolved = resolveTypeNode(slot.deepType);
    if (resolved.kind !== 'object') return resolved;
    const shape = shapeOfValue(slot.default);
    return shape ? { ...resolved, kind: shape } : resolved;
  }
  return type === 'any' ? JSON_FIELD : TEXT;
};

/** The form rows for a component contract, in contract order. */
export const contractFields = (contract: ComponentContract | undefined): FieldEntry[] => slotFields(contract);

/** Matches `CustomPreviewIssue.path`. */
export const pathKey = (path: FieldPath): string => path.join('.');

export const getAt = (value: unknown, path: FieldPath): unknown => {
  let current = value;
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
};

/** Returns a copy with `next` at `path`. A non-object node in the way becomes `{}`, or `[]` before an index. */
export const setAt = (value: unknown, path: FieldPath, next: unknown): unknown => {
  if (path.length === 0) return next;
  const [key, ...rest] = path;
  const container = (Array.isArray(value) ? [...value] : isPlainObject(value) ? { ...value } : typeof key === 'number' ? [] : {}) as Record<
    string | number,
    unknown
  >;
  container[key] = setAt(container[key], rest, next);
  return container;
};

/** Returns a copy without the key at `path`. An index removes the array item. A missing path returns `value`. */
export const unsetAt = (value: unknown, path: FieldPath): unknown => {
  if (path.length === 0) return undefined;
  const [key, ...rest] = path;
  if (Array.isArray(value)) {
    const index = Number(key);
    if (!(index in value)) return value;
    if (rest.length) return value.map((item, i) => (i === index ? unsetAt(item, rest) : item));
    return value.filter((_, i) => i !== index);
  }
  if (!isPlainObject(value) || !(key in value)) return value;
  const copy = { ...value };
  if (rest.length) copy[key] = unsetAt(copy[key], rest);
  else delete copy[key];
  return copy;
};

/** The path of every row the form draws for `args`, so a caller can tell which issues have no row. */
export const fieldPaths = (entries: FieldEntry[], args: unknown, prefix: FieldPath = []): FieldPath[] =>
  entries.flatMap((entry) => {
    const path = [...prefix, entry.key];
    return [path, ...childPaths(entry.field, args, path)];
  });

const childPaths = (field: Field, args: unknown, path: FieldPath): FieldPath[] => {
  if ('fields' in field) return fieldPaths(field.fields, args, path);
  if (field.kind !== 'array') return [];
  return toArrayItems(getAt(args, path)).flatMap((_, index) => {
    const itemPath = [...path, index];
    return [itemPath, ...childPaths(field.item, args, itemPath)];
  });
};

/** One value becomes a one-item list, and an empty value an empty list. */
export const toArrayItems = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
};

/** The value a new array item starts with. */
export const emptyFieldValue = (field: Field): unknown => {
  switch (field.kind) {
    case 'text':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'enum':
      return field.options[0] ?? null;
    case 'object':
    case 'image':
    case 'button':
      return {};
    case 'array':
      return [];
    default:
      return null;
  }
};
