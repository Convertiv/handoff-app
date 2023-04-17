import * as FigmaTypes from '../figma/types';
import { capitalize } from 'lodash';
import { filterOutUndefined } from '../utils';
import { GradientObject, PositionObject, StopObject } from '../types';
import { isShadowEffectType, isValidGradientType } from '../exporters/components/utils';
import { getLinearGradientParamsFromGradientObject, getRadialGradientParamsFromGradientObject } from './gradients';

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
 * Generate a CSS gradient from a color gradient object
 
 * @todo Support other kinds of gradients
 * @param color
 * @returns
 */
export function transformGradientToCss(color: GradientObject, paintType: FigmaTypes.PaintType = 'GRADIENT_LINEAR'): string {
  // generate the rgbs) {}
  let params: number[] = [];
  let colors: string[] = [];

  if (paintType === 'SOLID') {
    params = getLinearGradientParamsFromGradientObject(color);
    colors = color.stops.map((stop) => `rgba(${figmaColorToWebRGB(stop.color).join(', ')})`);
    return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
  }

  if (paintType === 'GRADIENT_LINEAR') {
    params = getLinearGradientParamsFromGradientObject(color);
    colors = color.stops.map((stop, i) => `rgba(${figmaColorToWebRGB(stop.color).join(', ')}) ${params[i + 1]}%`);
    return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
  }

  if (paintType === 'GRADIENT_RADIAL') {
    const params = getRadialGradientParamsFromGradientObject(color);
    colors = color.stops.map((stop) => `rgba(${figmaColorToWebRGB(stop.color).join(', ')}) ${(Number(Number((stop.position ?? 0).toFixed(4)) * 100).toFixed(2))}%`);
    return `radial-gradient(${params[0]}% ${params[1]}% at ${params[2]}% ${params[3]}%, ${colors.join(', ')})`;
  }

  return ``;
}

export function transformFigmaPaintToGradient(paint: FigmaTypes.Paint): GradientObject | null {
  if (paint.type === 'SOLID') {
     // Process solid as gradient
     const gradientColor = paint.color && paint.opacity ? {...paint.color, a: paint.opacity} : paint.color;
     return {
       blend: paint.blendMode,
       handles: ([{x: 0, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}] as PositionObject[]),
       stops: [{color: gradientColor, position: null}, {color: gradientColor, position: null}] as StopObject[],
     };
  }

  if (isValidGradientType(paint.type)) {
    return {
      blend: paint.blendMode,
      handles: (paint.gradientHandlePositions as PositionObject[]) ?? [],
      stops: (paint.gradientStops as StopObject[]) ?? [],
    };
  }

  return null;
}

/**
 * Converts figma color to a hex (string) value.
 * 
 * @param {FigmaTypes.Color} color 
 * @returns {string}
 * 
 * @example
 * // returns #001aff
 * figmaRGBToHex({ r: 0, g: 0.1, b: 1, a: 1 })
 */
export function transformFigmaColorToHex(color: FigmaTypes.Color): string {
  let hex = '#';

  const rgb = figmaColorToWebRGB(color) as webRGB | webRGBA;
  hex += ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);

  if (rgb[3] !== undefined) {
    const a = Math.round(rgb[3] * 255).toString(16);
    if (a.length == 1) {
      hex += '0' + a;
    } else {
      if (a !== 'ff') hex += a;
    }
  }
  return hex;
}

export const transformFigmaColorToCssColor = (color: FigmaTypes.Color): string => {
  const { r, g, b, a } = color;
  if (a === 1) {
    // transform to hex
    return transformFigmaColorToHex(color);
  }

  return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${parseFloat(a.toFixed(3))})`;
};

export function transformFigmaPaintToCssColor(paint: FigmaTypes.Paint, asLinearGradient: boolean = false): string | null {
  if (paint.type === 'SOLID' && !asLinearGradient) {
    if (!paint.color) {
      return null;
    }

    const { r, g, b, a } = paint.color || { r: 0, g: 0, b: 0, a: 0 };
    return transformFigmaColorToCssColor({ r, g, b, a: a * (paint.opacity ?? 1) });
  }

  const gradient = transformFigmaPaintToGradient(paint);
  return gradient ? transformGradientToCss(gradient, paint.type) : null;
}

export const transformFigmaFillsToCssColor = (fills: ReadonlyArray<FigmaTypes.Paint>, fallbackColor: string = 'transparent', fallbackBlendMode: string = 'normal'): { color: string, blend: string } => {
  fills = [...fills].reverse();

  const count = fills?.length ?? 0;
  const hasMoreThanOneLayer = count > 1;

  const colorValue = count > 0
    ? fills.map((fill, i) => transformFigmaPaintToCssColor(fill, hasMoreThanOneLayer && i !== (count - 1))).filter(Boolean).join(', ')
    : fallbackColor;

  const blendValue = hasMoreThanOneLayer
    ? fills.map(fill => fill.blendMode.toLowerCase().replaceAll('_', '-')).filter(Boolean).join(', ')
    : fallbackBlendMode;

  return {
    color: colorValue,
    blend: blendValue
  }
}

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

export const transformFigmaEffectToCssBoxShadow = (effect: FigmaTypes.Effect): string => {
  const { type, color, offset, radius, visible, spread } = effect;

  if (!visible) {
    return '';
  }

  if (isShadowEffectType(type) && color && offset) {
    const { x, y } = offset;

    return `${x}px ${y}px ${radius ?? 0}px ${spread ? spread + 'px ' : ''}${transformFigmaColorToCssColor(color)}${type === 'INNER_SHADOW' ? ' inset' : '' }`;
  }

  return '';
};
export interface AbstractComponent {
  componentType?: string;
  /**
   * Component theme (light, dark)
   *
   * @default 'light'
   */
  theme?: string;
  /**
   * Component type (primary, secondary, tertiary, etc.)
   *
   * @default 'primary'
   */
  type?: string;
  /**
   * Component state (default, hover, disabled)
   *
   * @default 'default'
   */
  state?: string;
  /**
   * Component size (lg, md, sm, xs, ...)
   */
  size?: string;
  layout?: string;
}
export const getTypesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components.map((component) => component.type).filter(filterOutUndefined)));
};
export const getStatesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components.map((component) => component.state).filter(filterOutUndefined)));
};
export const getThemesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components.map((component) => component.theme).filter(filterOutUndefined)));
};
export const getSizesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components.map((component) => component.size).filter(filterOutUndefined)));
};

export const cssCodeBlockComment = (type: string, component: AbstractComponent): string => {
  let comment = `// ${type} ${capitalize(component.componentType === 'design' ? component.type : component.size)} `;
  comment += component.componentType === 'design' && component.theme && `, theme: ${capitalize(component.theme)}`;
  comment += component.componentType === 'design' && component.state && `, state: ${capitalize(component.state)}`;
  return comment;
};

