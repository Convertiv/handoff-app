import { ColorObject } from "../../../types";

export default function transformColors(colors: ColorObject[]): string {
  const stringBuilder: Array<string> = [];
  
  colors.forEach(color => {
    stringBuilder.push(`--color-${color.group}-${color.machineName}: ${color.value};`);
  });

  return stringBuilder.join('\n');
}