import { ComponentInstance } from '../exporters/components/types';
import { TypographyObject } from "../types";
import { TokenType } from "./types";
import { replaceTokens, slugify } from "../utils/index";
import { capitalize } from "lodash";
import { IntegrationObjectComponentOptions } from '../types/config';

/**
 * Returns normalized type name
 * @param type
 * @returns
 */
export const getTypeName = (type: TypographyObject) => type.group
  ? `${type.group}-${type.machine_name}`
  : `${type.machine_name}`;



/**
 * Generates a standardized component comment block.
 * @param type
 * @param component
 * @returns
 */
export const formatComponentCodeBlockComment = (component: ComponentInstance, format: "/**/" | "//"): string => {
  const parts = [capitalize(component.name)];

  component.variantProperties.forEach(([variantProp, val]) => {
    // @ts-ignore
    parts.push(`${variantProp.toLowerCase()}: ${val}`);
  });

  const str = parts.join(', ');

  return format === "/**/" ? `/* ${str} */` : `// ${str}`
}

/**
 * Formats the component token name for the given token type
 * @param tokenType
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
export const formatTokenName = (
  tokenType: TokenType,
  componentName: string,
  componentVariantProps: [string, string][],
  part: string,
  property: string,
  options?: IntegrationObjectComponentOptions
): string => {
  const prefix = tokenType === 'css' ? '--' : tokenType === 'scss' ? '$' : '';
  const tokenNameParts = getTokenNameSegments(componentName, componentVariantProps, part, property, options);

  return `${prefix}${tokenNameParts.join('-')}`;
};

/**
 * Returns the token name segments
 * @param component
 * @param options
 * @returns
 */
export const getTokenNameSegments = (
  componentName: string,
  componentVariantProps: [string, string][],
  part: string,
  property: string,
  options?: IntegrationObjectComponentOptions
) => {
  if (options?.tokenNameSegments) {
    return options.tokenNameSegments
      .map((tokenNamePart) => {
        const initialValue = tokenNamePart;
        tokenNamePart = replaceTokens(
          tokenNamePart,
          new Map([
            ['component', componentName],
            ['part', normalizeComponentPartName(part)],
            ['property', property],
          ]),
          (token, _, value) => (value === '' ? token : value)
        );

        tokenNamePart = replaceTokens(
          tokenNamePart,
          new Map(componentVariantProps.map(([k, v]) => [('Variant.' + k).toLowerCase(), v.toLowerCase()])),
          (_, variantProp, value) => normalizeTokenNamePartValue(variantProp.replace('variant.', ''), value, options)
        );

        // Backward compatibility (remove before 1.0 release)
        if (tokenNamePart === '') {
          tokenNamePart = replaceTokens(
            initialValue,
            new Map(componentVariantProps.map(([k, v]) => [k.toLowerCase(), v.toLowerCase()])),
            (_, variantProp, value) => normalizeTokenNamePartValue(variantProp, value, options)
          );
        }

        return tokenNamePart;
      })
      .filter((part) => part !== '');
  }

  const parts: string[] = [componentName, normalizeComponentPartName(part)];

  componentVariantProps.forEach(([variantProp, value]) => {
    parts.push(normalizeTokenNamePartValue(variantProp, value, options));
  });

  parts.push(property);

  return parts.filter((part) => part !== '');
};

/**
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the component
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the component shared options (assuming keepDefaults is set to false).
 * @param variable
 * @param value
 * @param options
 * @returns
 */
export const normalizeTokenNamePartValue = (
  variable: string,
  value?: string,
  options?: IntegrationObjectComponentOptions,
  keepDefaults: boolean = false
) => {
  const normalizedVariable = variable.toLowerCase();
  const normalizedValue = value.toLowerCase();

  const replace = options?.replace ?? {};
  const defaults = options?.defaults ?? {};

  if (normalizedVariable in (replace ?? {}) && normalizedValue && normalizedValue in (replace[normalizedVariable] ?? {})) {
    return replace[normalizedVariable][normalizedValue] ?? '';
  }

  if (!keepDefaults && normalizedVariable in (defaults ?? {}) && normalizedValue === (defaults[normalizedVariable as keyof typeof defaults] ?? '')) {
    return '';
  }

  return normalizedValue;
};

/**
 * Returns the normalized part name.
 * @param part
 * @returns
 */
const normalizeComponentPartName = (part: string) => {
  return part === '$' ? '' : part.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
}
