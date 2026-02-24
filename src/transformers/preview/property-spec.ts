/**
 * Component Property Specification
 *
 * Canonical definitions for all supported property types, their expected
 * value shapes, applicable validation rules, and TypeScript authoring types.
 */

// ── Value Shape Interfaces ──────────────────────────────────────────────

export interface ImageValue {
  src: string;
  alt: string;
  srcset?: string;
  width?: number;
  height?: number;
}

export interface LinkValue {
  label: string;
  url: string;
  target?: string;
}

export interface ButtonValue {
  label: string;
  url: string;
  variant?: string;
  icon?: string;
}

export interface VideoValue {
  src: string;
  poster?: string;
  type?: string;
}

export type SelectOption = string | { value: string; label: string };

// ── Field aliases accepted during validation ────────────────────────────

/** Maps canonical field names to accepted aliases for each semantic type. */
export const VALUE_SHAPE_ALIASES: Record<string, Record<string, string[]>> = {
  image: { src: ['src'], alt: ['alt'] },
  link: { label: ['label', 'text'], url: ['url', 'href'] },
  button: { label: ['label', 'text'], url: ['url', 'href'], variant: ['variant', 'style'] },
  video: { src: ['src'] },
};

/** Required fields for each semantic value shape. */
export const REQUIRED_VALUE_FIELDS: Record<string, string[]> = {
  image: ['src'],
  link: ['label', 'url'],
  button: ['label', 'url'],
  video: ['src'],
};

// ── Type metadata registry ──────────────────────────────────────────────

export type TypeCategory = 'primitive' | 'selection' | 'semantic' | 'structural' | 'escape';

export interface TypeSpec {
  category: TypeCategory;
  /** Fields that must be present on the SlotMetadata definition (not the value) */
  requiredMetadataFields: string[];
  /** Rule keys that are valid for this type */
  applicableRules: string[];
  /** Whether default/preview values should be validated against a value shape */
  hasValueShape: boolean;
}

/**
 * Registry mapping each SlotType string to its specification.
 * Used by the validator to determine what's valid for each type.
 */
export const TYPE_REGISTRY: Record<string, TypeSpec> = {
  text: {
    category: 'primitive',
    requiredMetadataFields: [],
    applicableRules: ['required', 'content', 'pattern'],
    hasValueShape: false,
  },
  string: {
    category: 'primitive',
    requiredMetadataFields: [],
    applicableRules: ['required', 'content', 'pattern'],
    hasValueShape: false,
  },
  richtext: {
    category: 'primitive',
    requiredMetadataFields: [],
    applicableRules: ['required', 'content'],
    hasValueShape: false,
  },
  number: {
    category: 'primitive',
    requiredMetadataFields: [],
    applicableRules: ['required'],
    hasValueShape: false,
  },
  boolean: {
    category: 'primitive',
    requiredMetadataFields: [],
    applicableRules: ['required'],
    hasValueShape: false,
  },
  color: {
    category: 'primitive',
    requiredMetadataFields: [],
    applicableRules: ['required', 'pattern'],
    hasValueShape: false,
  },
  select: {
    category: 'selection',
    requiredMetadataFields: ['options'],
    applicableRules: ['required'],
    hasValueShape: false,
  },
  enum: {
    category: 'selection',
    requiredMetadataFields: [],
    applicableRules: ['required'],
    hasValueShape: false,
  },
  image: {
    category: 'semantic',
    requiredMetadataFields: [],
    applicableRules: ['required', 'dimensions', 'filesize', 'filetype'],
    hasValueShape: true,
  },
  link: {
    category: 'semantic',
    requiredMetadataFields: [],
    applicableRules: ['required', 'pattern'],
    hasValueShape: true,
  },
  button: {
    category: 'semantic',
    requiredMetadataFields: [],
    applicableRules: ['required'],
    hasValueShape: true,
  },
  video: {
    category: 'semantic',
    requiredMetadataFields: [],
    applicableRules: ['required', 'filesize', 'filetype'],
    hasValueShape: true,
  },
  array: {
    category: 'structural',
    requiredMetadataFields: ['items'],
    applicableRules: ['required', 'minItems', 'maxItems'],
    hasValueShape: false,
  },
  object: {
    category: 'structural',
    requiredMetadataFields: [],
    applicableRules: ['required'],
    hasValueShape: false,
  },
  function: {
    category: 'escape',
    requiredMetadataFields: [],
    applicableRules: [],
    hasValueShape: false,
  },
  any: {
    category: 'escape',
    requiredMetadataFields: [],
    applicableRules: [],
    hasValueShape: false,
  },
};

// ── Discriminated Union: PropertyDefinition ─────────────────────────────
// These types provide autocomplete and type-checking when authoring
// component configs via JSDoc: /** @type {import('handoff-app').ComponentConfig} */

