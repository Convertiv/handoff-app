import { ColorObject } from "../../../types";

export default function transformColors(colors: ColorObject[]): string {
  const stringBuilder: Array<string> = [];

  stringBuilder.push(`$color-groups: ( ${Array.from(new Set(colors.map(color => `"${color.group}"`))).join(', ')} );`);
  stringBuilder.push(`$color-names: ( ${colors.map(color => `"${color.group}-${color.machineName}"`).join(', ')} );`);
  stringBuilder.push(``);

  colors.forEach(color => {
    stringBuilder.push(`--color-${color.group}-${color.machineName}: ${color.hex};`);
  });

  return stringBuilder.join('\n');
}