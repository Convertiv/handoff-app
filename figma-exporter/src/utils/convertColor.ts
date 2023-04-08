import * as FigmaTypes from '../figma/types';
import { capitalize } from 'lodash';
import { filterOutUndefined } from '../utils';
import { GradientObject, PositionObject, StopObject } from '../types';
import { isShadowEffectType, isValidGradientType } from '../exporters/components/utils';

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

export const transformFigmaColorToCssColor = (color: FigmaTypes.Color): string => {
  const { r, g, b, a } = color;
  if (a === 1) {
    // transform to hex
    return figmaColorToHex(color);
  }

  return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
};

export const transformFigmaPaintToCssColor = (paint: FigmaTypes.Paint): string => {
  if (paint.visible === false || paint.opacity === 0) {
    return '';
  }

  if (paint.type === 'SOLID') {
    const { r, g, b, a } = paint.color || { r: 0, g: 0, b: 0, a: 0 };

    return transformFigmaColorToCssColor({ r, g, b, a: a * (paint.opacity ?? 1) });
  } else if (paint.type === 'GRADIENT_LINEAR') {
    // Get angle
  }
  return '';
};

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

/**
 * Returns the angle value (in deg) based on object (handle) positions.
 * 
 * @param {PositionObject[]} handles
 * @returns {string}
 */
export function getLinearGradientAngleInDeg(handles: PositionObject[]): string {
  const x1 = Number(handles[2].x.toFixed(4));
  const y1 = Number(handles[2].y.toFixed(4));
  const x2 = Number(handles[0].x.toFixed(4));
  const y2 = Number(handles[0].y.toFixed(4));

  const slope = (y2 - y1) / (x2 - x1);
  const radians = Math.atan(slope);
  let degrees = Number(((radians * 180) / Math.PI).toFixed(2));

  if (x1 < x2) {
    degrees = degrees + 180;
  } else if (x1 > x2) {
    if (y1 < y2) {
      degrees = 360 - Math.abs(degrees);
    }
  } else if (x1 == x2) {
    // horizontal line
    if (y1 < y2) {
      degrees = 360 - Math.abs(degrees); // on negative y-axis
    } else {
      degrees = Math.abs(degrees); // on positive y-axis
    }
  }
  
  return `${degrees}deg`;
}

/**
 * Returns the values (shape and position) necessary radial gradient to be constructed.
 * 
 * @param {PositionObject[]} handles 
 * @returns {number[]}
 */
export function getRadialGradientSizeAndPosition(handles: PositionObject[]): number[] {
  return [
    Number((handles[1].x - handles[0].x).toFixed(4)) * 100,
    Number((handles[2].y - handles[0].y).toFixed(4)) * 100,
    Number(handles[0].x.toFixed(4)) * 100,
    Number(handles[0].y.toFixed(4)) * 100,
  ]
}

/**
 * Generate a CSS gradient from a color gradient object
 
 * @todo Support other kinds of gradients
 * @param color
 * @returns
 */
export function gradientToCss(color: GradientObject, paintType: FigmaTypes.PaintType = 'GRADIENT_LINEAR'): string {
  // generate the rgbs) {}
  const colors = color.stops.map((stop) => 
    stop.position !== null
      ? `rgba(${figmaColorToWebRGB(stop.color).join(', ')}) ${(Number(Number(stop.position.toFixed(4)) * 100).toFixed(2))}%`
      : `rgba(${figmaColorToWebRGB(stop.color).join(', ')})`
  );

  switch (paintType) {
    case 'SOLID':
      return `linear-gradient(${getLinearGradientAngleInDeg(color.handles)}, ${colors.join(', ')})`;      
    case 'GRADIENT_LINEAR':
      return `linear-gradient(${getLinearGradientAngleInDeg(color.handles)}, ${colors.join(', ')})`;      
    case 'GRADIENT_RADIAL':
      const params = getRadialGradientSizeAndPosition(color.handles);
      return `radial-gradient(${params[0]}% ${params[1]}% at ${params[2]}% ${params[3]}%, ${colors.join(', ')})`;
    default:
      return ``;
  }
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
