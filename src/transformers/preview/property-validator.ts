/**
 * Property Validation Engine
 *
 * Validates component property definitions (config-level) and preview
 * values (preview-level) against the property specification.
 */

import { SlotMetadata, SlotType, RuleObject } from './component';
import {
  TYPE_REGISTRY,
  REQUIRED_VALUE_FIELDS,
  VALUE_SHAPE_ALIASES,
  SelectOption,
} from './property-spec';

// ── Validation result types ─────────────────────────────────────────────

export interface PropertyValidationResult {
  componentId: string;
  valid: boolean;
  errors: PropertyValidationIssue[];
  warnings: PropertyValidationIssue[];
}

export interface PropertyValidationIssue {
  path: string;
  code: ValidationCode;
  message: string;
  expected?: string;
  received?: string;
}

export type ValidationCode =
  | 'UNKNOWN_TYPE'
  | 'MISSING_NAME'
  | 'MISSING_OPTIONS'
  | 'MISSING_ITEMS'
  | 'MISSING_PROPERTIES'
  | 'INVALID_DEFAULT_SHAPE'
  | 'INVALID_OPTIONS_FORMAT'
  | 'INVALID_RULE'
  | 'MISSING_REQUIRED_VALUE'
  | 'INVALID_VALUE_SHAPE'
  | 'SELECT_VALUE_NOT_IN_OPTIONS'
  | 'ARRAY_TOO_FEW'
  | 'ARRAY_TOO_MANY'
  | 'CONTENT_TOO_SHORT'
  | 'CONTENT_TOO_LONG'
  | 'EXTRA_PREVIEW_VALUE';

// ── Config-level validation ─────────────────────────────────────────────

/**
 * Validates that property definitions are well-formed.
 */
export function validatePropertyDefinitions(
  componentId: string,
  properties: Record<string, SlotMetadata>
): PropertyValidationResult {
  const errors: PropertyValidationIssue[] = [];
  const warnings: PropertyValidationIssue[] = [];

  validatePropertiesRecursive(properties, 'properties', errors, warnings);

  return { componentId, valid: errors.length === 0, errors, warnings };
}

function validatePropertiesRecursive(
  properties: Record<string, SlotMetadata>,
  basePath: string,
  errors: PropertyValidationIssue[],
  warnings: PropertyValidationIssue[]
): void {
  for (const [key, prop] of Object.entries(properties)) {
    const propPath = `${basePath}.${key}`;
    validateSingleProperty(prop, propPath, errors, warnings);
  }
}

function validateSingleProperty(
  prop: SlotMetadata,
  propPath: string,
  errors: PropertyValidationIssue[],
  warnings: PropertyValidationIssue[]
): void {
  if (!prop.name) {
    errors.push({
      path: propPath,
      code: 'MISSING_NAME',
      message: `Property is missing a "name" field`,
    });
  }

  const typeStr = typeof prop.type === 'string' ? prop.type : String(prop.type);
  const spec = TYPE_REGISTRY[typeStr];
  if (!spec) {
    errors.push({
      path: propPath,
      code: 'UNKNOWN_TYPE',
      message: `Unknown property type "${typeStr}"`,
      received: typeStr,
    });
    return;
  }

  // Check required metadata fields
  for (const field of spec.requiredMetadataFields) {
    if (!(prop as any)[field]) {
      const code = field === 'options'
        ? 'MISSING_OPTIONS'
        : field === 'items'
          ? 'MISSING_ITEMS'
          : 'MISSING_PROPERTIES';
      errors.push({
        path: propPath,
        code,
        message: `Type "${typeStr}" requires a "${field}" field`,
      });
    }
  }

  // Validate select options format
  if ((typeStr === 'select' || typeStr === 'enum') && (prop as any).options) {
    validateSelectOptions((prop as any).options, propPath, errors);
  }

  // Validate rules are applicable to the type
  if (prop.rules) {
    validateRulesForType(prop.rules, typeStr, spec.applicableRules, propPath, warnings);
  }

  // Validate default value shape for semantic types
  if (prop.default !== undefined && spec.hasValueShape) {
    validateValueShape(prop.default, typeStr, `${propPath}.default`, errors);
  }

  // Recurse into nested object properties
  if (prop.properties) {
    validatePropertiesRecursive(prop.properties, propPath, errors, warnings);
  }

  // Recurse into array item properties
  if (prop.items?.properties) {
    validatePropertiesRecursive(prop.items.properties, `${propPath}.items`, errors, warnings);
  }
}

