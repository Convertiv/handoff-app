import chalk from 'chalk';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { parse } from 'node-html-parser';
import path from 'path';
import * as prettier from 'prettier';
import { FileComponentsObject } from '../../../exporters/components/types';
import Handoff from '../../../index';
import { getComponentOutputPath, SlotMetadata } from '../component';
import { OptionalPreviewRender, TransformComponentTokensResult } from '../types';

const trimPreview = (preview: string) => {
  const bodyEl = parse(preview).querySelector('body');
  const code = bodyEl ? bodyEl.innerHTML.trim() : preview;
  return code;
};

const buildPreviews = async (
  id: string,
  location: string,
  data: TransformComponentTokensResult,
  handoff: Handoff,
  components?: FileComponentsObject
): Promise<TransformComponentTokensResult> => {
  const outputPath = getComponentOutputPath(handoff);
  const template = await fs.readFile(path.resolve(location, `${id}.hbs`), 'utf8');
  try {
    const previews = {};
    let injectFieldWrappers = false;
    Handlebars.registerHelper('field', function (field, options) {
      if (injectFieldWrappers) {
        if (!field) {
          console.log(chalk.red(`When processing previews for ${id}, a field block is declared but no field is provided`));
          return options.fn(this);
        }

        let parts = field.split('.');
        // iterate through the parts and find the field
        let current = data.properties as any;
        for (const part of parts) {
          if (current) {
            if (current.type && current.type === 'object') {
              current = current.properties;
            } else if (current.type && current.type === 'array') {
              current = current.items.properties;
            }
          }
          if (current[part]) {
            current = current[part];
          }
        }
        if (!current) {
          console.log(chalk.red(`When processing previews for ${id}, a field block is declared but undefined`));
          return options.fn(this);
        }
        return new Handlebars.SafeString(
          `<span class="handoff-field handoff-field-${current?.type ? current.type : 'unknown'}" data-handoff-field="${field}" data-handoff="${encodeURIComponent(JSON.stringify(current))}">` +
          options.fn(this) +
          '</span>'
        );
      } else {
        return options.fn(this);
      }
    });
    if (!components) components = {};
    const componentDocumentation = components[data.id];

    if (!!componentDocumentation) {
      for (const instance of componentDocumentation.instances) {
        const variantDefinition = Object.fromEntries(instance.variantProperties);
        const variationId = instance.id;

        const variationValues = {
          ...variantDefinition,
        };

        data.previews[variationId] = {
          title: instance.id,
          url: '',
          values: variationValues,
        } as OptionalPreviewRender;
      }
    }

    const html = data.previews['generic'] ? await buildPreview(id, template, data.previews['generic'], data) : '';
    // Generate a set of previews without the inspection field wrappers
    injectFieldWrappers = false;
    for (const previewKey in data.previews) {
      data.previews[previewKey].url = id + `-${previewKey}.html`;
      previews[previewKey] = await buildPreview(id, template, data.previews[previewKey], data);
      const publicFile = path.resolve(outputPath, id + '-' + previewKey + '.html');
      await fs.writeFile(publicFile, previews[previewKey]);
    }
    // Generate a set of previews with the inspection field wrappers suffixed with -inspect
    injectFieldWrappers = true;
    for (const previewKey in data.previews) {
      data.previews[previewKey].url = id + `-${previewKey}.html`;
      previews[previewKey] = await buildPreview(id, template, data.previews[previewKey], data);
      const publicFile = path.resolve(outputPath, id + '-' + previewKey + '-inspect.html');
      await fs.writeFile(publicFile, previews[previewKey]);
    }

    data.preview = '';
    data.code = trimPreview(template);
    data.html = trimPreview(html);

    // discard shared styles from the css output
  } catch (e) {
    console.log(e);
    // write the preview to the public folder
    throw new Error('stop');
  }
  return data;
};

const buildPreview = async (id: string, template: string, preview: OptionalPreviewRender, data: TransformComponentTokensResult) => {
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });

  const rendered = await prettier.format(
    Handlebars.compile(template)({
      style: `<link rel="stylesheet" href="/api/component/shared.css"><link rel="stylesheet" href="/api/component/${id}.css">\n<link rel="stylesheet" href="/assets/css/preview.css">`,
      script: `<script src="/api/component/${id}.js"></script>\n<script src="/assets/js/preview.js"></script><script>var fields = ${JSON.stringify(data.properties)};</script>`,
      properties: preview.values || {},
      fields: ensureIds(data.properties),
    }),
    { parser: 'html' }
  );
  return rendered;
};

const ensureIds = (properties: { [key: string]: SlotMetadata }) => {
  for (const key in properties) {
    properties[key].id = key;
    if (properties[key].items?.properties) {
      ensureIds(properties[key].items.properties);
    }
    if (properties[key].properties) {
      ensureIds(properties[key].properties);
    }
  }
  return properties;
};

export default buildPreviews;
