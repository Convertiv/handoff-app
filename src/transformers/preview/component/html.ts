import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { parse } from 'node-html-parser';
import path from 'path';
import * as prettier from 'prettier';
import Handoff from '../../../index';
import { SlotMetadata } from '../component';
import { OptionalPreviewRender, TransformComponentTokensResult } from '../types';

const trimPreview = (preview: string) => {
  const bodyEl = parse(preview).querySelector('body');
  const code = bodyEl ? bodyEl.innerHTML.trim() : preview;
  return code;
};

const buildPreviews = async (
  data: TransformComponentTokensResult,
  id: string,
  custom: string,
  publicPath: string,
  handoff: Handoff
): Promise<TransformComponentTokensResult> => {
  const template = await fs.readFile(path.resolve(custom, `${id}.hbs`), 'utf8');
  try {
    const previews = {};
    let injectFieldWrappers = false;
    Handlebars.registerHelper('field', function (field, options) {
      if (injectFieldWrappers) {
        return new Handlebars.SafeString(
          `<span class="handoff-field handoff-field-${field?.type ? field.type : 'unknown'}" data-handoff="${encodeURIComponent(JSON.stringify(field))}">` +
            options.fn(this) +
            '</span>'
        );
      } else {
        return options.fn(this);
      }
    });
    const html = data.previews['generic'] ? await buildPreview(id, template, data.previews['generic'], data) : '';
    injectFieldWrappers = true;
    for (const previewKey in data.previews) {
      data.previews[previewKey].url = id + `-${previewKey}.html`;
      previews[previewKey] = await buildPreview(id, template, data.previews[previewKey], data);
      const publicFile = path.resolve(publicPath, id + '-' + previewKey + '.html');
      console.log('Writing preview to', publicFile);
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
  const rendered = await prettier.format(
    Handlebars.compile(template)({
      style: `<link rel="stylesheet" href="/api/component/shared.css"><link rel="stylesheet" href="/api/component/${id}.css"><link rel="stylesheet" href="/api/component/${id}.css">\n<link rel="stylesheet" href="/assets/css/preview.css">`,
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
