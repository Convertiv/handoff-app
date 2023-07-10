import { getTypeName } from "../../utils";
import { TypographyObject } from "../../../types";

/**
 * Build typography style dictionary
 * @param effects 
 * @returns 
 */
export default function transformTypography(typography: TypographyObject[]): string {
  const sd = {} as any;

  typography.forEach(type => {
    sd[getTypeName(type)] ??= {};

    sd[getTypeName(type)]['font'] ??= {};
    sd[getTypeName(type)]['font']['family'] = {value: type.values.fontFamily};
    sd[getTypeName(type)]['font']['size'] = {value: `${type.values.fontSize}px`};
    sd[getTypeName(type)]['font']['weight'] = {value: type.values.fontWeight};

    sd[getTypeName(type)]['line'] ??= {};
    sd[getTypeName(type)]['line']['height'] = {value: (type.values.lineHeightPx / type.values.fontSize).toFixed(1)};

    sd[getTypeName(type)]['letter'] ??= {};
    sd[getTypeName(type)]['letter']['spacing'] = {value: `${type.values.letterSpacing}px`};

    sd[getTypeName(type)]['paragraph'] ??= {};
    sd[getTypeName(type)]['paragraph']['spacing'] = {value: `${type.values.paragraphSpacing | 20}px`};
  });
  
  return JSON.stringify({ 'typography': sd }, null, 2);
}