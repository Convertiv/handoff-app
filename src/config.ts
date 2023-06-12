import type { Config } from './types/config';
import fs from 'fs';
import path from 'path';

export const defaultConfig: Config = {
  dev_access_token: null,
  figma_project_id: null,
  title: 'Convertiv Design System',
  client: 'Convertiv',
  google_tag_manager: null,
  integration: {
    name: 'bootstrap',
    version: '5.2',
  },
  favicon: '/favicon.ico',
  logo: '/logo.svg',
  poweredBy: true,
  type_sort: [
    'Heading 1',
    'Heading 2',
    'Heading 3',
    'Heading 4',
    'Heading 5',
    'Heading 6',
    'Paragraph',
    'Subheading',
    'Blockquote',
    'Input Labels',
    'Link',
  ],
  figma: {
    options: {
      shared: {
        defaults: {
          theme: 'light',
          state: 'default',
          type: 'default',
          activity: '',
          layout: '',
          size: '',
        },
      },
      transformer: {
        replace: {
          size: {
            small: 'sm',
            medium: 'md',
            large: 'lg',
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
  type_copy: 'Almost before we knew it, we had left the ground.',
  color_sort: ['primary', 'secondary', 'extra', 'system'],
  component_sort: ['primary', 'secondary', 'transparent'],
};

/**
 * Get the config, either from the root of the project or from the default config
 * @returns Promise<Config>
 */
export const getConfig = (): Config => {
  if(global.handoff && global.handoff.config) {
    return global.handoff.config;
  }
  // Check to see if there is a config in the root of the project
  let config = {},
    configPath = path.resolve(process.cwd(), 'client-config.json');
  if (fs.existsSync(configPath)) {
    const defBuffer = fs.readFileSync(configPath);
    config = JSON.parse(defBuffer.toString()) as Config;
  }
  return { ...defaultConfig, ...config } as unknown as Config;
};
