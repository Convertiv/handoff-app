'use client';

import type { NavData, SectionLink } from '@handoff/nav';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type { NavData, NavEntity } from '@handoff/nav';

interface INavContext {
  nav: NavData;
  currentSectionId: string;
}

const EMPTY_NAV: NavData = { shell: [] };
const NavContext = createContext<INavContext>({ nav: EMPTY_NAV, currentSectionId: '' });
const isRegistryMode = process.env.HANDOFF_RUNTIME_MODE === 'registry';

// A module-level fulfilled cache and in-flight guard make the registry refresh a single hard-load
// operation, including StrictMode remounts. A browser hard reload resets both and observes publishes.
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

export const NavProvider: React.FC<{
  children: React.ReactNode;
  initialNav?: NavData;
  currentSectionId?: string;
}> = ({ children, initialNav = EMPTY_NAV, currentSectionId = '' }) => {
  // Registry alone owns refresh state. Workspace renders the latest page prop directly, so soft
  // navigation cannot briefly expose the preceding page's tree and triggers no provider effect.
  const [registryNav, setRegistryNav] = useState<NavData>(() => cachedNav ?? initialNav);

  useEffect(() => {
    if (!isRegistryMode || cachedNav) return;
    let active = true;
    loadNav().then((data) => {
      if (active && data) setRegistryNav(data);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nav = isRegistryMode ? registryNav : initialNav;
  return <NavContext.Provider value={{ nav, currentSectionId }}>{children}</NavContext.Provider>;
};

/** The sole view-facing navigation API: one active tree and an exact-match active section. */
export const useNav = (): { nav: NavData; menu: SectionLink[]; current: SectionLink | null } => {
  const { nav, currentSectionId } = useContext(NavContext);
  return {
    nav,
    menu: nav.shell,
    current: nav.shell.find((section) => section.path === currentSectionId) ?? null,
  };
};
