import Mustache from 'mustache';
import { parse } from 'node-html-parser';
import { DocumentationObject, ComponentDefinitionOptions } from '../../types';
import { filterOutNull } from '../../utils/index';
import { getComponentTemplate } from './utils';
import { ComponentInstance } from '../../exporters/components/types';
import { TokenSets } from '../../exporters/components/types';
import { TransformComponentTokensResult } from './types';
import Handoff from '../../index';
import path from 'path';
import fs from 'fs-extra';
import sass from 'sass';
import { bundleJSWebpack } from '../../utils/preview';
import chalk from 'chalk';

type GetComponentTemplateByComponentIdResult = string | null;

function mergeTokenSets(tokenSetList: TokenSets): { [key: string]: any } {
  const obj: { [key: string]: any } = {};

  tokenSetList.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'name') {
        obj[key] = value;
      }
    });
  });

  return obj;
}

const getComponentTemplateByComponentId = async (
  handoff: Handoff,
  componentId: string,
  component: ComponentInstance
): Promise<GetComponentTemplateByComponentIdResult> => {
  const parts: string[] = [];

  component.variantProperties.forEach(([_, value]) => parts.push(value));

  return await getComponentTemplate(handoff, componentId, parts);
};

/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = async (
  handoff: Handoff,
  componentId: string,
  component: ComponentInstance
): Promise<TransformComponentTokensResult> => {
  if (!handoff) {
    throw Error('Handoff not initialized');
  }

  if (!handoff.config.integration) {
    return null;
  }

  const template = await getComponentTemplateByComponentId(handoff, componentId, component);

  if (!template) {
    return null;
  }

  const renderableComponent: Record<string, any> = { variant: {}, parts: {} };

  component.variantProperties.forEach(([variantProp, value]) => {
    renderableComponent.variant[variantProp] = value;
  });

  if (component.parts) {
    Object.keys(component.parts).forEach((part) => {
      renderableComponent.parts[part] = mergeTokenSets(component.parts![part]);
    });
  }

  let preview = Mustache.render(template, renderableComponent);

  if (handoff.config.app.base_path) {
    preview = preview.replace(/(?:href|src|ref)=["']([^"']+)["']/g, (match, capturedGroup) => {
      return match.replace(capturedGroup, handoff.config.app.base_path + capturedGroup);
    });
  }

  const bodyEl = parse(preview).querySelector('body');

  return {
    id: component.id,
    preview,
    code: bodyEl ? bodyEl.innerHTML.trim() : preview,
  };
};

/**
 * Transforms the documentation object components into a preview and code
 */
export default async function previewTransformer(handoff: Handoff, documentationObject: DocumentationObject) {
  const { components } = documentationObject;
  const componentIds = Object.keys(components);

  const result = await Promise.all(
    componentIds.map(async (componentId) => {
      return [
        componentId,
        await Promise.all(
          documentationObject.components[componentId].instances.map((instance) => {
            return transformComponentTokens(handoff, componentId, instance);
          })
        ).then((res) => res.filter(filterOutNull)),
      ] as [string, TransformComponentTokensResult[]];
    })
  );

  // Allow a user to create custom previews by putting templates in a snippets folder
  // Iterate over the html files in that folder and render them as a preview
  const custom = path.resolve(handoff.workingPath, `integration/snippets`);

  const publicPath = path.resolve(handoff.workingPath, `public/snippets`);
  // ensure public path exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }
  if (fs.existsSync(custom)) {
    console.log(chalk.green(`Rendering Snippet Previews in ${custom}`));
    const files = fs.readdirSync(custom);
    for (const file of files) {
      if (file.endsWith('.html')) {
        console.log(chalk.green(`Processing snippet ${file}`));
        let data: TransformComponentTokensResult = {
          id: file,
          preview: '',
          code: '',
          js: null,
          css: null,
          sass: null,
        };
        // Is there a JS file with the same name?
        const jsFile = file.replace('.html', '.js');
        if (fs.existsSync(path.resolve(custom, jsFile))) {
          console.log(chalk.green(`Detected JS file for ${file}`));
          try {
            const jsPath = path.resolve(custom, jsFile);
            const js = await fs.readFile(jsPath, 'utf8');
            const compiled = await bundleJSWebpack(jsPath, handoff, 'development');
            if (js) {
              data['js'] = js;
              data['jsCompiled'] = compiled;
            }
          } catch (e) {
            console.log(chalk.red(`Error compiling JS for ${file}`));
            console.log(e);
          }
        }
        // Is there a scss file with the same name?
        const scssFile = file.replace('.html', '.scss');
        const scssPath = path.resolve(custom, scssFile);
        const cssFile = file.replace('.html', '.css');
        const cssPath = path.resolve(custom, cssFile);

        if (fs.existsSync(scssPath) && !fs.existsSync(cssPath)) {
          console.log(chalk.green(`Detected SCSS file for ${file}`));
          try {
            const result = await sass.compileAsync(scssPath, {
              loadPaths: [
                path.resolve(handoff.workingPath, 'integration/sass'),

                path.resolve(handoff.workingPath, 'node_modules'),
                path.resolve(handoff.workingPath),
              ],
            });
            if (result.css) {
              // @ts-ignore
              data['css'] = result.css;
            }
          } catch (e) {
            console.log(chalk.red(`Error compiling SCSS for ${file}`));
            console.log(e);
          }

          const scss = await fs.readFile(scssPath, 'utf8');
          if (scss) {
            data['sass'] = scss;
          }
        }
        // Is there a css file with the same name?
        if (fs.existsSync(cssPath)) {
          const css = await fs.readFile(path.resolve(custom, cssFile), 'utf8');
          if (css) {
            data['css'] = css;
          }
        }
        const template = await fs.readFile(path.resolve(custom, file), 'utf8');
        const preview = Mustache.render(template, {
          config: handoff.config,
          style: data['css'] ? `<style rel="stylesheet" type="text/css">${data['css']}</style>` : '',
          script: data['jsCompiled']
            ? `<script src="data:text/javascript;base64,${Buffer.from(data['jsCompiled']).toString('base64')}"></script>`
            : '',
        });

        try {
          const bodyEl = parse(preview).querySelector('body');
          const code = bodyEl ? bodyEl.innerHTML.trim() : preview;
          data['preview'] = preview;
          data['code'] = code;
        } catch (e) {
          console.log(e);
        }
        // write the preview to the public folder
        const publicFile = path.resolve(publicPath, file);
        await fs.writeFile(publicFile, preview);
        await fs.writeFile(publicFile.replace('.html', '.json'), JSON.stringify(data, null, 2));
        // Create a result preview object
        //result.push([file.replace('.html', ''), [data]]);
      }
    }
  }

  let previews = result.reduce((obj, el) => {
    obj[el[0]] = el[1];
    return obj;
  }, {} as { [key: string]: TransformComponentTokensResult[] });

  return {
    components: previews,
  };
}
