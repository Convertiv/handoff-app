import { getTypeName } from "../../utils.js";
import { TypographyObject } from "../../../types.js";

/**
 * Build typography style dictionary
 * @param effects
 * @returns
 */
export default function transformTypography(typography: TypographyObject[]): string {
  return JSON.stringify({
    'typography': typography.reduce((obj, type) => (
      {
        ...obj, [getTypeName(type)]: {
          'font': {
            'family': { value: type.values.fontFamily },
            'size': { value: `${type.values.fontSize}px` },
            'weight': { value: type.values.fontWeight },
          },
          'line': {
            'height': { value: (type.values.lineHeightPx / type.values.fontSize).toFixed(1) },
          },
          'letter': {
            'spacing': { value: `${type.values.letterSpacing}px` },
          },
          'paragraph': {
            'spacing': { value: `${type.values.paragraphSpacing | 20}px` },
          },
        }
      }
    ), {} as any)
  }, null, 2);
}
