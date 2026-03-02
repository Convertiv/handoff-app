import { ClientConfig, Config } from '../types/config';

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
  useVariables: process.env.HANDOFF_USE_VARIABLES === 'true',
  reactDocgen: {
    maxDepth: 7,
    excludeDirectories: ['dist', 'build', '.next'],
  },
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
    ports: {
      app: Number(process.env.HANDOFF_APP_PORT) || 3000,
      websocket: Number(process.env.HANDOFF_WEBSOCKET_PORT) || 3001
    }
  },
});

/**
 * Retrieves the client configuration from the provided handoff configuration.
 *
 * @param config - The full handoff Config object.
 * @returns The client configuration object.
 */
export const getClientConfig = (config: Config): ClientConfig => {
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
