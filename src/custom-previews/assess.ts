import { toArgsSchema, type ComponentContract, type JsonSchema } from './contract';
import {
  MAX_ARGS_BYTES,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  type CustomPreviewArgs,
  type CustomPreviewAssessment,
  type CustomPreviewIssue,
} from './types';

// Runs on every read against the current contract. Issues are warnings, because docgen types can be imprecise.
// The checker covers only the JSON Schema subset that `toArgsSchema` emits.

const MAX_ARRAY_ITEMS_CHECKED = 50;
const MAX_ISSUES = 50;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const typeOf = (value: unknown): string => (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value);

const join = (path: string, key: string | number): string => (path ? `${path}.${key}` : String(key));

const equal = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

const check = (value: unknown, schema: JsonSchema, path: string, issues: CustomPreviewIssue[]): boolean => {
  if (Array.isArray(schema.anyOf)) {
    const matches = (schema.anyOf as JsonSchema[]).some((option) => check(value, option, path, []));
    if (!matches) issues.push({ code: 'type-mismatch', path, message: `\`${path}\` does not match any allowed type.` });
    return matches;
  }
  if ('const' in schema && !equal(value, schema.const)) {
    issues.push({ code: 'type-mismatch', path, message: `\`${path}\` must be ${JSON.stringify(schema.const)}.` });
    return false;
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((option) => equal(option, value))) {
    const allowed = schema.enum.map((option) => JSON.stringify(option)).join(', ');
    issues.push({ code: 'type-mismatch', path, message: `\`${path}\` must be one of ${allowed}.` });
    return false;
  }
  const expected = schema.type as string | undefined;
  if (!expected) return true;

  const actual = typeOf(value);
  if (actual !== expected) {
    issues.push({ code: 'type-mismatch', path, message: `\`${path}\` should be ${expected}, not ${actual}.` });
    return false;
  }
  if (expected === 'array' && isPlainObject(schema.items)) {
    let valid = true;
    (value as unknown[]).slice(0, MAX_ARRAY_ITEMS_CHECKED).forEach((item, index) => {
      valid = check(item, schema.items as JsonSchema, join(path, index), issues) && valid;
    });
    return valid;
  }
  if (expected === 'object' && isPlainObject(schema.properties)) {
    return checkObject(value as Record<string, unknown>, schema, path, issues, false);
  }
  return true;
};

// Unknown keys are reported only at the top level, because nested shapes are often only partly typed.
const checkObject = (
  value: Record<string, unknown>,
  schema: JsonSchema,
  path: string,
  issues: CustomPreviewIssue[],
  reportUnknown: boolean
): boolean => {
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
  const required = (schema.required ?? []) as string[];
  let valid = true;

  for (const key of required) {
    if (!(key in value)) {
      issues.push({ code: 'missing-required', path: join(path, key), message: `Required property \`${join(path, key)}\` is missing.` });
      valid = false;
    }
  }
  for (const [key, child] of Object.entries(value)) {
    const childSchema = properties[key];
    if (!childSchema) {
      if (reportUnknown) {
        issues.push({ code: 'unknown-property', path: join(path, key), message: `\`${join(path, key)}\` is not a property of this component.` });
      }
      continue;
    }
    // `null` leaves an optional prop unset.
    if (child === null && !required.includes(key)) continue;
    valid = check(child, childSchema, join(path, key), issues) && valid;
  }
  return valid;
};

// An empty contract yields no issues: a Handlebars template with undeclared fields still renders.
export const assessArgs = (contract: ComponentContract | undefined, args: CustomPreviewArgs): CustomPreviewAssessment => {
  const schema = toArgsSchema(contract);
  const issues: CustomPreviewIssue[] = [];
  const renderArgs: CustomPreviewArgs = { ...args };

  if (Object.keys(contract ?? {}).length > 0) {
    checkObject(args, schema, '', issues, true);
    for (const [key, slot] of Object.entries(contract!)) {
      if (slot.rules?.required && !(key in renderArgs) && slot.default !== undefined && slot.default !== null) {
        renderArgs[key] = slot.default;
      }
    }
  }

  const capped = issues.slice(0, MAX_ISSUES);
  return { status: capped.length ? 'needs-attention' : 'ok', issues: capped, renderArgs };
};

export class CustomPreviewInputError extends Error {}

export const parseArgs = (value: unknown): CustomPreviewArgs => {
  if (!isPlainObject(value)) {
    throw new CustomPreviewInputError('`args` must be a JSON object.');
  }
  const size = new TextEncoder().encode(JSON.stringify(value)).length;
  if (size > MAX_ARGS_BYTES) {
    throw new CustomPreviewInputError(`\`args\` is ${size} bytes; the limit is ${MAX_ARGS_BYTES}.`);
  }
  return value;
};

export const parseTitle = (value: unknown): string => {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title) throw new CustomPreviewInputError('`title` is required.');
  if (title.length > MAX_TITLE_LENGTH) throw new CustomPreviewInputError(`\`title\` is longer than ${MAX_TITLE_LENGTH} characters.`);
  return title;
};

export const parseDescription = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new CustomPreviewInputError('`description` must be a string.');
  const description = value.trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new CustomPreviewInputError(`\`description\` is longer than ${MAX_DESCRIPTION_LENGTH} characters.`);
  }
  return description || null;
};
