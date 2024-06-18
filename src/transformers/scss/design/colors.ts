import { ColorObject } from "../../../types.js";

export function transformColorTypes(colors: ColorObject[]): string {
  const stringBuilder: Array<string> = [];

  stringBuilder.push(`$color-groups: ( ${Array.from(new Set(colors.map(color => `"${color.group}"`))).join(', ')} );`);
  stringBuilder.push(`$color-names: ( ${colors.map(color => `"${color.group}-${color.machineName}"`).join(', ')} );`);
  stringBuilder.push(``);

  return stringBuilder.join('\n');
}

export default function transformColors(colors: ColorObject[]): string {
  const stringBuilder: Array<string> = [];

  colors.forEach(color => {
    stringBuilder.push(`$color-${color.group}-${color.machineName}: ${color.value};`);
  });

  return stringBuilder.join('\n');
}
