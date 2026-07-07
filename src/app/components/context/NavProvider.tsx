'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SectionLink } from '../util';

/** Minimal nav entity served by `/api/docs/nav.json` (mirrors the API payload). */
export interface NavEntity {
  id: string;
  title?: string;
  group?: string;
  type?: string;
}

/** The full nav payload: build-time shell + runtime entity lists. */
export interface NavData {
  shell: SectionLink[];
  components: NavEntity[];
  patterns: NavEntity[];
  /** Published component token sets, filling the Tokens › Components slot in registry mode. */
  tokenSets: NavEntity[];
}

interface INavContext {
  nav: NavData | null;
}

const NavContext = createContext<INavContext>({ nav: null });

export const isRegistryMode = process.env.HANDOFF_RUNTIME_MODE === 'registry';

// Module-level cache + in-flight guard. Because `_app` is not remounted across client-side (soft)
// navigations, the provider's state already survives them; the module cache additionally dedupes
// concurrent/StrictMode mounts and is reset only on a full page reload — so newly published entities
// appear on hard refresh ("load once, reuse until hard refresh").
let cachedNav: NavData | null = null;
let inFlight: Promise<NavData | null> | null = null;

const loadNav = (): Promise<NavData | null> => {
  if (cachedNav) return Promise.resolve(cachedNav);
  if (inFlight) return inFlight;
  inFlight = fetch(`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/docs/nav.json`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data: NavData | null) => {
      if (data) cachedNav = data;
      return cachedNav;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
};

/**
 * Loads the registry navigation (shell + entities) ONCE and caches it across soft navigations.
 *
 * Mounted in `_app.tsx` above the page tree so its state is not remounted when the page `Component`
 * swaps on client-side navigation — that is what makes the cache survive soft nav and reset only on
 * hard refresh. The side nav and header consume it via {@link useNavContext}; in workspace/static
 * mode they fall back to the build-time baked menu props instead.
 */
export const NavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nav, setNav] = useState<NavData | null>(cachedNav);

  useEffect(() => {
    if (!isRegistryMode || nav) {
      return;
    }
    let active = true;
    loadNav().then((data) => {
      if (active && data) setNav(data);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <NavContext.Provider value={{ nav }}>{children}</NavContext.Provider>;
};

export const useNavContext = (): INavContext => useContext(NavContext);

/**
 * Resolve the top-level menu (header/mobile nav) for the active runtime: in registry mode the
 * cached shell (the per-page baked menu is empty for lambda-rendered pages), falling back to the
 * baked menu until the shell loads; in workspace/static the build-time baked menu. Centralizes the
 * `isRegistry ? shell : baked` choice the header nav components used to each repeat.
 */
export const useResolvedMenu = (fallbackMenu?: SectionLink[]): SectionLink[] | undefined => {
  const { nav } = useNavContext();
  return isRegistryMode ? nav?.shell ?? fallbackMenu : fallbackMenu;
};
