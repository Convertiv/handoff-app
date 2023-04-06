import * as FigmaTypes from '../figma/types';
import { capitalize } from 'lodash';
import { filterOutUndefined } from '../utils';
import { ColorLayer, GradientObject, PositionObject, RGBObject, StopObject } from '../types';
import { isShadowEffectType } from '../exporters/components/utils';

/**
 * Parse figma paint object
 * Given a figma paint object, this function generates the appropriate layers
 * @param paint
 * @returns
 */
export function parseFigmaPaints(paints: FigmaTypes.Paint[]): ColorLayer[] {
  const layers: ColorLayer[] = [];
  paints.map((paint) => {
    // Figure out what kind of paint we have
    switch (paint.type) {
      case 'SOLID':
        // Solid paint isn't a gradient

        break;
      case 'GRADIENT_LINEAR':
        // Process a linear gradient
        layers.push({
          blend: paint.blendMode,
          handles: (paint.gradientHandlePositions as PositionObject[]) ?? [],
          stops: (paint.gradientStops as StopObject[]) ?? [],
        });
    }
  });
  return layers;
}

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

export function figmaColorToWebRGBObject(color: FigmaTypes.Color): RGBObject {
  return { r: Math.round(color.r * 255), g: Math.round(color.g * 255), b: Math.round(color.b * 255), a: color.a };
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

/**
 * Parse a degree css string from from the handle position
 * @param handles
 * @returns
 */
export function degFromHandles(handles: PositionObject[]): string {
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
 * Generate a CSS gradient from a color gradient object
 * TODO: Support other kinds of gradients, and stacked colors
 * @param color
 * @returns
 */
export function gradientToCss(color: GradientObject): string {
  // generate the rgbs) {}
  const colors = color.stops.map((stop) => 
    stop.position !== null
      ? `rgba(${figmaColorToWebRGB(stop.color).join(', ')}) ${(Number(Number(stop.position.toFixed(4)) * 100).toFixed(2))}%`
      : `rgba(${figmaColorToWebRGB(stop.color).join(', ')})`
  );

  return `linear-gradient(${degFromHandles(color.handles)}, ${colors.join(', ')})`;
}

export function figmaPaintToRGB(paints: readonly FigmaTypes.Paint[]): RGBObject | null {
  // TODO: Solve blendMode
  let base: RGBObject | null = null;
  let mix: RGBObject = {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  };
  paints.map((added) => {
    // Get the color
    const color: RGBObject = figmaColorToWebRGBObject({ r: 0, g: 0, b: 0, a: 0, ...added.color });
    if (!color) {
      return null; // No color, just keep on walking
    }
    // RGBA might not have an alpha
    if (color.a === undefined) {
      color.a = 1;
    }
    // If the layer has opacity, set the alpha percent that to the rgba
    if (added.opacity) {
      color.a = color.a * added.opacity;
    }
    if (!base) {
      mix = color;
    } else {
      if (base.a > 0 && color.a > 0) {
        mix = blendColors(base, color);
      }
    }
    base = mix;
    return mix;
  });
  return mix;
}

export function blendColors(base: RGBObject, add: RGBObject): RGBObject {
  const mixAlpha = 1 - (1 - add.a) * (1 - base.a);
  return {
    r: Math.round((add.r * add.a) / mixAlpha + (base.r * base.a * (1 - add.a)) / mixAlpha),
    g: Math.round((add.g * add.a) / mixAlpha + (base.g * base.a * (1 - add.a)) / mixAlpha),
    b: Math.round((add.b * add.a) / mixAlpha + (base.b * base.a * (1 - add.a)) / mixAlpha),
    a: mixAlpha,
  };
}

export function figmaPaintToGradiant(paint: FigmaTypes.Paint): GradientObject | null {
  // Figure out what kind of paint we have
  switch (paint.type) {
    case 'SOLID':
      // Solid paint isn't a gradient so we fallback to defaults
      // so we can construct a linear gradient value for a solid
      const gradientColor = paint.color && paint.opacity ? {...paint.color, a: paint.opacity} : paint.color;
      return {
        blend: paint.blendMode,
        handles: ([{x: 0, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}] as PositionObject[]),
        stops: [{color: gradientColor, position: null}, {color: gradientColor, position: null}] as StopObject[],
      };
    case 'GRADIENT_LINEAR':
      // Process a linear gradient
      return {
        blend: paint.blendMode,
        handles: (paint.gradientHandlePositions as PositionObject[]) ?? [],
        stops: (paint.gradientStops as StopObject[]) ?? [],
      };
  }
  return null;
}

export function figmaPaintToHex(paint: FigmaTypes.Paint, forceLinearGradient: boolean = false): string | null {
  switch ( paint.type) {
    case 'SOLID':
      // Solid paint isn't a gradient but if want's to behave like one, fine :)
      if (!paint.color) {
        return null;
      }

      if (!forceLinearGradient) {
        return figmaColorToHex(paint.color);
      }

      const colorGradient = figmaPaintToGradiant(paint);
      return colorGradient ? gradientToCss(colorGradient) : null;
    case 'GRADIENT_LINEAR':
      // Process a linear gradient
      const gradient = figmaPaintToGradiant(paint);
      return gradient ? gradientToCss(gradient) : null;
  }
  return null;
}

type webRGB = [number, number, number];
type webRGBA = [number, number, number, number];
