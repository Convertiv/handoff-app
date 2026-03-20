import Handlebars from 'handlebars';
import { Logger } from '../../utils/logger';
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
        // This deebuging isn't helpful in the context of the component library
        // Logger.error(`Missing field declaration for ${data.id}`);
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
        Logger.error(`Undefined field path for ${data.id}`);
        return options.fn(this);
      }

      return new Handlebars.SafeString(
        `<span class="handoff-field handoff-field-${current?.type || 'unknown'}" data-handoff-field="${field}" data-handoff="${encodeURIComponent(JSON.stringify(current))}">${options.fn(this)}</span>`
      );
    } else {
      return options.fn(this);
    }
  });

  // Register 'json' as a simple (non-block) helper
  Handlebars.registerHelper('json', (value: any) => new Handlebars.SafeString(JSON.stringify(value, null, 2)));

  // register header and footer helpers to inject html into the head and body of the document
  Handlebars.registerHelper('header', (value: any) => new Handlebars.SafeString(value));
  Handlebars.registerHelper('footer', (value: any) => new Handlebars.SafeString(value));

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
  previewData: { values?: any },
  options?: { includeSharedStyles?: boolean }
): HandlebarsContext => {
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const sharedStylesLink = options?.includeSharedStyles ? `<link rel="stylesheet" href="${basePath}/api/component/shared.css">` : '';

  return {
    style:
      `${sharedStylesLink}<link rel="stylesheet" href="${basePath}/api/component/main.css">` +
      `<link rel="stylesheet" href="${basePath}/api/component/${data.id}.css">\n` +
      `<link rel="stylesheet" href="${basePath}/assets/css/preview.css">`,
    script: `<script src="${basePath}/api/component/${data.id}.js"></script>\n<script src="${basePath}/assets/js/preview.js"></script><script>var fields = ${JSON.stringify(data.properties)};</script>`,
    properties: previewData.values || {},
    fields: data.properties,
    title: data.title,
  };
};
