import type { TypeNode } from 'handoff-docgen';
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

const typeNodeSchema = (node: TypeNode): JsonSchema => {
  switch (node.kind) {
    case 'primitive': {
      if (node.display === 'string' || node.display === 'number' || node.display === 'boolean') return { type: node.display };
      if (node.display === 'null') return { type: 'null' };
      // Docgen reports a union's literal members as primitives.
      const value = /^(["'].*["']|true|false|-?\d+(\.\d+)?)$/.test(node.display.trim()) ? literalValue(node.display) : undefined;
      return value === undefined ? {} : { const: value };
    }
    case 'literal': {
      const value = literalValue(node.display);
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
    case 'object': {
      const properties = node.properties ?? [];
      return {
        type: 'object',
        properties: Object.fromEntries(properties.map((property) => [property.name, typeNodeSchema(property.type)])),
        required: properties.filter((property) => !property.optional).map((property) => property.name),
      };
    }
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
