import { getTypeName } from "../../utils";
import { TypographyObject } from "../../../types";

export default function transformTypography(typography: TypographyObject[]) {
  const result: Record<string, string> = {};

  typography.forEach(type => {
    result[`typography-${getTypeName(type)}-font-family`] = `${type.values.fontFamily}`;
    result[`typography-${getTypeName(type)}-font-size`] = `${type.values.fontSize}px`;
    result[`typography-${getTypeName(type)}-font-weight`] = `${type.values.fontWeight}`;
    result[`typography-${getTypeName(type)}-line-height`] = `${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)}`;
    result[`typography-${getTypeName(type)}-letter-spacing`] = `${type.values.letterSpacing}px`;
    result[`typography-${getTypeName(type)}-paragraph-spacing`] = `${type.values.paragraphSpacing | 20}px`;
  });
  
  return result;
}