export interface DimensionRules {
  width?: number;
  height?: number;
  min?: { width: number; height: number };
  max?: { width: number; height: number };
  recommend?: { width: number; height: number };
}

interface BasePropertyDefinition {
  id?: string;
  name: string;
  description?: string;
}

export interface TextPropertyDef extends BasePropertyDefinition {
  type: 'text';
  default?: string;
  rules?: { required?: boolean; content?: { min: number; max: number }; pattern?: string };
}

export interface StringPropertyDef extends BasePropertyDefinition {
  type: 'string';
  default?: string;
  rules?: { required?: boolean; content?: { min: number; max: number }; pattern?: string };
}

export interface RichtextPropertyDef extends BasePropertyDefinition {
  type: 'richtext';
  default?: string;
  rules?: { required?: boolean; content?: { min: number; max: number } };
}

export interface NumberPropertyDef extends BasePropertyDefinition {
  type: 'number';
  default?: number;
  rules?: { required?: boolean };
}

export interface BooleanPropertyDef extends BasePropertyDefinition {
  type: 'boolean';
  default?: boolean;
  rules?: { required?: boolean };
}

export interface ColorPropertyDef extends BasePropertyDefinition {
  type: 'color';
  default?: string;
  rules?: { required?: boolean; pattern?: string };
}

export interface SelectPropertyDef extends BasePropertyDefinition {
  type: 'select';
  options: SelectOption[];
  default?: string;
  rules?: { required?: boolean };
}

export interface EnumPropertyDef extends BasePropertyDefinition {
  type: 'enum';
  options?: SelectOption[];
  default?: string;
  rules?: { required?: boolean };
}

export interface ImagePropertyDef extends BasePropertyDefinition {
  type: 'image';
  default?: ImageValue;
  properties?: Record<string, PropertyDefinition>;
  rules?: {
    required?: boolean;
    dimensions?: DimensionRules;
    filesize?: number;
    filetype?: string;
  };
}

export interface LinkPropertyDef extends BasePropertyDefinition {
  type: 'link';
  default?: LinkValue;
  properties?: Record<string, PropertyDefinition>;
  rules?: { required?: boolean; pattern?: string };
}

export interface ButtonPropertyDef extends BasePropertyDefinition {
  type: 'button';
  default?: ButtonValue;
  properties?: Record<string, PropertyDefinition>;
  rules?: { required?: boolean };
}

export interface VideoPropertyDef extends BasePropertyDefinition {
  type: 'video';
  default?: VideoValue;
  properties?: Record<string, PropertyDefinition>;
  rules?: { required?: boolean; filesize?: number; filetype?: string };
}

export interface ArrayPropertyDef extends BasePropertyDefinition {
  type: 'array';
  items: {
    type: string;
    name?: string;
    properties?: Record<string, PropertyDefinition>;
  };
  default?: any[];
  rules?: { required?: boolean; minItems?: number; maxItems?: number };
}

export interface ObjectPropertyDef extends BasePropertyDefinition {
  type: 'object';
  properties?: Record<string, PropertyDefinition>;
  default?: Record<string, any>;
  rules?: { required?: boolean };
}

export interface FunctionPropertyDef extends BasePropertyDefinition {
  type: 'function';
  default?: any;
  rules?: Record<string, never>;
}

export interface AnyPropertyDef extends BasePropertyDefinition {
  type: 'any';
  default?: any;
  rules?: Record<string, never>;
}

export type PropertyDefinition =
  | TextPropertyDef
  | StringPropertyDef
  | RichtextPropertyDef
  | NumberPropertyDef
  | BooleanPropertyDef
  | ColorPropertyDef
  | SelectPropertyDef
  | EnumPropertyDef
  | ImagePropertyDef
  | LinkPropertyDef
  | ButtonPropertyDef
  | VideoPropertyDef
  | ArrayPropertyDef
  | ObjectPropertyDef
  | FunctionPropertyDef
  | AnyPropertyDef;

// ── ComponentConfig ─────────────────────────────────────────────────────
// Top-level type for authoring component configs with full type safety.

export interface ComponentConfig {
  id?: string;
  version?: string;
  title: string;
  description?: string;
  image?: string;
  type?: string;
  group?: string;
  categories?: string[];
  tags?: string[];
  figma?: string;
  should_do?: string[];
  should_not_do?: string[];
  entries?: {
    js?: string;
    scss?: string;
    template?: string;
    schema?: string;
  };
  properties: Record<string, PropertyDefinition>;
  previews: Record<string, {
    title: string;
    values: Record<string, any>;
  }>;
  options?: {
    transformer?: {
      cssRootClass?: string;
      tokenNameSegments?: string[];
      defaults?: Record<string, string>;
      replace?: Record<string, Record<string, string>>;
    };
    preview?: {
      groupBy?: string;
    };
  };
  page?: {
    slices: any[];
    options?: Record<string, unknown>;
  };
}
