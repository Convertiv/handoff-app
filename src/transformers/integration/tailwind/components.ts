import { DocumentComponentsObject } from '../../../exporters/components';
import { Component } from '../../../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../../types';
import { transform } from '../../transformer';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToTailwind = (
  _: string,
  components: Component[],
  options?: ExportableTransformerOptions & ExportableSharedOptions
): string => {
  const sd = {} as any;

  components.forEach((component) => {
    const tokens = transform('sd', component, options);
    Object.entries(tokens).forEach(([_, tokenValue]) => {
      const metadata = tokenValue.metadata;
      const lastIdx = tokenValue.metadata.propertyPath.length - 1;
      const componentName = metadata.name;
      const componentType = metadata.variant;
      const componentState = metadata.state;
      const part = metadata.part;
      if(metadata.type === 'layout') return;
      let className = `.${componentName}-${componentType}`;
      if(part !== '$' && part !== '') className = `${className}-${part}`;
      let ref = sd;
      if (!ref[className]) ref[className] = {};

      const propParts = tokenValue.metadata.propertyPath[lastIdx].split('-');
      const key = `${propParts[0]}${propParts
        .slice(1)
        .map((el) => el.charAt(0).toUpperCase() + el.slice(1))
        .join('')}`;
      
      if (componentState === 'default' || !componentState) {
        ref[className][key] = tokenValue.value;
      } else {
        if (!ref[className][`$${componentState}`]) ref[className][`$${componentState}`] = {};
        ref[className][`$${componentState}`][key] = tokenValue.value;
      }
    });
  });

  return `module.exports = ${JSON.stringify(sd, null, 2)};`;
};

export const componentMapFile = (components: DocumentComponentsObject) => {
  let output = ``;
  for (const componentName in components) {
    output += `const ${componentName}Components = require('./${componentName}');\n`;
  }

  output += `const createComponentMap = () => {
    const componentMap = {\n`;
    for (const componentName in components) {
      output += `      ...${componentName}Components,\n`;
    };
  output += `  };\n  return componentMap;\n  };\n\nmodule.exports = createComponentMap;`;
  return output;
};