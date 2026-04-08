import path from 'path';
import { SlotMetadata, SlotType } from '../preview/component';

const CHILDREN_PROP = 'children';
const INDENT = '  ';

function isValidIdentifier(key: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}

/**
 * Formats a prop value as a JSX attribute string.
 * Returns the right-hand side only (e.g. `"hello"`, `{42}`, `{true}`).
 */
function formatPropValue(value: unknown, type: SlotType): string {
  if (value === undefined || value === null) {
    return '{undefined}';
  }

  switch (type) {
    case SlotType.BOOLEAN:
      return typeof value === 'boolean' ? `{${value}}` : `{${Boolean(value)}}`;

    case SlotType.NUMBER:
      return `{${Number(value)}}`;

    case SlotType.FUNCTION:
      return '{() => { /* handler */ }}';

    case SlotType.OBJECT:
      return `{${formatObjectLiteral(value)}}`;

    case SlotType.ARRAY:
      return `{${formatArrayLiteral(value)}}`;

    case SlotType.TEXT:
    case SlotType.IMAGE:
    case SlotType.BUTTON:
    case SlotType.ENUM:
    default:
      if (typeof value === 'string') {
        return `"${escapeJsxString(value)}"`;
      }
      if (typeof value === 'boolean') {
        return `{${value}}`;
      }
      if (typeof value === 'number') {
        return `{${value}}`;
      }
      if (typeof value === 'object') {
        return `{${JSON.stringify(value, null, 2)}}`;
      }
      return `"${escapeJsxString(String(value))}"`;
  }
}

