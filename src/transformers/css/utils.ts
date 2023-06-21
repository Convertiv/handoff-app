import { filterOutUndefined } from '../../utils/index';
import { transformFigmaColorToHex } from '../../utils/convertColor';
import * as FigmaTypes from '../../figma/types';
/**
 * Get the name of a SCSS variable from a token object
 * @param tokens 
 * @returns string
 */
export const getScssVariableName = <
  Tokens extends { component: string; property: string; part?: string; theme?: string; type?: string; state?: string }
>(
  tokens: Tokens
): string => {
  const { component, property, part, theme = 'light', type = 'default', state = 'default' } = tokens;

  const parts = [
    component,
    type === 'default' ? '' : type,
    part,
    theme === 'light' ? '' : theme,
    state === 'default' ? '' : state,
    property,
  ].filter(Boolean);

  return `$${parts.join('-')}`;
};
/**
 * Get the name of a CSS variable from a token object
 * @param tokens 
 * @returns 
 */
export const getCssVariableName = <
  Tokens extends { component: string; property: string; part?: string; theme?: string; type?: string; state?: string }
>(
  tokens: Tokens
): string => {
  const { component, property, part, theme = 'light', type = 'default', state = 'default' } = tokens;

  const parts = [
    component,
    type === 'default' ? '' : type,
    part,
    theme === 'light' ? '' : theme,
    state === 'default' ? '' : state,
    property,
  ].filter(Boolean);

  return `--${parts.join('-')}`;
};
/**
 * Transform a Figma color to a CSS color
 * @param color 
 * @returns string
 */
export const transformFigmaColorToCssColor = (color: FigmaTypes.Color): string => {
  const { r, g, b, a } = color;
  if (a === 1) {
    // transform to hex
    return transformFigmaColorToHex(color);
  }

  return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
};
/**
 * Transform a Figma fill color to a CSS color
 * @param paint 
 * @returns 
 */
export const transformFigmaFillsToCssColor = (paint: FigmaTypes.Paint): string => {
  if (paint.visible === false || paint.opacity === 0) {
    return '';
  }

  if (paint.type === 'SOLID') {
    const { r, g, b, a } = paint.color || { r: 0, g: 0, b: 0, a: 0 };

    return transformFigmaColorToCssColor({ r, g, b, a: a * (paint.opacity ?? 1) });
  }

  // TODO: Liner Gradient
  return '';
};
/**
 * 
 * @param textAlign 
 * @returns 
 */
export const transformFigmaTextAlignToCss = (textAlign: FigmaTypes.TypeStyle['textAlignHorizontal']): string => {
  return ['left', 'center', 'right', 'justify'].includes(textAlign.toLowerCase()) ? textAlign.toLowerCase() : 'left';
};

export const transformFigmaTextDecorationToCss = (textDecoration: FigmaTypes.TypeStyle['textDecoration']): string => {
  if (textDecoration === 'UNDERLINE') {
    return 'underline';
  }

  if (textDecoration === 'STRIKETHROUGH') {
    return 'line-through';
  }

  return 'none';
};

export const transformFigmaTextCaseToCssTextTransform = (textCase: FigmaTypes.TypeStyle['textCase']): string => {
  if (textCase === 'UPPER') {
    return 'uppercase';
  }

  if (textCase === 'LOWER') {
    return 'lowercase';
  }

  if (textCase === 'TITLE') {
    return 'capitalize';
  }

  return 'none';
};

export interface AbstractComponent {
  componentType?: string;
  /**
   * Component theme (light, dark)
   */
  theme?: string;
  /**
   * Component type (primary, secondary, tertiary, etc.)
   */
  type?: string;
  /**
   * Component state (default, hover, disabled)
   */
  state?: string;
  /**
   * Component size (lg, md, sm, xs, ...)
   */
  size?: string;
  layout?: string;
}

export const getTypesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components
    .map((component) => component.type)
    .filter(filterOutUndefined)));
};

export const getStatesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components
    .map((component) => component.state)
    .filter(filterOutUndefined)));
};

export const getThemesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components
    .map((component) => component.theme)
    .filter(filterOutUndefined)));
};

export const getSizesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components
    .map((component) => component.size)
    .filter(filterOutUndefined)));
};