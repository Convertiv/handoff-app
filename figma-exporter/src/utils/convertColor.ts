import * as FigmaTypes from '../figma/types';
import { capitalize } from 'lodash';
import { filterOutUndefined } from '../utils';

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

// export const calculateLinearGradientAngle = (position: FigmaTypes.Transform): number => {
//   const values = [...position[0], ...position[1]];
//   const a = values[0];
//   const b = values[1];
//   const angle = Number(((Math.atan2(b, a) * (180 / Math.PI)) + 90).toFixed(2));

//   return angle <= 0 ? angle + 360 : angle;
// }

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
  const { type, color, offset, radius, visible } = effect;

  if (!visible) {
    return '';
  }

  if (type === 'DROP_SHADOW' && color && offset && radius) {
    const { x, y } = offset;

    return `${x}px ${y}px ${radius}px ${transformFigmaColorToCssColor(color)}`;
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


export const cssCodeBlockComment = (type: string, component: AbstractComponent): string => {
  let comment = `// ${type} ${capitalize(component.componentType === 'design' ? component.type : component.size)} `;
  comment += (component.componentType === 'design' && component.theme) && `, theme: ${capitalize(component.theme)}`;
  comment += (component.componentType === 'design' && component.state) && `, state: ${capitalize(component.state)}`;
  return comment;
}

/**
 * this function converts figma color to RGB(A) (array)
 */

// figmaRGBToWebRGB({r: 0.887499988079071, g: 0.07058823853731155, b: 0.0665624737739563, a: 1})
//=> [226, 18, 17]

export function figmaColorToWebRGB(color: FigmaTypes.Color): webRGB | webRGBA {
  if ('a' in color && color.a !== 1) {
    return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), Math.round(color.a * 100) / 100];
  }

  return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)];
}

/**
 * this function converts figma color to HEX (string)
 */

// figmaRGBToHex({ r: 0, g: 0.1, b: 1, a: 1 })
//=> #001aff

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

export function parseFigmaColor(color: FigmaTypes.Color) : string {
  return '';
}


type webRGB = [number, number, number];
type webRGBA = [number, number, number, number];
