import Handlebars from 'handlebars';
import { RegisterHandlebarsHelpersContext } from '../../types/config';
import { Logger } from '../../utils/logger';
import { SlotMetadata } from '../preview/component';
import {
  renderComponentScriptTag,
  renderComponentStyleLink,
  renderGlobalScriptTag,
  renderSharedStyleLinks,
  type ComponentArtifactPresence,
  type SharedArtifactPresence,
} from '../preview/component/shared-artifacts';
import { HandlebarsContext } from '../types';

/**
 * Registers common Handlebars helpers, then runs optional `hooks.registerHandlebarsHelpers`.
 * @param data - Component data containing properties
 * @param injectFieldWrappers - Whether to inject field wrappers for inspection
 * @param extend - Optional callback from config to register additional helpers
 */
export const registerHandlebarsHelpers = (
  data: { properties: { [key: string]: SlotMetadata }; id: string },
  injectFieldWrappers: boolean,
  extend?: (context: RegisterHandlebarsHelpersContext) => void
): void => {
  // Field helper for property binding
  Handlebars.registerHelper('field', function (field: string, options: any) {
    if (injectFieldWrappers) {
      if (!field) {
        // This debugging isn't helpful in the context of the component library
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

  // Equality helper
  Handlebars.registerHelper('eq', function (a: any, b: any) {
    return a === b;
  });

  if (extend) {
    try {
      extend({
        handlebars: Handlebars,
        componentId: data.id,
        properties: data.properties,
        injectFieldWrappers,
      });
    } catch (err) {
      Logger.error(`registerHandlebarsHelpers hook failed for ${data.id}`, err);
    }
  }
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
  options?: {
    includeSharedStyles?: boolean;
    sharedArtifacts?: SharedArtifactPresence;
    componentArtifacts?: ComponentArtifactPresence;
  }
): HandlebarsContext => {
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  // Shared/global artifacts (`component/shared.css`, `component/main.css`, `component/main.js`) and
  // the component's own css/js are referenced only when present, so a failed/absent build never
  // produces a dangling reference. Absent presence info conservatively omits the artifacts.
  const presence: SharedArtifactPresence = options?.sharedArtifacts ?? { mainJs: false, mainCss: false, sharedCss: false };
  const componentPresence: ComponentArtifactPresence = options?.componentArtifacts ?? { css: false, js: false };
  const sharedStyleLinks = renderSharedStyleLinks(presence, basePath, {
    includeSharedStyles: options?.includeSharedStyles,
  });
  const componentStyleLink = renderComponentStyleLink(componentPresence, data.id, basePath);
  // The global script loads before the component-specific script so global side effects run first.
  const globalScriptTag = renderGlobalScriptTag(presence, basePath);
  const componentScriptTag = renderComponentScriptTag(componentPresence, data.id, basePath);

  return {
    style:
      `${sharedStyleLinks ? `${sharedStyleLinks}\n` : ''}` +
      `${componentStyleLink ? `${componentStyleLink}\n` : ''}` +
      `<link rel="stylesheet" href="${basePath}/assets/css/preview.css">`,
    script:
      `${globalScriptTag ? `${globalScriptTag}\n` : ''}` +
      `${componentScriptTag ? `${componentScriptTag}\n` : ''}` +
      `<script src="${basePath}/assets/js/preview.js"></script><script>var fields = ${JSON.stringify(data.properties)};</script>`,
    properties: previewData.values || {},
    fields: data.properties,
    title: data.title,
  };
};
