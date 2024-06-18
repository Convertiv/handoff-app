import { ColorObject } from "../../../types.js";

export default function transformColors(colors: ColorObject[]) {
  const result: Record<string, string> = {};

  colors.forEach(color => {
    result[`color-${color.group}-${color.machineName}`] = `${color.value}`;
  });

  return result;
}
