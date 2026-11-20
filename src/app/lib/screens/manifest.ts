import type { ScreenManifestEntry, ScreensManifest } from '@handoff/screens/manifest';
import manifestJson from '@/generated/screens.json';

// Client-safe: the nav, the landing route and the API routes all read the baked manifest.

export type { ScreenManifestEntry, ScreensManifest };

export const screensManifest = manifestJson as unknown as ScreensManifest;

/** A static export has no API routes, so a screen with collections or tools cannot work there. */
const isStaticExport = process.env.HANDOFF_BUILD_TARGET === 'static';

export const SCREENS_ROUTE = '/screens';

export const screenRoute = (id: string): string => `${SCREENS_ROUTE}/${encodeURIComponent(id)}`;

export const isScreenAvailable = (screen: ScreenManifestEntry): boolean => !(isStaticExport && screen.needsServer);

export const findScreen = (id: string | undefined | null): ScreenManifestEntry | undefined =>
  id ? screensManifest.screens.find((screen) => screen.id === id) : undefined;

/** Whether the screen shows these path segments without the docs header. `*` in a pattern matches any one segment. */
export const isFullscreenPath = (screen: ScreenManifestEntry, params: string[]): boolean => {
  if (typeof screen.fullscreen === 'boolean') return screen.fullscreen;
  return screen.fullscreen.some((pattern) => {
    const segments = pattern ? pattern.split('/') : [];
    return segments.length === params.length && segments.every((segment, index) => segment === '*' || segment === params[index]);
  });
};

/** Screens listed in the nav and on the landing route. */
export const listedScreens = (): ScreenManifestEntry[] =>
  screensManifest.screens.filter((screen) => !screen.nav.hidden && isScreenAvailable(screen));

export const isScreensPath = (pathname: string): boolean => pathname === SCREENS_ROUTE || pathname.startsWith(`${SCREENS_ROUTE}/`);
