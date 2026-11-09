import type { TypeNode, TypeNodeProperty } from 'handoff-docgen';
import type { SlotMetadata } from '../transformers/preview/component';

// Type-only imports: the browser editor imports this module. Slot types compare as strings because `SlotType` pulls in the build.

export type ComponentContract = { [key: string]: SlotMetadata };

export type JsonSchema = Record<string, unknown>;

const stripQuotes = (value: string): string => value.replace(/^["']|["']$/g, '');

export const literalValue = (display: string): unknown => {
  const text = display.trim();
  if (/^'.*'$/.test(text)) return text.slice(1, -1);
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

export const literalNodeValue = (node: TypeNode): unknown => {
  if (node.kind === 'literal') return literalValue(node.display);
  // Docgen reports a union's literal members as primitives.
  if (node.kind === 'primitive' && /^(["'].*["']|true|false|-?\d+(\.\d+)?)$/.test(node.display.trim())) return literalValue(node.display);
  return undefined;
};

export const isTemplateLiteral = (node: TypeNode): boolean => node.kind === 'primitive' && node.display.trim().startsWith('`');

/** `undefined` unless every member of the intersection is an object. */
export const intersectionProperties = (node: TypeNode): TypeNodeProperty[] | undefined => {
  const merged = new Map<string, TypeNodeProperty>();
  for (const member of node.children ?? []) {
    const properties =
      member.kind === 'object' ? member.properties : member.kind === 'intersection' ? intersectionProperties(member) : undefined;
    if (!properties) return undefined;
    for (const property of properties) {
      const existing = merged.get(property.name);
      merged.set(property.name, existing ? { ...existing, optional: existing.optional && property.optional } : property);
    }
  }
  return merged.size ? [...merged.values()] : undefined;
};

const objectNodeSchema = (properties: TypeNodeProperty[]): JsonSchema => ({
  type: 'object',
  properties: Object.fromEntries(properties.map((property) => [property.name, typeNodeSchema(property.type)])),
  required: properties.filter((property) => !property.optional).map((property) => property.name),
});

const typeNodeSchema = (node: TypeNode): JsonSchema => {
  switch (node.kind) {
    case 'primitive': {
      if (node.display === 'string' || node.display === 'number' || node.display === 'boolean') return { type: node.display };
      if (node.display === 'null') return { type: 'null' };
      if (isTemplateLiteral(node)) return { type: 'string' };
      const value = literalNodeValue(node);
      return value === undefined ? {} : { const: value };
    }
    case 'literal': {
      const value = literalNodeValue(node);
      return value === undefined ? {} : { const: value };
    }
    case 'enum':
      return node.members?.length ? { enum: node.members.map((member) => literalValue(member) ?? stripQuotes(member)) } : {};
    case 'union': {
      const options = (node.children ?? []).filter((child) => child.display !== 'undefined').map(typeNodeSchema);
      if (options.some((option) => Object.keys(option).length === 0)) return {};
      if (options.every((option) => 'const' in option)) return { enum: options.map((option) => option.const) };
      return options.length === 1 ? options[0] : { anyOf: options };
    }
    case 'array':
      return { type: 'array', ...(node.elementType ? { items: typeNodeSchema(node.elementType) } : {}) };
    case 'object':
      return objectNodeSchema(node.properties ?? []);
    case 'intersection': {
      const properties = intersectionProperties(node);
      return properties ? objectNodeSchema(properties) : {};
    }
    // Value types are not checked: the checker has no `additionalProperties`.
    case 'record':
      return { type: 'object' };
    default:
      return {};
  }
};

const slotSchema = (slot: SlotMetadata): JsonSchema => {
  const described = (schema: JsonSchema): JsonSchema => ({
    ...schema,
    ...(slot.description ? { description: slot.description } : {}),
    ...(slot.default !== undefined && slot.default !== null ? { default: slot.default } : {}),
  });

  if (slot.deepType) return described(typeNodeSchema(slot.deepType));

  switch (slot.type as string) {
    case 'number':
      return described({ type: 'number' });
    case 'boolean':
      return described({ type: 'boolean' });
    case 'array':
      return described({
        type: 'array',
        ...(slot.items?.properties ? { items: objectSchema(slot.items.properties) } : {}),
      });
    case 'object':
      return described(slot.properties ? objectSchema(slot.properties) : { type: 'object' });
    default:
      // `text` is also the fallback for unmapped types, so it does not mean "string".
      return described({});
  }
};

const objectSchema = (contract: ComponentContract): JsonSchema => {
  const entries = Object.entries(contract);
  return {
    type: 'object',
    properties: Object.fromEntries(entries.map(([key, slot]) => [key, slotSchema(slot)])),
    required: entries.filter(([, slot]) => slot.rules?.required).map(([key]) => key),
  };
};

export const toArgsSchema = (contract: ComponentContract | undefined): JsonSchema => objectSchema(contract ?? {});

const contractShape = (contract: ComponentContract | undefined): unknown =>
  Object.keys(contract ?? {})
    .sort()
    .map((key) => {
      const slot = contract![key];
      return [
        key,
        slot.type,
        slot.docgenType ?? null,
        slot.rules?.required ?? false,
        slot.default ?? null,
        slot.deepType?.members ?? null,
        contractShape(slot.properties ?? slot.items?.properties),
      ];
    });

// FNV-1a: it only detects change and must also run in the browser.
export const contractFingerprint = (contract: ComponentContract | undefined): string => {
  const text = JSON.stringify(contractShape(contract));
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};
