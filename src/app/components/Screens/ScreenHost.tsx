'use client';

import type { ScreenDefinition } from '@handoff/screens/define';
import { CircleAlert, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';
import { screenLoaders } from '@/generated/screens.client';
import { ScreenContext, useSession } from '../../lib/screens/client/context';
import { isFullscreenPath, isScreenAvailable, type ScreenManifestEntry } from '../../lib/screens/manifest';
import { Loading } from './primitives';

const Message: React.FC<{ icon: React.ReactNode; title: string; children?: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="flex h-full items-center justify-center p-8">
    <div className="flex max-w-md flex-col items-center gap-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="text-sm font-semibold">{title}</p>
      {children && <div className="text-[13px] text-muted-foreground">{children}</div>}
    </div>
  </div>
);

/** Keeps a failing screen inside its own area, so the header and nav keep working. */
class ScreenErrorBoundary extends React.Component<{ children: React.ReactNode; screenId: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(`Screen "${this.props.screenId}" failed to render.`, error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Message icon={<CircleAlert className="h-5 w-5 text-destructive" />} title="This screen failed to render.">
        <pre className="mt-2 text-left font-mono text-xs whitespace-pre-wrap">{this.state.error.message}</pre>
      </Message>
    );
  }
}

const Access: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSession();
  const router = useRouter();
  if (session.status === 'loading') return <Loading />;
  if (session.mode === 'registry' && !session.user) {
    return (
      <Message icon={<Lock className="h-5 w-5" />} title="Sign in to use this screen.">
        <Link className="underline" href={`/login?callbackUrl=${encodeURIComponent(router.asPath)}`}>
          Sign in
        </Link>
      </Message>
    );
  }
  if (!session.canRead) return <Message icon={<Lock className="h-5 w-5" />} title="Your role cannot open this screen." />;
  return <>{children}</>;
};

/** Loads a screen's UI chunk and renders it with its route params, after the access check. */
export const ScreenHost: React.FC<{ screen: ScreenManifestEntry }> = ({ screen }) => {
  const router = useRouter();
  const [definition, setDefinition] = React.useState<ScreenDefinition | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const path = router.query.path;
  const pathKey = Array.isArray(path) ? path.join('/') : (path ?? '');
  const params = React.useMemo(() => (pathKey ? pathKey.split('/') : []), [pathKey]);

  React.useEffect(() => {
    const load = screenLoaders[screen.id];
    if (!load) {
      setError('This build has no code for the screen. Rebuild the docs app.');
      return;
    }
    let active = true;
    load()
      .then((module) => {
        const value = module.default as ScreenDefinition | undefined;
        if (!active) return;
        if (value?.kind !== 'handoff-screen' || typeof value.component !== 'function') {
          setError("The screen's index.tsx must default-export defineScreen({ title, component }).");
        } else {
          setDefinition(value);
        }
      })
      .catch((failure: Error) => active && setError(failure.message));
    return () => {
      active = false;
    };
  }, [screen.id]);

  const context = React.useMemo(() => ({ screen, params, fullscreen: isFullscreenPath(screen, params) }), [screen, params]);

  if (!isScreenAvailable(screen)) {
    return (
      <Message icon={<Lock className="h-5 w-5" />} title="This screen needs a running docs app.">
        It stores data or offers assistant tools, which a static export cannot serve.
      </Message>
    );
  }
  if (error)
    return (
      <Message icon={<CircleAlert className="h-5 w-5 text-destructive" />} title="This screen could not load.">
        {error}
      </Message>
    );
  if (!definition || !router.isReady) return <Loading />;

  const Screen = definition.component;
  return (
    <ScreenContext.Provider value={context}>
      <ScreenErrorBoundary screenId={screen.id}>
        <Access>
          <Screen />
        </Access>
      </ScreenErrorBoundary>
    </ScreenContext.Provider>
  );
};
