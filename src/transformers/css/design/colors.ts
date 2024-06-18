import { ColorObject } from "../../../types.js";

export default function transformColors(colors: ColorObject[]): string {
  const stringBuilder: Array<string> = [];

  colors.forEach(color => {
    stringBuilder.push(`	--color-${color.group}-${color.machineName}: ${color.value};`);
  });

  return `:root {\n${stringBuilder.join('\n')}\n}\n`;
}
