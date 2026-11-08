import type { TypeNode, TypeNodeProperty } from 'handoff-docgen';
import type { SlotMetadata } from '../transformers/preview/component';
import { intersectionProperties, isTemplateLiteral, literalNodeValue, literalValue, type ComponentContract } from './contract';
import { isPlainObject, jsonEqual } from './json';

// Imports from outside `custom-previews` are type-only: the browser form editor imports this module.

export type Field =
  | { kind: 'text' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'json' }
  | { kind: 'enum'; options: unknown[] }
  | { kind: 'object'; fields: FieldEntry[] }
  | { kind: 'array'; item: Field }
  | { kind: 'function'; signature: string };

export type FieldEntry = {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  field: Field;
};

export type FieldPath = (string | number)[];

const TEXT: Field = { kind: 'text' };
const JSON_FIELD: Field = { kind: 'json' };

const DECLARED_TYPES = new Set(['image', 'button', 'function', 'enum', 'boolean', 'number', 'array', 'object']);

const SHAPE_KEYS = { image: ['src', 'alt'], button: ['label', 'url'] } as const;

const literalField = (values: unknown[]): Field => {
  const options = values.filter((value, index) => values.findIndex((other) => jsonEqual(other, value)) === index);
  if (options.length === 2 && options.includes(true) && options.includes(false)) return { kind: 'boolean' };
  return { kind: 'enum', options };
};

const unionMembers = (node: TypeNode): TypeNode[] =>
  (node.children ?? []).filter((child) => child.display !== 'undefined' && child.display !== 'null');

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

const objectField = (properties: TypeNodeProperty[]): Field => {
  const fields = nodeFields(properties);
  return fields.length ? { kind: 'object', fields } : JSON_FIELD;
};

const resolveTypeNode = (node: TypeNode): Field => {
  switch (node.kind) {
    case 'union': {
      const members = unionMembers(node);
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
      if (isTemplateLiteral(node)) return TEXT;
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
    case 'object':
      return objectField(node.properties ?? []);
    case 'intersection': {
      const properties = intersectionProperties(node);
      return properties ? objectField(properties) : JSON_FIELD;
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
    return fields.length ? { kind: 'object', fields } : JSON_FIELD;
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
  const members = unionMembers(node);
  return members.length === 1 ? deepArrayNode(members[0]) : undefined;
};

const resolveArrayItem = (slot: SlotMetadata): Field => {
  const items = slot.items;
  const itemType = items?.type as string | undefined;
  if (items?.properties && Object.keys(items.properties).length > 0) {
    return { kind: 'object', fields: slotFields(items.properties) };
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
  const fields = slotFields(slot.properties);
  if (fields.length) return { kind: 'object', fields };
  const fromDeep = slot.deepType ? resolveTypeNode(slot.deepType) : undefined;
  if (fromDeep?.kind === 'object') return fromDeep;
  if (isPlainObject(slot.default) && Object.keys(slot.default).length) return { kind: 'object', fields: valueFields(slot.default) };
  if (type === 'object') return JSON_FIELD;
  return { kind: 'object', fields: SHAPE_KEYS[type].map((key) => ({ key, label: key, required: false, field: TEXT })) };
};

/** A declared non-`text` type wins; otherwise `deepType` decides, because docgen reports most React props as `text`. */
const resolveField = (slot: SlotMetadata): Field => {
  const type = slot.type as string | undefined;
  if (type && DECLARED_TYPES.has(type)) {
    switch (type) {
      case 'boolean':
      case 'number':
        return { kind: type };
      case 'function': {
        // Docgen also types an object as `function` when one of its members is a callback.
        const resolved = slot.deepType ? resolveTypeNode(slot.deepType) : undefined;
        if (resolved && resolved.kind !== 'function' && resolved.kind !== 'json') return resolved;
        return { kind: 'function', signature: slot.generic || slot.deepType?.display || 'function' };
      }
      case 'enum': {
        const resolved = slot.deepType ? resolveTypeNode(slot.deepType) : undefined;
        // A Storybook select without `options` gives no values to choose from.
        return resolved?.kind === 'enum' ? resolved : TEXT;
      }
      case 'array':
        return { kind: 'array', item: resolveArrayItem(slot) };
      default:
        return resolveCompound(type as 'object' | 'image' | 'button', slot);
    }
  }
  if (slot.deepType) return resolveTypeNode(slot.deepType);
  return type === 'any' ? JSON_FIELD : TEXT;
};

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

/** A non-object node in the way becomes `{}`, or `[]` before an index. */
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

/** An index removes the array item. A missing path returns `value`. */
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

export const fieldPaths = (entries: FieldEntry[], args: unknown, prefix: FieldPath = []): FieldPath[] =>
  entries.flatMap((entry) => {
    const path = [...prefix, entry.key];
    return [path, ...childPaths(entry.field, args, path)];
  });

const childPaths = (field: Field, args: unknown, path: FieldPath): FieldPath[] => {
  if ('fields' in field) return fieldPaths(field.fields, args, path);
  if (field.kind !== 'array') return [];
  const items = getAt(args, path);
  if (!Array.isArray(items)) return [];
  return items.flatMap((_, index) => {
    const itemPath = [...path, index];
    return [itemPath, ...childPaths(field.item, args, itemPath)];
  });
};

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
      return {};
    case 'array':
      return [];
    default:
      return null;
  }
};