function validateSelectOptions(
  options: SelectOption[],
  propPath: string,
  errors: PropertyValidationIssue[]
): void {
  if (!Array.isArray(options) || options.length === 0) {
    errors.push({
      path: propPath,
      code: 'INVALID_OPTIONS_FORMAT',
      message: 'Options must be a non-empty array',
    });
    return;
  }

  const hasStrings = options.some((o) => typeof o === 'string');
  const hasObjects = options.some((o) => typeof o === 'object' && o !== null);

  if (hasStrings && hasObjects) {
    errors.push({
      path: propPath,
      code: 'INVALID_OPTIONS_FORMAT',
      message: 'Options must be all strings or all {value, label} objects, not a mix',
    });
  }

  if (hasObjects) {
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (typeof opt === 'object' && opt !== null) {
        if (!('value' in opt) || !('label' in opt)) {
          errors.push({
            path: `${propPath}.options[${i}]`,
            code: 'INVALID_OPTIONS_FORMAT',
            message: 'Object options must have "value" and "label" fields',
          });
        }
      }
    }
  }
}

function validateRulesForType(
  rules: RuleObject,
  typeStr: string,
  applicableRules: string[],
  propPath: string,
  warnings: PropertyValidationIssue[]
): void {
  for (const ruleKey of Object.keys(rules)) {
    if (!applicableRules.includes(ruleKey)) {
      warnings.push({
        path: `${propPath}.rules.${ruleKey}`,
        code: 'INVALID_RULE',
        message: `Rule "${ruleKey}" is not applicable to type "${typeStr}"`,
      });
    }
  }
}

function validateValueShape(
  value: any,
  typeStr: string,
  valuePath: string,
  errors: PropertyValidationIssue[]
): void {
  if (value === null || value === undefined) return;
  if (typeof value !== 'object') return;

  const requiredFields = REQUIRED_VALUE_FIELDS[typeStr];
  if (!requiredFields) return;

  const aliases = VALUE_SHAPE_ALIASES[typeStr] || {};

  for (const field of requiredFields) {
    const fieldAliases = aliases[field] || [field];
    const hasField = fieldAliases.some((alias) => value[alias] !== undefined);
    if (!hasField) {
      errors.push({
        path: valuePath,
        code: 'INVALID_DEFAULT_SHAPE',
        message: `Value for type "${typeStr}" is missing required field "${field}"`,
        expected: requiredFields.join(', '),
        received: Object.keys(value).join(', '),
      });
    }
  }
}

// ── Preview-level validation ────────────────────────────────────────────

/**
 * Validates that preview values conform to their property definitions.
 */
export function validatePreviewValues(
  componentId: string,
  properties: Record<string, SlotMetadata>,
  previews: Record<string, { title: string; values: Record<string, any> }>
): PropertyValidationResult {
  const errors: PropertyValidationIssue[] = [];
  const warnings: PropertyValidationIssue[] = [];

  for (const [previewKey, preview] of Object.entries(previews)) {
    const previewPath = `previews.${previewKey}`;

    if (!preview.values) continue;

    // Check required properties have values
    for (const [propKey, propDef] of Object.entries(properties)) {
      if (propDef.rules?.required && preview.values[propKey] === undefined) {
        errors.push({
          path: `${previewPath}.values.${propKey}`,
          code: 'MISSING_REQUIRED_VALUE',
          message: `Required property "${propDef.name || propKey}" has no value in preview "${preview.title || previewKey}"`,
        });
      }
    }

    // Validate each value in the preview
    for (const [valueKey, value] of Object.entries(preview.values)) {
      const propDef = properties[valueKey];
      const valuePath = `${previewPath}.values.${valueKey}`;

      if (!propDef) {
        warnings.push({
          path: valuePath,
          code: 'EXTRA_PREVIEW_VALUE',
          message: `Preview value "${valueKey}" has no matching property definition`,
        });
        continue;
      }

      validatePreviewValue(value, propDef, valuePath, errors, warnings);
    }
  }

  return { componentId, valid: errors.length === 0, errors, warnings };
}

