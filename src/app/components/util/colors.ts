// The contrast ratio is defined in https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
// as (L1 + 0.05) / (L2 + 0.05) where L1 and L2 are the relative luminances
// (see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance) of the lighter and
// darker colors, respectively. The relative luminances are weighted sums of
// scaled sRGB coordinates: 0.2126 * R + 0.7152 * G + 0.0722 * B where each of
// R, G, and B is defined as ifelse(RGB <= 0.03928, RGB/12.92, ((RGB + 0.055)/1.055)^2.4)
// based on the RGB coordinates between 0 and 1.

const redCoeff = 0.2126;
const greenCoeff = 0.7152;
const blueCoeff = 0.0722;

/**
 * Calculates the relative luminance of a color.
 * The relative luminance is defined as:
 * 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, and B are the red, green, and blue components of the color.
 * @param r
 * @param g
 * @param b
 */
export const calculateRelativeLuminance = (r: number, g: number, b: number) => {
  // Convert RGB values to the range [0, 1]
  r = r / 255;
  g = g / 255;
  b = b / 255;
  // Apply the sRGB to linear RGB conversion
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return redCoeff * r + greenCoeff * g + blueCoeff * b;
};

/**
 * Calculates the contrast ratio between two colors.
 * The contrast ratio is defined as (L1 + 0.05) / (L2 + 0.05)
 * where L1 and L2 are the relative luminances of the lighter and darker colors, respectively.
 * @param color1
 * @param color2
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgbArray(color1);
  const rgb2 = hexToRgbArray(color2);
  const luminance1 = calculateRelativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const luminance2 = calculateRelativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const L1 = Math.max(luminance1, luminance2);
  const L2 = Math.min(luminance1, luminance2);
  const contrastRatio = (L1 + 0.05) / (L2 + 0.05);
  return contrastRatio;
};
/**
 * Converts a hex color to an RGB array.
 * @param hex The hex color string (e.g. "#ff0000" or "ff0000")
 * @returns An array containing the RGB values [r, g, b].
 * If the hex color has an alpha value, it will be ignored.
 */
export const hexToRgbArray = (hex: string) => {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, '');
  let alpha = 255;
  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16);
    hex = hex.slice(0, 6);
  }
  if (hex.length === 4) {
    alpha = parseInt(hex.slice(3, 4).repeat(2), 16);
    hex = hex.substring(0, 3);
  }
  // If shorthand, convert to full form
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((h) => h + h)
      .join('');
  }

  // Parse r, g, b values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
};

export const hexToRgb = (hex: string) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `Red: ${parseInt(result[1], 16)}, Green: ${parseInt(result[2], 16)}, Blue: ${parseInt(result[3], 16)}` : null;
};