function escapeJsxString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatObjectLiteral(value: unknown): string {
  if (typeof value !== 'object' || value === null) {
    return JSON.stringify(value);
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return '{}';
  if (entries.length <= 3) {
    const inline = entries.map(([k, v]) => `${isValidIdentifier(k) ? k : JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ');
    if (inline.length <= 60) return `{ ${inline} }`;
  }
  return JSON.stringify(value, null, 2);
}

function formatArrayLiteral(value: unknown): string {
  if (!Array.isArray(value)) return JSON.stringify(value);
  if (value.length === 0) return '[]';
  const inline = JSON.stringify(value);
  if (inline.length <= 60) return inline;
  return JSON.stringify(value, null, 2);
}

/**
 * Determines whether a prop value matches its declared default and can be omitted.
 */
function matchesDefault(value: unknown, slotDefault: unknown): boolean {
  if (slotDefault === undefined || slotDefault === null) return false;
  if (typeof value === typeof slotDefault && value === slotDefault) return true;

  // SlotMetadata.default is typed as `string | undefined`, but runtime values
  // may be numbers or booleans. Do a loose string comparison as a fallback.
  if (String(value) === String(slotDefault)) return true;

  return false;
}

/**
 * Extracts the PascalCase component name from a file path.
 * e.g. `/path/to/Button.tsx` -> `Button`
 */
export function extractComponentName(filePath: string): string {
  const basename = path.basename(filePath);
  const ext = path.extname(basename);
  return basename.slice(0, basename.length - ext.length);
}

export interface GenerateUsageSnippetOptions {
  componentName: string;
  properties: Record<string, SlotMetadata>;
  previewValues: Record<string, any>;
  /** Template filename for the import path (e.g. "Button.tsx") */
  templateFileName?: string;
  importStatement?: string;
}

/**
 * Generates a JSX usage snippet showing how to consume a React component
 * with the given preview values.
 *
 * Iterates over the union of preview values and schema properties so that
 * props not present in the preview are still represented when they carry
 * a meaningful default or are required.
 */
export function generateUsageSnippet(options: GenerateUsageSnippetOptions): string {
  const { componentName, properties, previewValues, templateFileName, importStatement } = options;

  const importPath = `./${templateFileName ? path.basename(templateFileName, path.extname(templateFileName)) : componentName}`;

  const attrs: string[] = [];
  let childrenValue: unknown = undefined;
  let hasChildren = false;

  // Merge all known prop keys: preview values first (preserve order), then
  // any additional keys from the property schema that weren't in the preview.
  const allKeys = new Set([...Object.keys(previewValues), ...Object.keys(properties)]);

  for (const key of Array.from(allKeys)) {
    const slot = properties[key];
    const inPreview = key in previewValues;
    const value = inPreview ? previewValues[key] : resolveSchemaValue(slot);

    // Nothing to show for this prop
    if (value === undefined || value === null) {
      continue;
    }

    if (key === CHILDREN_PROP) {
      hasChildren = true;
      childrenValue = value;
      continue;
    }

    // Skip function props that weren't explicitly provided in preview values
    if (!inPreview && slot?.type === SlotType.FUNCTION) {
      continue;
    }

    // Omit props that match their declared default
    if (slot && matchesDefault(value, slot.default)) {
      continue;
    }

    const type = slot?.type ?? inferSlotType(value);

    // Boolean true → JSX shorthand: <Comp disabled />
    if (type === SlotType.BOOLEAN && value === true) {
      attrs.push(key);
      continue;
    }

    // Boolean false → omit (implicit JSX default)
    if (type === SlotType.BOOLEAN && value === false) {
      continue;
    }

    attrs.push(`${key}=${formatPropValue(value, type)}`);
  }

  const lines: string[] = [];

  lines.push(importStatement || `import ${componentName} from '${importPath}';`);
  lines.push('');

  if (hasChildren && childrenValue !== undefined && childrenValue !== null && childrenValue !== '') {
    const openTag = attrs.length > 0 ? `<${componentName} ${attrs.join(' ')}>` : `<${componentName}>`;
    const childStr =
      typeof childrenValue === 'string'
        ? childrenValue
        : typeof childrenValue === 'number' || typeof childrenValue === 'boolean'
          ? String(childrenValue)
          : '{/* children */}';

    if (childStr.length <= 40 && !childStr.includes('\n')) {
      lines.push(`${openTag}${childStr}</${componentName}>`);
    } else {
      lines.push(openTag);
      for (const childLine of childStr.split('\n')) {
        lines.push(`${INDENT}${childLine}`);
      }
      lines.push(`</${componentName}>`);
    }
  } else {
    if (attrs.length === 0) {
      lines.push(`<${componentName} />`);
    } else if (attrs.length <= 3 && attrs.join(' ').length <= 60) {
      lines.push(`<${componentName} ${attrs.join(' ')} />`);
    } else {
      lines.push(`<${componentName}`);
      for (const attr of attrs) {
        lines.push(`${INDENT}${attr}`);
      }
      lines.push('/>');
    }
  }

  return lines.join('\n');
}

/**
 * Resolves a display value for a schema-only property (not present in preview values).
 *
 * - Uses the declared default when available and non-trivial.
 * - For required props without a default, generates a type-appropriate placeholder.
 * - Returns `undefined` for optional props with no useful default (they are skipped).
 */
function resolveSchemaValue(slot: SlotMetadata | undefined): unknown {
  if (!slot) return undefined;

  // Use explicit default if it's non-trivial
  if (slot.default !== undefined && slot.default !== null && slot.default !== '') {
    return coerceDefault(slot.default, slot.type);
  }

  // Required props must appear even without a default
  if (slot.rules?.required) {
    return getPlaceholder(slot);
  }

  // Optional with no default → omit
  return undefined;
}

/**
 * Coerces a string default from SlotMetadata into the appropriate JS type
 * for code-generation purposes.
 */
function coerceDefault(value: unknown, type: SlotType): unknown {
  if (typeof value !== 'string') return value;

  switch (type) {
    case SlotType.BOOLEAN:
      return value === 'true';
    case SlotType.NUMBER: {
      const n = Number(value);
      return Number.isNaN(n) ? value : n;
    }
    default:
      return value;
  }
}

/**
 * Generates a type-appropriate placeholder value for required props
 * that have no default and no preview value.
 */
function getPlaceholder(slot: SlotMetadata): unknown {
  switch (slot.type) {
    case SlotType.ENUM: {
      const member = extractFirstEnumMember(slot);
      return member ?? 'value';
    }
    case SlotType.TEXT:
    case SlotType.IMAGE:
      return '...';
    case SlotType.NUMBER:
      return 0;
    case SlotType.BOOLEAN:
      return true;
    case SlotType.ARRAY:
      return [];
    case SlotType.OBJECT:
      return {};
    case SlotType.FUNCTION:
      return undefined; // handled separately
    default:
      return '...';
  }
}

/**
 * Attempts to extract the first enum member from a SlotMetadata's deepType
 * (e.g. `"primary"` from `'primary' | 'secondary' | 'danger'`).
 */
function extractFirstEnumMember(slot: SlotMetadata): string | undefined {
  // deepType.members contains the enum values when available
  if (slot.deepType?.kind === 'enum' && slot.deepType.members?.length) {
    const raw = slot.deepType.members[0];
    // Members are stored as quoted strings like `"primary"` — strip quotes
    return typeof raw === 'string' ? raw.replace(/^["']|["']$/g, '') : undefined;
  }

  // Fall back to parsing the generic display string (e.g. `"primary" | "secondary"`)
  if (slot.generic) {
    const match = slot.generic.match(/["']([^"']+)["']/);
    if (match) return match[1];
  }

  return undefined;
}

function inferSlotType(value: unknown): SlotType {
  if (typeof value === 'boolean') return SlotType.BOOLEAN;
  if (typeof value === 'number') return SlotType.NUMBER;
  if (typeof value === 'function') return SlotType.FUNCTION;
  if (Array.isArray(value)) return SlotType.ARRAY;
  if (typeof value === 'object' && value !== null) return SlotType.OBJECT;
  return SlotType.TEXT;
}
