import type { CollectionMcpOptions, ScreenAccess, ScreenNavOptions, ToolScope } from './define';

/** The build's description of the declared screens, baked into the app as `generated/screens.json`. */

export interface CollectionMeta {
  name: string;
  version: number;
  mcp: false | Required<CollectionMcpOptions>;
}

export interface ToolMeta {
  name: string;
  scope: ToolScope;
}

export interface ScreenMeta {
  title: string;
  description?: string;
  icon?: string;
  nav: Required<ScreenNavOptions>;
  access: Required<ScreenAccess>;
  /** `true` for every path, or the path patterns shown without the docs header. See `ScreenOptions.fullscreen`. */
  fullscreen: boolean | string[];
}

export interface ScreenManifestEntry extends ScreenMeta {
  id: string;
  collections: CollectionMeta[];
  tools: ToolMeta[];
  /** Needs API routes, so a static export leaves it out. */
  needsServer: boolean;
}

export interface ScreensManifest {
  /** Label of the top-nav item. */
  title: string;
  screens: ScreenManifestEntry[];
}
