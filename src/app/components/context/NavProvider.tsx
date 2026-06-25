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
}

interface INavContext {
  nav: NavData | null;
}

const NavContext = createContext<INavContext>({ nav: null });

// Registry mode is the only mode that resolves nav from the live read API; workspace/static keep the
// build-time baked per-page menu props and this provider stays inert (no fetch). Read from the baked
// env so it is available on the client without per-page props.
const isRegistry = process.env.HANDOFF_RUNTIME_MODE === 'registry';

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
    if (!isRegistry || nav) {
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
