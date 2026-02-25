import fs from 'fs-extra';
import type { DocAnnotation, TypeNode } from 'handoff-docgen';
import path from 'path';
import sass from 'sass';
import Handoff from '../../index';
import { Logger } from '../../utils/logger';
import writeComponentSummaryAPI, { getAPIPath } from './component/api';
import processComponents from './component/builder';
import { buildMainCss } from './component/css';
import { buildMainJS } from './component/javascript';

export interface ComponentMetadata {
  title: string;
  type?: string;
  group?: string;
  description: string;
  properties: { [key: string]: SlotMetadata };
}

export enum SlotType {
  // Primitives
  TEXT = 'text',
  STRING = 'string',
  RICHTEXT = 'richtext',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  COLOR = 'color',

  // Selection
  SELECT = 'select',
  ENUM = 'enum',

  // Semantic types with object value shapes
  IMAGE = 'image',
  LINK = 'link',
  BUTTON = 'button',
  VIDEO = 'video',

  // Structural types
  ARRAY = 'array',
  OBJECT = 'object',

  // Escape hatches
  FUNCTION = 'function',
  ANY = 'any',
}

export type SelectOption = string | { value: string; label: string };

export interface SlotMetadata {
  id?: string;
  name: string;
  description?: string;
  generic?: string;
  default?: any;
  type: SlotType;
  options?: SelectOption[];
  items?: {
    type: SlotType;
    name?: string;
    properties?: { [key: string]: SlotMetadata };
  };
  properties?: { [key: string]: SlotMetadata };
  key?: string;
  rules?: RuleObject;
  docgenType?: string;
  deepType?: TypeNode;
  typeRefs?: string[];
  warnings?: string[];
  annotations?: DocAnnotation[];
}

export type RuleObject = {
  required?: boolean;
  content?: {
    min: number;
    max: number;
  };
  dimensions?: {
    width?: number;
    height?: number;
    min?: {
      width: number;
      height: number;
    };
    max?: {
      width: number;
      height: number;
    };
    recommend?: {
      width: number;
      height: number;
    };
  };
  filesize?: number;
  filetype?: string;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
};

export const getComponentOutputPath = (handoff: Handoff) => path.resolve(getAPIPath(handoff), 'component');
/**
 * Create a component transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export async function componentTransformer(handoff: Handoff) {
  const componentData = await processComponents(handoff);
  await writeComponentSummaryAPI(handoff, componentData);
  await buildMainJS(handoff);
  await buildMainCss(handoff);
}

/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
export async function processSharedStyles(handoff: Handoff): Promise<string | null> {
  const custom = path.resolve(handoff.workingPath, `integration/components`);
  const publicPath = path.resolve(handoff.workingPath, `public/api/component`);

  // Is there a scss file with the same name?
  const scssPath = path.resolve(custom, 'shared.scss');
  const cssPath = path.resolve(custom, 'shared.css');

  if (fs.existsSync(scssPath) && !fs.existsSync(cssPath)) {
    Logger.success(`Compiling shared styles`);
    try {
      const result = await sass.compileAsync(scssPath, {
        loadPaths: [
          path.resolve(handoff.workingPath, 'integration/sass'),
          path.resolve(handoff.workingPath, 'node_modules'),
          path.resolve(handoff.workingPath),
          path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId()),
        ],
      });

      if (result.css) {
        // write the css to the public folder
        const css = '/* These are the shared styles used in every component. */ \n\n' + result.css;
        const cssPath = path.resolve(publicPath, 'shared.css');
        Logger.success(`Writing shared styles to ${cssPath}`);
        await fs.writeFile(cssPath, result.css);
        return css;
      }
    } catch (e) {
      Logger.error(`Error compiling shared styles`, e);
    }
  } else if (fs.existsSync(cssPath)) {
    const css = await fs.readFile(cssPath, 'utf8');
    return css;
  }
}
