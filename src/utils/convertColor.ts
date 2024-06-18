import * as FigmaTypes from '../figma/types.js';
import { GradientObject, PositionObject, StopObject } from '../types.js';
import { isShadowEffectType, isValidGradientType } from '../exporters/utils.js';
import { getLinearGradientParamsFromGradientObject, getRadialGradientParamsFromGradientObject } from './gradients.js';
import { normalizeCssNumber } from './numbers.js';

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
    colors = color.stops.map(
      (stop) =>
        `rgba(${figmaColorToWebRGB(stop.color)
          .map((val) => normalizeCssNumber(val))
          .join(', ')})`
    );
    return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
  }

  if (paintType === 'GRADIENT_LINEAR') {
    params = getLinearGradientParamsFromGradientObject(color);
    colors = color.stops.map(
      (stop, i) =>
        `rgba(${figmaColorToWebRGB(stop.color)
          .map((val) => normalizeCssNumber(val))
          .join(', ')}) ${params[i + 1]}%`
    );
    return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
  }

  if (paintType === 'GRADIENT_RADIAL') {
    const params = getRadialGradientParamsFromGradientObject(color);
    colors = color.stops.map(
      (stop) =>
        `rgba(${figmaColorToWebRGB(stop.color)
          .map((val) => normalizeCssNumber(val))
          .join(', ')}) ${normalizeCssNumber(Number(Number((stop.position ?? 0).toFixed(4)) * 100))}%`
    );
    return `radial-gradient(${normalizeCssNumber(params[0])}% ${normalizeCssNumber(params[1])}% at ${normalizeCssNumber(
      params[2]
    )}% ${normalizeCssNumber(params[3])}%, ${colors.join(', ')})`;
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

  return `rgba(${normalizeCssNumber(r * 255)}, ${normalizeCssNumber(g * 255)}, ${normalizeCssNumber(b * 255)}, ${normalizeCssNumber(a)})`;
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

export const transformFigmaFillsToCssColor = (fills: ReadonlyArray<FigmaTypes.Paint>, forceHexOrRgbaValue = false): { color: string, blend: string } => {
  const count = fills?.length ?? 0;
  const hasLayers = count > 0;
  const hasMultipleLayers = count > 1;
  const shouldForceHexOrRgbaValue = forceHexOrRgbaValue && fills.filter((f) => f.type !== 'SOLID').length === 0;

  let colorValue: string = 'transparent';
  let blendValue: string = 'normal';

  if (hasLayers) {
    if (shouldForceHexOrRgbaValue && hasMultipleLayers) {
      colorValue = transformFigmaColorToCssColor(blendFigmaColors(fills.map(fill => ({
        r: fill.color.r,
        g: fill.color.g,
        b: fill.color.b,
        a: fill.color.a * (fill.opacity ?? 1)
      }))));
    } else {
      fills = [...fills].reverse();
      colorValue = fills.map((fill, i) => transformFigmaPaintToCssColor(fill, hasMultipleLayers && i !== (count - 1))).filter(Boolean).join(', ');
      blendValue = fills.map(fill => fill.blendMode.toLowerCase().replaceAll('_', '-')).filter(Boolean).join(', ');
    }
  }

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
 * Blends multiple Figma colors into a single Figma color.
 * Based on the JordanDelcros's JavaScript implementation https://gist.github.com/JordanDelcros/518396da1c13f75ee057
 *
 * @param {FigmaTypes.Color[]} figmaColors
 * @returns
 */
function blendFigmaColors(figmaColors: FigmaTypes.Color[]) : FigmaTypes.Color {
  let base: webRGBA = [0, 0, 0, 0];
  let mix: webRGBA, added: webRGB | webRGBA;
  const colors = figmaColors.map(color => figmaColorToWebRGB(color));

  while (added = colors.shift()) {
    added[3] ??= 1

    if (base[3] && added[3]) {
        mix = [0, 0, 0, 0];
        mix[3] = 1 - (1 - added[3]) * (1 - base[3]); // A
        mix[0] = Math.round((added[0] * added[3] / mix[3]) + (base[0] * base[3] * (1 - added[3]) / mix[3])); // R
        mix[1] = Math.round((added[1] * added[3] / mix[3]) + (base[1] * base[3] * (1 - added[3]) / mix[3])); // G
        mix[2] = Math.round((added[2] * added[3] / mix[3]) + (base[2] * base[3] * (1 - added[3]) / mix[3])); // B
    } else if (added) {
        mix = added as webRGBA;
    } else {
        mix = base;
    }

    base = mix;
  }

  return {
    r: mix[0] / 255,
    g: mix[1] / 255,
    b: mix[2] / 255,
    a: mix[3],
  };
}


type webRGB = [number, number, number];
type webRGBA = [number, number, number, number];
