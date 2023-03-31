import { TypographyObject } from "../../../types";

export default function transformTypography(typography: TypographyObject[]): string {
  const stringBuilder: Array<string> = [];

  stringBuilder.push(`$type-sizes: ( ${typography.map(type => `"${getTypeName(type)}"`).join(', ')} );`);
  stringBuilder.push(``);

  typography.forEach(type => {
    stringBuilder.push([
      `--typography-${getTypeName(type)}-font-family: '${type.values.fontFamily}';`,
      `--typography-${getTypeName(type)}-font-size: ${type.values.fontSize}px;`,
      `--typography-${getTypeName(type)}-font-weight: ${type.values.fontWeight};`,
      `--typography-${getTypeName(type)}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`,
      `--typography-${getTypeName(type)}-letter-spacing: ${type.values.letterSpacing}px;`,
      `--typography-${getTypeName(type)}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`,
    ].join('\n'));
  })
  
  return stringBuilder.join('\n');
}

function getTypeName(type: TypographyObject): string {
  return type.group
    ? `${type.group}-${type.machine_name}`
    : `${type.machine_name}`;
}