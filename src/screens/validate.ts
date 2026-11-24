import { SUPPORTED_SCHEMA_KEYWORDS, type JsonSchema, type JsonSchemaType } from './schema';

/**
 * A small validator for the supported JSON Schema subset. The server validates every collection
 * write and tool call with it; the build uses {@link schemaProblems} to reject a schema it cannot
 * validate. Pure: the browser imports it too.
 */

export interface SchemaIssue {
  /** Dotted path of the value, empty for the root. */
  path: string;
  message: string;
}

const MAX_ISSUES = 20;
const TYPES: readonly JsonSchemaType[] = ['string', 'number', 'integer', 'boolean', 'null', 'array', 'object'];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const join = (path: string, key: string | number): string => (path ? `${path}.${key}` : String(key));

const label = (path: string): string => (path ? `\`${path}\`` : 'The value');

const typeOf = (value: unknown): JsonSchemaType | 'undefined' | 'other' => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'object') return typeof value as JsonSchemaType;
  return value === undefined ? 'undefined' : 'other';
};

const matchesType = (value: unknown, type: JsonSchemaType): boolean => {
  const actual = typeOf(value);
  return actual === type || (type === 'number' && actual === 'integer');
};

const jsonEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

const check = (schema: JsonSchema, value: unknown, path: string, issues: SchemaIssue[]): void => {
  if (issues.length >= MAX_ISSUES) return;

  if (schema.anyOf || schema.oneOf) {
    const options = (schema.anyOf ?? schema.oneOf) as JsonSchema[];
    const matching = options.filter((option) => validateValue(option, value, path).length === 0).length;
    if (matching === 0 || (schema.oneOf && matching > 1)) {
      issues.push({ path, message: `${label(path)} does not match ${schema.oneOf ? 'exactly one' : 'any'} of the allowed shapes.` });
      return;
    }
  }
  if ('const' in schema && !jsonEqual(schema.const, value)) {
    issues.push({ path, message: `${label(path)} must be ${JSON.stringify(schema.const)}.` });
    return;
  }
  if (schema.enum && !schema.enum.some((option) => jsonEqual(option, value))) {
    issues.push({ path, message: `${label(path)} must be one of ${schema.enum.map((option) => JSON.stringify(option)).join(', ')}.` });
    return;
  }
  if (schema.type) {
    const types = (Array.isArray(schema.type) ? schema.type : [schema.type]) as JsonSchemaType[];
    if (!types.some((type) => matchesType(value, type))) {
      issues.push({ path, message: `${label(path)} must be ${types.join(' or ')}, not ${typeOf(value)}.` });
      return;
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      issues.push({ path, message: `${label(path)} must have at least ${schema.minLength} characters.` });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      issues.push({ path, message: `${label(path)} must have at most ${schema.maxLength} characters.` });
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(value)) {
      issues.push({ path, message: `${label(path)} must match the pattern ${schema.pattern}.` });
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum)
      issues.push({ path, message: `${label(path)} must be at least ${schema.minimum}.` });
    if (schema.maximum !== undefined && value > schema.maximum)
      issues.push({ path, message: `${label(path)} must be at most ${schema.maximum}.` });
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      issues.push({ path, message: `${label(path)} must be greater than ${schema.exclusiveMinimum}.` });
    }
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
      issues.push({ path, message: `${label(path)} must be less than ${schema.exclusiveMaximum}.` });
    }
    if (schema.multipleOf !== undefined && Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > 1e-9) {
      issues.push({ path, message: `${label(path)} must be a multiple of ${schema.multipleOf}.` });
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      issues.push({ path, message: `${label(path)} must have at least ${schema.minItems} items.` });
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      issues.push({ path, message: `${label(path)} must have at most ${schema.maxItems} items.` });
    }
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      issues.push({ path, message: `${label(path)} must not contain duplicate items.` });
    }
    if (schema.items) value.forEach((item, index) => check(schema.items as JsonSchema, item, join(path, index), issues));
  }

  if (isObject(value)) {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      issues.push({ path, message: `${label(path)} must have at least ${schema.minProperties} properties.` });
    }
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      issues.push({ path, message: `${label(path)} must have at most ${schema.maxProperties} properties.` });
    }
    for (const key of schema.required ?? []) {
      if (value[key] === undefined) issues.push({ path: join(path, key), message: `Required property \`${join(path, key)}\` is missing.` });
    }
    const properties = schema.properties ?? {};
    for (const key of keys) {
      const child = properties[key];
      if (child) {
        check(child, value[key], join(path, key), issues);
      } else if (schema.additionalProperties === false) {
        issues.push({ path: join(path, key), message: `\`${join(path, key)}\` is not an allowed property.` });
      } else if (isObject(schema.additionalProperties)) {
        check(schema.additionalProperties, value[key], join(path, key), issues);
      }
    }
  }
};

