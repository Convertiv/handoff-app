import fs from 'fs-extra';
import path from 'path';
import Handoff from '.';
import type { DocumentComponentsObject } from './exporters/components';
import type { ColorObject, TypographyObject, AssetObject, EffectObject } from './types';

export interface ImageStyle {
  name: string;
  style: string;
  height: number;
  width: number;
  description: string;
}

export interface Integration {
  name: string;
  version: string;
}

export interface FigmaSearch {
  options: {
    shared: {
      defaults: {
        theme: string;
        state: string;
        type: string;
        activity: string;
        layout: string;
        size: string;
      };
    };
    transformer: {
      replace: {
        size: {
          [key: string]: string;
          small: string;
          medium: string;
          large: string;
        };
      };
    };
  };
  definitions: string[];
}

export interface ComponentSizeMap {
  figma: string;
  css: string;
}

export interface ExportResult {
  design: {
    color: ColorObject[];
    effect: EffectObject[];
    typography: TypographyObject[];
  };
  components: DocumentComponentsObject;
  assets: {
    icons: AssetObject[];
    logos: AssetObject[];
  };
}

export interface Config {
  dev_access_token?: string | null | undefined;
  figma_project_id?: string | null | undefined;
  buildApp?: boolean;
  title: string;
  client: string;
  google_tag_manager: string | null | undefined;
  integration?: Integration;
  favicon?: string;
  poweredBy?: boolean;
  figma?: FigmaSearch;
  /**
   * @default "/logo.svg"
   */
  logo?: string;
  type_sort: string[];
  type_copy: string;
  color_sort: string[];
  component_sort: string[];
  /**
   * @default { icons: "/icons.zip", logos: "/logos.zip" }
   */
  assets_zip_links?: {
    /**
     * @default "/icons.zip"
     */
    icons?: string;
    /**
     * @default "/logos.zip"
     */
    logos?: string;
  };
}

export const defaultConfig: Config = {
  dev_access_token: null,
  figma_project_id: null,
  title: 'Convertiv Design System',
  client: 'Convertiv',
  buildApp: true,
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
  if (global.handoff && global.handoff.config) {
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

export const getHandoff = (): Handoff => {
  if (global.handoff) {
    return global.handoff;
  }
  // check for a serialized version
  const handoff = deserializeHandoff();
  if (handoff) {
    global.handoff = handoff;
    return handoff;
  }
  throw Error('Handoff not initialized');
};
/**
 * Serialize the handoff to the working directory
 */
export const serializeHandoff = () => {
  const handoff = getHandoff();
  fs.writeFileSync(path.join(handoff.workingPath, 'exported', 'handoff.state.json'), JSON.stringify(handoff));
};

/**
 * Deserialize the handoff from the working directory
 * @returns
 */
export const deserializeHandoff = () => {
  const statePath = path.join(process.cwd(), 'exported', 'handoff.state.json');
  if (fs.existsSync(statePath)) {
    const stateBuffer = fs.readFileSync(statePath);
    const state = JSON.parse(stateBuffer.toString());
    return state;
  }
  throw Error('Handoff cannot be deserialized');
};
