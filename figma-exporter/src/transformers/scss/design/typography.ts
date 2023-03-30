import { TypographyObject } from "../../../types";

export default function transformTypography(typography: TypographyObject[]): string {
  const stringBuilder: Array<string> = [];

  typography.forEach(type => {
    stringBuilder.push([
      `$typography-${type.machine_name}-font-family: '${type.values.fontFamily}';`,
      `$typography-${type.machine_name}-font-size: ${type.values.fontSize}px;`,
      `$typography-${type.machine_name}-font-weight: ${type.values.fontWeight};`,
      `$typography-${type.machine_name}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`,
      `$typography-${type.machine_name}-letter-spacing: ${type.values.letterSpacing}px;`,
      `$typography-${type.machine_name}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`,
    ].join('\n'))
  })
  
  return stringBuilder.join('\n');
}