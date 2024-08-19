import { IntegrationObject } from '../types/config';
import path from 'path';

const toLowerCaseKeysAndValues = (obj: Record<string, any>): Record<string, any> => {
  const loweredObj: Record<string, any> = {};
  for (const key in obj) {
    const lowerKey = key.toLowerCase();
    const value = obj[key];

    if (typeof value === 'string') {
      loweredObj[lowerKey] = value.toLowerCase();
    } else if (typeof value === 'object' && value !== null) {
      loweredObj[lowerKey] = toLowerCaseKeysAndValues(value);
    } else {
      loweredObj[lowerKey] = value; // For non-string values
    }
  }
  return loweredObj;
};

export const prepareIntegrationObject = (integration: IntegrationObject, integrationPath: string): IntegrationObject => {
  if (integration.entries) {
    if (integration.entries.bundle) {
      integration.entries.bundle = path.resolve(integrationPath, integration.entries.bundle);
    }

    if (integration.entries.templates) {
      integration.entries.templates = path.resolve(integrationPath, integration.entries.templates);
    }

    if (integration.entries.integration) {
      integration.entries.integration = path.resolve(integrationPath, integration.entries.integration);
    }
  }

  const options = integration.options ?? {};

  if (!options || !options['*']) {
    return integration;
  }

  const wildcardOptions = options['*'];
  const mergedOptions: IntegrationObject['options'] = {};

  for (const key of Object.keys(options)) {
    // if (key === '*') continue;

    const specificOptions = options[key];

    mergedOptions[key] = {
      cssRootClass: specificOptions.cssRootClass || wildcardOptions.cssRootClass || null,
      tokenNameSegments: specificOptions.tokenNameSegments || wildcardOptions.tokenNameSegments || null,
      defaults: toLowerCaseKeysAndValues({
        ...wildcardOptions.defaults,
        ...specificOptions.defaults,
      }),
      replace: toLowerCaseKeysAndValues({
        ...wildcardOptions.replace,
        ...specificOptions.replace,
      }),
    };
  }

  return {
    ...integration,
    options: mergedOptions,
  };
};
