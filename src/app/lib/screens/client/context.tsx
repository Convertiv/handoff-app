'use client';

import type { ScreenRole } from '@handoff/screens/define';
import type { ScreenRoute, ScreenSession, UseAssistantContext, UseScreenRoute, UseSession } from '@handoff/screens/client-api';
import { useSession as useNextAuthSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import * as React from 'react';
import { setScreenAssistantContext } from '../events';
import { screenRoute, type ScreenManifestEntry } from '../manifest';

/** The screen being shown and its path segments. The screen route provides it. */
export interface ScreenContextValue {
  screen: ScreenManifestEntry;
  params: string[];
  /** The path shows without the docs header. */
  fullscreen: boolean;
}

export const ScreenContext = React.createContext<ScreenContextValue | null>(null);

export const useScreenContext = (): ScreenContextValue => {
  const context = React.useContext(ScreenContext);
  if (!context) throw new Error('Screen hooks work only inside a screen component rendered by the docs app.');
  return context;
};

const isRegistry = process.env.HANDOFF_RUNTIME_MODE === 'registry';
const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

export const useScreenRoute: UseScreenRoute = () => {
  const router = useRouter();
  const { screen, params } = useScreenContext();
  return React.useMemo<ScreenRoute>(() => {
    const href = (next: string[]) => `${screenRoute(screen.id)}${next.length ? `/${next.map(encodeURIComponent).join('/')}` : ''}/`;
    return {
      screenId: screen.id,
      params,
      href,
      url: (next) => `${typeof window === 'undefined' ? '' : window.location.origin}${basePath}${href(next)}`,
      // Shallow: the screen keeps its state and only its params change.
      navigate: (next, options) =>
        void router[options?.replace ? 'replace' : 'push'](href(next), undefined, { shallow: true, scroll: false }),
    };
  }, [router, screen.id, params]);
};

const roleAllows = (role: ScreenRole, required: ScreenRole): boolean => required === 'member' || role === 'admin';

const WORKSPACE_SESSION: ScreenSession = { mode: 'workspace', user: null, canRead: true, canWrite: true, status: 'ready' };

const useWorkspaceSession: UseSession = () => WORKSPACE_SESSION;

const useRegistrySession: UseSession = () => {
  const { screen } = useScreenContext();
  const { data, status } = useNextAuthSession();
  const user = data?.user as { id?: string; name?: string | null; email?: string | null; role?: ScreenRole } | undefined;
  return React.useMemo<ScreenSession>(() => {
    if (!user?.id)
      return { mode: 'registry', user: null, canRead: false, canWrite: false, status: status === 'loading' ? 'loading' : 'ready' };
    const role = user.role === 'admin' ? 'admin' : 'member';
    const canRead = roleAllows(role, screen.access.read);
    return {
      mode: 'registry',
      user: { id: user.id, name: user.name ?? null, email: user.email ?? null, role },
      canRead,
      canWrite: canRead && roleAllows(role, screen.access.write),
      status: 'ready',
    };
  }, [user?.id, user?.name, user?.email, user?.role, status, screen.access.read, screen.access.write]);
};

// The session provider is mounted only in registry mode, so the mode picks the hook once, at load.
export const useSession: UseSession = isRegistry ? useRegistrySession : useWorkspaceSession;

export const useAssistantContext: UseAssistantContext = (value) => {
  const key = value ? JSON.stringify(value) : null;
  React.useEffect(() => {
    setScreenAssistantContext(key ? JSON.parse(key) : null);
  }, [key]);
  React.useEffect(() => () => setScreenAssistantContext(null), []);
};
