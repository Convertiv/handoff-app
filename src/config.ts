import fs from 'fs-extra';
import path from 'path';
import Handoff from '.';
import { ClientConfig, Config } from './types/config';

export interface ImageStyle {
  name: string;
  style: string;
  height: number;
  width: number;
  description: string;
}

export const defaultConfig = (): Config => ({
  dev_access_token: process.env.HANDOFF_DEV_ACCESS_TOKEN ?? null,
  figma_project_id: process.env.HANDOFF_FIGMA_PROJECT_ID ?? null,
  exportsOutputDirectory: process.env.HANDOFF_OUTPUT_DIR ?? 'exported',
  sitesOutputDirectory: process.env.HANDOFF_SITES_DIR ?? 'out',
  app: {
    theme: 'default',
    title: 'Convertiv Design System',
    client: 'Convertiv',
    google_tag_manager: null,
    attribution: true,
    type_copy: 'Almost before we knew it, we had left the ground.',
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
    color_sort: ['primary', 'secondary', 'extra', 'system'],
    component_sort: ['primary', 'secondary', 'transparent'],
    base_path: '',
  },
  figma: {
    options: {
      shared: {
        defaults: {
          Theme: 'light',
          State: 'default',
          Type: 'default',
          Activity: '',
          Layout: '',
          Size: '',
        },
      },
      transformer: {
        replace: {
          State: {
            default: '',
          },
          Size: {
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
  use_legacy_definitions: (process.env.HANDOFF_USE_FIGMA_PLUGIN ?? '').toLowerCase() === 'false',
});

/**
 * Get the configuration formatted for the client, either from the root of the project or from the default config.
 * @returns Promise<Config>
 */
export const getClientConfig = (configOverride?: any): ClientConfig => {
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

  const { app, figma, exportsOutputDirectory, sitesOutputDirectory, assets_zip_links, use_legacy_definitions } = {
    ...defaultConfig(),
    ...config,
  } as unknown as Config;

  return {
    app,
    figma,
    exportsOutputDirectory,
    sitesOutputDirectory,
    assets_zip_links: assets_zip_links ?? { icons: null, logos: null },
    use_legacy_definitions
  };
};