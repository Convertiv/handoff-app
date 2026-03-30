import { startCase } from 'lodash';
import { OptionalPreviewRender } from '../preview/types';

export type StoryObject = {
  name?: string;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
  render?: (args: Record<string, any>) => any;
};

export type CsfMeta = {
  title?: string;
  component?: any;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
  render?: (args: Record<string, any>) => any;
};

export function getCsfStoryEntries(moduleExports: Record<string, any>): Array<[string, StoryObject]> {
  return Object.entries(moduleExports).filter(([key, value]) => {
    if (key === 'default' || key === '__esModule') return false;
    if (typeof value === 'function') return true;
    if (value && typeof value === 'object') return true;
    return false;
  }) as Array<[string, StoryObject]>;
}

export function createCsfStoryPreviews(
  moduleExports: Record<string, any>
): Record<string, OptionalPreviewRender> {
  const meta = (moduleExports.default || {}) as CsfMeta;
  const stories = getCsfStoryEntries(moduleExports);
  const previews: Record<string, OptionalPreviewRender> = {};

  for (const [storyKey, storyValue] of stories) {
    const storyObj = (typeof storyValue === 'function' ? {} : storyValue) as StoryObject;
    previews[storyKey] = {
      title: storyObj.name || startCase(storyKey),
      values: {
        ...(meta.args || {}),
        ...(storyObj.args || {}),
      },
      url: '',
    };
  }

  return previews;
}
