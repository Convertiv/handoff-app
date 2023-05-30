import config from './client-config';
import type { Config } from './client-config';
import type { ChangelogRecord } from './figma-exporter/src/changelog';
import type { PreviewJson } from 'figma-exporter/src/types';
import elements from './exported/tokens.json';
import changelog from './exported/changelog.json';
import preview from './exported/preview.json';

export const getConfig = () => {
  // Check to see if there is a config in the root of the project
  const parsed = { ...config, ...elements } as unknown as Config;
  return parsed;
};

export const getChangelog = () => (changelog || []) as unknown as ChangelogRecord[];

export const getPreview = () => (preview || []) as unknown as PreviewJson;