/** The issues of a value against a schema, empty when it is valid. */
export const validateValue = (schema: JsonSchema, value: unknown, path = ''): SchemaIssue[] => {
  const issues: SchemaIssue[] = [];
  check(schema, value, path, issues);
  return issues.slice(0, MAX_ISSUES);
};

/** One sentence that lists the first issues, for an error message. */
export const describeIssues = (issues: SchemaIssue[]): string =>
  issues
    .slice(0, 3)
    .map((issue) => issue.message)
    .join(' ') + (issues.length > 3 ? ` (${issues.length - 3} more)` : '');

const NUMBER_KEYWORDS = [
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minItems',
  'maxItems',
  'minProperties',
  'maxProperties',
];

/**
 * Why a schema cannot be used, empty when it can. Rejects keywords outside the supported subset
 * (such as `$ref` or `allOf`), so a schema never validates more loosely than its author expects.
 */
export const schemaProblems = (schema: unknown, path = 'schema'): string[] => {
  if (!isObject(schema)) return [`${path} must be an object.`];
  const problems: string[] = [];
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYWORDS.includes(key)) {
      problems.push(`${path} uses "${key}", which collections do not support. Use only: ${SUPPORTED_SCHEMA_KEYWORDS.join(', ')}.`);
    }
  }
  const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  for (const type of types) {
    if (!TYPES.includes(type as JsonSchemaType)) problems.push(`${path}.type "${String(type)}" is not a JSON Schema type.`);
  }
  for (const key of NUMBER_KEYWORDS) {
    if (key in schema && typeof schema[key] !== 'number') problems.push(`${path}.${key} must be a number.`);
  }
  if ('pattern' in schema) {
    try {
      new RegExp(String(schema.pattern), 'u');
    } catch {
      problems.push(`${path}.pattern is not a valid regular expression.`);
    }
  }
  if ('required' in schema && (!Array.isArray(schema.required) || schema.required.some((key) => typeof key !== 'string'))) {
    problems.push(`${path}.required must be a list of property names.`);
  }
  if ('properties' in schema) {
    if (!isObject(schema.properties)) problems.push(`${path}.properties must be an object.`);
    else for (const [key, child] of Object.entries(schema.properties)) problems.push(...schemaProblems(child, `${path}.properties.${key}`));
  }
  if (isObject(schema.additionalProperties)) problems.push(...schemaProblems(schema.additionalProperties, `${path}.additionalProperties`));
  if ('items' in schema) problems.push(...schemaProblems(schema.items, `${path}.items`));
  for (const key of ['anyOf', 'oneOf'] as const) {
    if (key in schema) {
      if (!Array.isArray(schema[key])) problems.push(`${path}.${key} must be a list of schemas.`);
      else (schema[key] as unknown[]).forEach((option, index) => problems.push(...schemaProblems(option, `${path}.${key}.${index}`)));
    }
  }
  return problems;
};

/** Fills each missing property that has a `default`, at every level of nested objects. Set values never change. */
export const withDefaults = (schema: JsonSchema, value: unknown): unknown => {
  if (value === undefined) return 'default' in schema ? structuredClone(schema.default) : undefined;
  if (!isObject(value) || !schema.properties) return value;
  const result: Record<string, unknown> = { ...value };
  for (const [key, child] of Object.entries(schema.properties)) {
    const filled = withDefaults(child, result[key]);
    if (filled !== undefined) result[key] = filled;
  }
  return result;
};

/**
 * The smallest value a schema accepts for its required parts: `default` when given, otherwise an
 * empty string, zero, `false`, an empty list or an object with its required properties. Used to
 * create a document from a title alone.
 */
export const emptyValue = (schema: JsonSchema): unknown => {
  if ('default' in schema) return structuredClone(schema.default);
  if ('const' in schema) return schema.const;
  if (schema.enum?.length) return schema.enum[0];
  const option = schema.anyOf?.[0] ?? schema.oneOf?.[0];
  if (option) return emptyValue(option);
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return schema.minimum ?? 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'array':
      return [];
    case 'object': {
      const value: Record<string, unknown> = {};
      for (const key of schema.required ?? []) {
        const child = schema.properties?.[key];
        value[key] = child ? emptyValue(child) : null;
      }
      return value;
    }
    default:
      return null;
  }
};
