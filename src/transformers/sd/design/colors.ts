import { ColorObject } from "../../../types.js";

/**
 * Build colors style dictionary
 * @param effects
 * @returns
 */
export default function transformColors(colors: ColorObject[]): string {
  const sd = {} as any;

  colors.forEach(color => {
    sd[color.group] ??= {};
    sd[color.group][color.machineName] = {
      value: color.value
    };
  });

  return JSON.stringify({ 'color': sd }, null, 2);
}
