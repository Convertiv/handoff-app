import fs from 'fs-extra';
import path from 'path';
import Handoff from '.';
import { Config } from './types/config';

export interface ImageStyle {
  name: string;
  style: string;
  height: number;
  width: number;
  description: string;
}

export const defaultConfig = (): Config => ({
  dev_access_token: process.env.DEV_ACCESS_TOKEN ?? null,
  figma_project_id: process.env.FIGMA_PROJECT_ID ?? null,
  integration: {
    name: 'bootstrap',
    version: '5.3',
  },
  app: {
    theme: 'default',
    title: 'Convertiv Design System',
    client: 'Convertiv',
    google_tag_manager: null,
    attribution: true,
    type_copy: 'Almost before we knew it, we had left the ground.',
    type_sort: ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Heading 5', 'Heading 6', 'Paragraph', 'Subheading', 'Blockquote', 'Input Labels', 'Link'],
    color_sort: ['primary', 'secondary', 'extra', 'system'],
    component_sort: ['primary', 'secondary', 'transparent'],
    base_path: '',
  },
  figma: {
    options: {
      shared: {
        defaults: {
          'Theme': 'light',
          'State': 'default',
          'Type': 'default',
          'Activity': '',
          'Layout': '',
          'Size': '',
        },
      },
      transformer: {
        replace: {
          'State': {
            'default': '',
          },
          'Size': {
            'small': 'sm',
            'medium': 'md',
            'large': 'lg',
          },
        },
      },
    },
    definitions: [
      'components/alert',
      'components/button',
      'components/modal',
      'components/tooltip',
      'components/checkbox',
      'components/input',
      'components/radio',
      'components/select',
      'components/switch',
    ],
  },
});

/**
 * Get the config, either from the root of the project or from the default config
 * @returns Promise<Config>
 */
export const getConfig = (configOverride?: any): Config => {
  // if (global.handoff && global.handoff.config) {
  //   return global.handoff.config;
  // }
  // Check to see if there is a config in the root of the project
  let config = {};
  let configPath = path.resolve(process.cwd(), 'handoff.config.json');

  if (fs.existsSync(configPath)) {
    const defBuffer = fs.readFileSync(configPath);
    config = JSON.parse(defBuffer.toString()) as Config;
  }

  if (configOverride) {
    config = { ...config, ...configOverride };
  }

  const result = { ...defaultConfig(), ...config } as unknown as Config;

  // Anonymize the configuration!
  delete result.figma_project_id;
  delete result.dev_access_token;

  return result;
};
/**
 * Get the handoff from the global scope
 * @returns Handoff
 */
export const getHandoff = (): Handoff => {
  // if (global.handoff) {
  //   return global.handoff;
  // }
  // check for a serialized version
  const handoff = deserializeHandoff();
  if (handoff) {
    // global.handoff = handoff;
    return handoff;
  }
  throw Error('Handoff not initialized');
};
/**
 * Serialize the handoff to the working directory
 */
export const serializeHandoff = (handoff: Handoff) => {
  const outputPath = path.resolve(handoff.workingPath, handoff.outputDirectory, handoff.config.figma_project_id);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(path.resolve(outputPath), { recursive: true });
  }
  const statePath = path.resolve(outputPath, 'handoff.state.json');
  fs.writeFileSync(statePath, JSON.stringify(handoff));
};

/**
 * Deserialize the handoff from the working directory
 * @returns
 */
export const deserializeHandoff = () => {
  const statePath = process.env.HANDOFF_EXPORT_PATH ? path.resolve(process.env.HANDOFF_EXPORT_PATH, 'handoff.state.json') : path.resolve(process.cwd(), process.env.OUTPUT_DIR ?? 'exported', 'handoff.state.json');
  if (fs.existsSync(statePath)) {
    const stateBuffer = fs.readFileSync(statePath);
    const state = JSON.parse(stateBuffer.toString());
    return state;
  }
  throw Error('Handoff cannot be deserialized');
};
