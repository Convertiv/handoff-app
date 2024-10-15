import { getTypeName } from "../../utils";
import { TypographyObject } from "../../../types";

export function transformTypographyTypes(typography: TypographyObject[]): string {
  const stringBuilder: Array<string> = [];

  stringBuilder.push(`$type-sizes: ( ${typography.map(type => `"${getTypeName(type)}"`).join(', ')} );`);

  return stringBuilder.join('\n');
}

export default function transformTypography(typography: TypographyObject[]): string {
  const stringBuilder: Array<string> = [];

  typography.forEach(type => {
    stringBuilder.push([
      `$typography-${getTypeName(type)}-font-family: '${type.values.fontFamily}';`,
      `$typography-${getTypeName(type)}-font-size: ${type.values.fontSize}px;`,
      `$typography-${getTypeName(type)}-font-weight: ${type.values.fontWeight};`,
      `$typography-${getTypeName(type)}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`,
      `$typography-${getTypeName(type)}-letter-spacing: ${type.values.letterSpacing}px;`,
      `$typography-${getTypeName(type)}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`,
    ].join('\n'))
  })
  // Get a unique list of font families
  const fontFamilies = typography.map(type => type.values.fontFamily);
  const uniqueFontFamilies = Array.from(new Set(fontFamilies));
  // Add the font families to the top of the typography
  uniqueFontFamilies.forEach(fontFamily => {
    stringBuilder.unshift(`$font-family-${fontFamily.replace(/ /g, '-').toLowerCase()}: '${fontFamily}';`);
  });
  
  return stringBuilder.join('\n');
}