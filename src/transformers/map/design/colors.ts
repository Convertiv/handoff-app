import { ColorObject } from "../../../types";

export default function transformColors(colors: ColorObject[]): string {
  const result: Record<string, string> = {};
  
  colors.forEach(color => {
    result[`color-${color.group}-${color.machineName}`] = `${color.value}`;
  });

  return JSON.stringify(result, null, 2);
}