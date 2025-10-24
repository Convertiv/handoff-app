import Handlebars from 'handlebars';
import { SlotMetadata } from '../preview/component';
import { HandlebarsContext } from '../types';

/**
 * Registers common Handlebars helpers
 * @param data - Component data containing properties
 * @param injectFieldWrappers - Whether to inject field wrappers for inspection
 */
export const registerHandlebarsHelpers = (
  data: { properties: { [key: string]: SlotMetadata }; id: string },
  injectFieldWrappers: boolean
): void => {
  // Field helper for property binding
  Handlebars.registerHelper('field', function (field: string, options: any) {
    if (injectFieldWrappers) {
      if (!field) {
        console.error(`Missing field declaration for ${data.id}`);
        return options.fn(this);
      }
      
      let parts = field.split('.');
      let current: any = data.properties;
      
      for (const part of parts) {
        if (current?.type === 'object') current = current.properties;
        else if (current?.type === 'array') current = current.items.properties;
        current = current?.[part];
      }
      
      if (!current) {
        console.error(`Undefined field path for ${data.id}`);
        return options.fn(this);
      }
      
      return new Handlebars.SafeString(
        `<span class="handoff-field handoff-field-${current?.type || 'unknown'}" data-handoff-field="${field}" data-handoff="${encodeURIComponent(JSON.stringify(current))}">${options.fn(this)}</span>`
      );
    } else {
      return options.fn(this);
    }
  });

  // Equality helper
  Handlebars.registerHelper('eq', function (a: any, b: any) {
    return a === b;
  });
};

/**
 * Creates Handlebars template context
 * @param data - Component data
 * @param previewData - Preview data with values
 * @returns Handlebars context object
 */
export const createHandlebarsContext = (
  data: { id: string; properties: { [key: string]: SlotMetadata }; title: string },
  previewData: { values?: any }
): HandlebarsContext => {
  return {
    style: `<link rel="stylesheet" href="/api/component/shared.css"><link rel="stylesheet" href="/api/component/${data.id}.css">\n<link rel="stylesheet" href="/assets/css/preview.css">`,
    script: `<script src="/api/component/${data.id}.js"></script>\n<script src="/assets/js/preview.js"></script><script>var fields = ${JSON.stringify(data.properties)};</script>`,
    properties: previewData.values || {},
    fields: data.properties,
    title: data.title,
  };
};
