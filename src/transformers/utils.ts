import { ComponentInstance } from '../exporters/components/types';
import { ComponentDefinitionOptions, TypographyObject } from "../types";
import { TokenType } from "./types";
import { replaceTokens } from "../utils/index";
import { capitalize } from "lodash";

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
export const formatTokenName = (tokenType: TokenType, component: ComponentInstance, part: string, property: string, options?: ComponentDefinitionOptions): string => {
  const prefix = tokenType === 'css' ? '--' : tokenType === 'scss' ? '$' : '';
  const tokenNameParts = getTokenNameSegments(component, part, property, options);

  return `${prefix}${tokenNameParts.join('-')}`;
};

/**
 * Returns the token name segments
 * @param component 
 * @param options 
 * @returns 
 */
export const getTokenNameSegments = (component: ComponentInstance, part: string, property: string, options?: ComponentDefinitionOptions) => {
  if (options?.transformer.tokenNameSegments) {
    return options.transformer.tokenNameSegments
      .map((tokenNamePart) => {
        const initialValue = tokenNamePart;
        tokenNamePart = replaceTokens(
          tokenNamePart,
          new Map([
            ['Component', component.name],
            ['Part', normalizeComponentPartName(part)],
            ['Property', property],
          ]),
          (token, _, value) => (value === '' ? token : value)
        );
        
        tokenNamePart = replaceTokens(
          tokenNamePart,
          new Map(component.variantProperties.map(([k, v]) => ['Variant.' + k, v])),
          (_, variantProp, value) => normalizeTokenNamePartValue(variantProp.replace('Variant.', ''), value, options)
        );

        // Backward compatibility (remove before 1.0 release)
        if (tokenNamePart === '') {
          tokenNamePart = replaceTokens(initialValue, new Map(component.variantProperties), (_, variantProp, value) =>
            normalizeTokenNamePartValue(variantProp, value, options)
          );
        }

        return tokenNamePart;
      })
      .filter((part) => part !== '');
  }

  const parts: string[] = [
    component.name,
    normalizeComponentPartName(part)
  ];

  component.variantProperties.forEach(([variantProp, value]) => {
    parts.push(normalizeTokenNamePartValue(variantProp, value, options));
  });

  parts.push(property);

  return parts.filter(part => part !== '');
}

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
export const normalizeTokenNamePartValue = (variable: string, value?: string, options?: ComponentDefinitionOptions, keepDefaults: boolean = false) => {
  const replace = options?.transformer.replace ?? {};
  const defaults = options?.shared.defaults ?? {};

  if (variable in (replace ?? {}) && value && value in (replace[variable] ?? {})) {
    return replace[variable][value] ?? '';
  }

  // if (!keepDefaults && variable in (defaults ?? {}) && value === (defaults[variable as keyof typeof defaults] ?? '') ) {
  //   return '';
  // }

  return value;
}

/**
 * Returns the normalized part name.
 * @param part 
 * @returns 
 */
const normalizeComponentPartName = (part: string) => {
  return part === '$' ? '' : part.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
}
