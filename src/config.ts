import * as fs from 'fs-extra';
import path from 'path';
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
  useVariables: Boolean(process.env.HANDOFF_USE_VARIABLES) ?? false,
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
    breakpoints: {
      mobile: { size: 400, name: 'Mobile' },
      tablet: { size: 800, name: 'Medium' },
      desktop: { size: 1100, name: 'Large' },
    },
  },
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

  const {
    app,
    exportsOutputDirectory,
    sitesOutputDirectory,
    assets_zip_links = { icons: null, logos: null },
    useVariables,
  } = { ...defaultConfig(), ...config };

  return {
    app,
    exportsOutputDirectory,
    sitesOutputDirectory,
    assets_zip_links,
    useVariables,
  };
};
