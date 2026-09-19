import { fromEnv } from './from-env';
import { resolveRegistryConnection } from '../registry/connection';
import { ClientConfig, Config, ResolvedConfig } from '../types/config';

export interface ImageStyle {
  name: string;
  style: string;
  height: number;
  width: number;
  description: string;
}

/** Whether the MCP endpoint is served. On unless `runtime.mcp` is explicitly `false`. */
export const isMcpEnabled = (config: Pick<Config, 'runtime'> | Pick<ResolvedConfig, 'runtime'> | null | undefined): boolean =>
  config?.runtime?.mcp !== false;

export const defaultConfig = (): Config => ({
  dev_access_token: fromEnv('HANDOFF_DEV_ACCESS_TOKEN', { default: null }),
  figma_project_id: fromEnv('HANDOFF_FIGMA_PROJECT_ID', { default: null }),
  runtime: {
    mode: 'workspace',
    registryConnection: {
      url: fromEnv('HANDOFF_REGISTRY_URL', { default: '' }),
      accessToken: fromEnv('HANDOFF_REGISTRY_ACCESS_TOKEN', { default: '' }),
    },
    registry: {
      databaseUrl: fromEnv('DATABASE_URL'),
      assetStorage: { token: fromEnv('BLOB_READ_WRITE_TOKEN') },
    },
  },
  exportsOutputDirectory: fromEnv('HANDOFF_OUTPUT_DIR', { default: 'exported' }),
  sitesOutputDirectory: fromEnv('HANDOFF_SITES_DIR', { default: 'out' }),
  useVariables: fromEnv('HANDOFF_USE_VARIABLES', { default: false }),
  reactDocgen: {
    maxDepth: 7,
    excludeDirectories: ['dist', 'build', '.next'],
  },
  app: {
    theme: 'default',
    title: 'Handoff Design System',
    client: 'Handoff',
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
      app: fromEnv('HANDOFF_APP_PORT', { default: 3000 }),
      websocket: fromEnv('HANDOFF_WEBSOCKET_PORT', { default: 3001 }),
    },
  },
});

/**
 * Retrieves the client configuration from the provided handoff configuration.
 *
 * @param config - The full handoff Config object.
 * @returns The client configuration object.
 */
export const getClientConfig = (config: ResolvedConfig): ClientConfig => {
  const {
    app,
    exportsOutputDirectory,
    sitesOutputDirectory,
    assets_zip_links = { icons: null, logos: null },
    useVariables,
    runtime,
  } = config;

  const mode = runtime?.mode ?? 'workspace';
  // Connected-workspace affordance: only a workspace with a resolvable registry URL is "connected".
  // URL-only threshold (no token required) so the publish hint surfaces before the access token is
  // set. Never project the URL/token value itself — only this boolean crosses to the browser.
  const connected = mode === 'workspace' && Boolean(resolveRegistryConnection(config).url);

  return {
    app,
    exportsOutputDirectory,
    sitesOutputDirectory,
    assets_zip_links,
    useVariables,
    runtime: {
      mode,
      connected,
    },
  };
};