/**
 * Converts figma color to a RGB(A) in form of a array.
 * 
 * @param {FigmaTypes.Color} color 
 * @returns {string}
 * 
 * @example
 * // returns [226, 18, 17]
 * figmaRGBToWebRGB({r: 0.887499988079071, g: 0.07058823853731155, b: 0.0665624737739563, a: 1})
 */
export function figmaColorToWebRGB(color: FigmaTypes.Color): webRGB | webRGBA {
  if ('a' in color && color.a !== 1) {
    return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), Math.round(color.a * 100) / 100];
  }

  return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)];
}

/**
 * Converts figma color to a hex (string) value.
 * 
 * @param {FigmaTypes.Color} color 
 * @returns {string}
 * 
 * @example
 * // returns #001aff
 * figmaRGBToHex({ r: 0, g: 0.1, b: 1, a: 1 })
 */
export function figmaColorToHex(color: FigmaTypes.Color): string {
  let hex = '#';

  const rgb = figmaColorToWebRGB(color) as webRGB | webRGBA;
  hex += ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);

  if (rgb[3] !== undefined) {
    const a = Math.round(rgb[3] * 255).toString(16);
    if (a.length == 1) {
      hex += '0' + a;
    } else {
      if (a !== 'ff') hex += a;
    }
  }
  return hex;
}

export const transformFigmaNumberToCss = (value: number) => {
  return parseFloat(value.toFixed(3));
}

/**
 * Generate a CSS gradient from a color gradient object
 
 * @todo Support other kinds of gradients
 * @param color
 * @returns
 */
export function gradientToCss(color: GradientObject, paintType: FigmaTypes.PaintType = 'GRADIENT_LINEAR'): string {
  // generate the rgbs) {}
  let params: number[] = [];
  let colors: string[] = [];

  if (paintType === 'SOLID') {
    params = getLinearGradientParamsFromGradientObject(color);
    colors = color.stops.map((stop) => `rgba(${figmaColorToWebRGB(stop.color).join(', ')})`);
    return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
  }

  if (paintType === 'GRADIENT_LINEAR') {
    params = getLinearGradientParamsFromGradientObject(color);
    colors = color.stops.map((stop, i) => `rgba(${figmaColorToWebRGB(stop.color).join(', ')}) ${params[i + 1]}%`);
    return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
  }

  if (paintType === 'GRADIENT_RADIAL') {
    const params = getRadialGradientParamsFromGradientObject(color);
    colors = color.stops.map((stop) => `rgba(${figmaColorToWebRGB(stop.color).join(', ')}) ${(Number(Number((stop.position ?? 0).toFixed(4)) * 100).toFixed(2))}%`);
    return `radial-gradient(${params[0]}% ${params[1]}% at ${params[2]}% ${params[3]}%, ${colors.join(', ')})`;
  }

  return ``;
}

export function figmaPaintToGradient(paint: FigmaTypes.Paint): GradientObject | null {
  if (paint.type === 'SOLID') {
     // Process solid as gradient
     const gradientColor = paint.color && paint.opacity ? {...paint.color, a: paint.opacity} : paint.color;
     return {
       blend: paint.blendMode,
       handles: ([{x: 0, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}] as PositionObject[]),
       stops: [{color: gradientColor, position: null}, {color: gradientColor, position: null}] as StopObject[],
     };
  }

  if (isValidGradientType(paint.type)) {
    return {
      blend: paint.blendMode,
      handles: (paint.gradientHandlePositions as PositionObject[]) ?? [],
      stops: (paint.gradientStops as StopObject[]) ?? [],
    };
  }

  return null;
}

export function figmaPaintToHex(paint: FigmaTypes.Paint, asLinearGradient: boolean = false): string | null {
  if (paint.type === 'SOLID' && !asLinearGradient) {
    return paint.color ? figmaColorToHex(paint.color) : null;
  }

  const gradient = figmaPaintToGradient(paint);

  return gradient ? gradientToCss(gradient, paint.type) : null;
}

type webRGB = [number, number, number];
type webRGBA = [number, number, number, number];