function validatePreviewValue(
  value: any,
  propDef: SlotMetadata,
  valuePath: string,
  errors: PropertyValidationIssue[],
  warnings: PropertyValidationIssue[]
): void {
  if (value === undefined || value === null) return;

  const typeStr = typeof propDef.type === 'string' ? propDef.type : String(propDef.type);
  const spec = TYPE_REGISTRY[typeStr];
  if (!spec) return;

  // Value shape validation for semantic types
  if (spec.hasValueShape && typeof value === 'object' && !Array.isArray(value)) {
    validateValueShape(value, typeStr, valuePath, errors);
  }

  // Select value must be one of the defined options
  if ((typeStr === 'select' || typeStr === 'enum') && (propDef as any).options) {
    validateSelectValue(value, (propDef as any).options, valuePath, errors);
  }

  // Content length rules for text types
  if (['text', 'string', 'richtext'].includes(typeStr) && typeof value === 'string' && propDef.rules?.content) {
    const { min, max } = propDef.rules.content;
    if (min !== undefined && value.length < min) {
      errors.push({
        path: valuePath,
        code: 'CONTENT_TOO_SHORT',
        message: `Text length ${value.length} is below minimum ${min}`,
        expected: `>= ${min}`,
        received: String(value.length),
      });
    }
    if (max !== undefined && value.length > max) {
      errors.push({
        path: valuePath,
        code: 'CONTENT_TOO_LONG',
        message: `Text length ${value.length} exceeds maximum ${max}`,
        expected: `<= ${max}`,
        received: String(value.length),
      });
    }
  }

  // Array length rules
  if (typeStr === 'array' && Array.isArray(value) && propDef.rules) {
    const { minItems, maxItems } = propDef.rules;
    if (minItems !== undefined && value.length < minItems) {
      errors.push({
        path: valuePath,
        code: 'ARRAY_TOO_FEW',
        message: `Array has ${value.length} items, minimum is ${minItems}`,
        expected: `>= ${minItems}`,
        received: String(value.length),
      });
    }
    if (maxItems !== undefined && value.length > maxItems) {
      errors.push({
        path: valuePath,
        code: 'ARRAY_TOO_MANY',
        message: `Array has ${value.length} items, maximum is ${maxItems}`,
        expected: `<= ${maxItems}`,
        received: String(value.length),
      });
    }

    // Validate each array item if items definition exists
    if (propDef.items?.properties) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item === 'object' && item !== null) {
          for (const [itemPropKey, itemPropDef] of Object.entries(propDef.items.properties)) {
            if (item[itemPropKey] !== undefined) {
              validatePreviewValue(item[itemPropKey], itemPropDef, `${valuePath}[${i}].${itemPropKey}`, errors, warnings);
            }
          }
        }
      }
    }
  }

  // Recurse into object properties
  if (typeStr === 'object' && propDef.properties && typeof value === 'object' && !Array.isArray(value)) {
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      const nestedDef = propDef.properties[nestedKey];
      if (nestedDef) {
        validatePreviewValue(nestedValue, nestedDef, `${valuePath}.${nestedKey}`, errors, warnings);
      }
    }
  }
}

function validateSelectValue(
  value: any,
  options: SelectOption[],
  valuePath: string,
  errors: PropertyValidationIssue[]
): void {
  if (typeof value !== 'string') return;

  const validValues = options.map((opt) =>
    typeof opt === 'string' ? opt : opt.value
  );

  if (!validValues.includes(value)) {
    errors.push({
      path: valuePath,
      code: 'SELECT_VALUE_NOT_IN_OPTIONS',
      message: `Value "${value}" is not one of the allowed options`,
      expected: validValues.join(', '),
      received: value,
    });
  }
}

// ── Combined validation ─────────────────────────────────────────────────

/**
 * Runs both config-level and preview-level validation on a component.
 */
export function validateComponent(
  componentId: string,
  properties: Record<string, SlotMetadata>,
  previews?: Record<string, { title: string; values: Record<string, any> }>
): PropertyValidationResult {
  const defResult = validatePropertyDefinitions(componentId, properties);

  if (previews) {
    const previewResult = validatePreviewValues(componentId, properties, previews);
    defResult.errors.push(...previewResult.errors);
    defResult.warnings.push(...previewResult.warnings);
    defResult.valid = defResult.errors.length === 0;
  }

  return defResult;
}
