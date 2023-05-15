import { capitalize } from "lodash";
import { Component } from "../exporters/components/extractor";

/**
 * Generate a comment block at the top of each record
 * @param type
 * @param component
 * @returns
 */
export const componentCodeBlockComment = (type: string, component: Component, format: "/**/" | "//"): string => {
  let str = type;

  if (component.componentType === 'design') {
    str = (component.type !== undefined) ? `${capitalize(component.type)} ${str}` : `${capitalize(str)}`;
    str += (component.theme !== undefined) ? `, theme: ${component.theme}` : ``;
    str += (component.state !== undefined) ? `, state: ${component.state}` : ``;
    str += (component.activity !== undefined) ? `, activity: ${component.activity}` : ``;
  }

  if (component.componentType === 'layout') {
    str = `${capitalize(str)}`;
    str += (component.layout !== undefined) ? `, layout: ${component.layout}` : ``;
    str += (component.size !== undefined) ? `, size: ${component.size}` : ``;
  }

  return format === "/**/" ? `/* ${str} */` : `// ${str}`
}
