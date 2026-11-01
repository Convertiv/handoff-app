import Router from 'next/router';
import type { MouseEvent } from 'react';

import { stripBasePath } from './utils';

// The CSS lives in `css/index.css` under `data-depth`.

type Depth = 'deeper' | 'shallower';

export const PREVIEW_STAGE_TRANSITION = 'preview-stage';

const VIEW_READY_EVENT = 'handoff:view-ready';

const MAX_WAIT_MS = 700;

const EDITOR_ROUTE = /^\/system\/component\/([^/]+)\/previews\/[^/]+\/?$/;
const COMPONENT_ROUTE = /^\/system\/component\/([^/]+)\/?$/;

const pathOf = (url: string): string => url.split(/[?#]/)[0];

export const depthBetween = (from: string, to: string): Depth | null => {
  const source = pathOf(from);
  const target = pathOf(to);
  const intoEditor = EDITOR_ROUTE.exec(target);
  const fromComponent = COMPONENT_ROUTE.exec(source);
  if (intoEditor && fromComponent && intoEditor[1] === fromComponent[1]) return 'deeper';
  const outOfEditor = EDITOR_ROUTE.exec(source);
  const toComponent = COMPONENT_ROUTE.exec(target);
  if (outOfEditor && toComponent && outOfEditor[1] === toComponent[1]) return 'shallower';
  return null;
};

export const markViewReady = (): void => {
  window.dispatchEvent(new Event(VIEW_READY_EVENT));
};

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void> } };

const canAnimate = (): boolean =>
  typeof document !== 'undefined' &&
  typeof (document as ViewTransitionDocument).startViewTransition === 'function' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Waits for the page's view-ready event too: both pages fetch the component after mounting.
const whenRendered = (): Promise<void> =>
  new Promise((resolve) => {
    let routed = false;
    let ready = false;
    const finish = () => {
      window.clearTimeout(timer);
      Router.events.off('routeChangeComplete', onRouted);
      Router.events.off('routeChangeError', finish);
      window.removeEventListener(VIEW_READY_EVENT, onReady);
      resolve();
    };
    const onRouted = () => {
      routed = true;
      if (ready) finish();
    };
    const onReady = () => {
      ready = true;
      if (routed) finish();
    };
    const timer = window.setTimeout(finish, MAX_WAIT_MS);
    Router.events.on('routeChangeComplete', onRouted);
    Router.events.on('routeChangeError', finish);
    window.addEventListener(VIEW_READY_EVENT, onReady);
  });

const transition = (depth: Depth, navigate: () => void): void => {
  if (!canAnimate()) {
    navigate();
    return;
  }
  const root = document.documentElement;
  root.dataset.depth = depth;
  // Listen first: on back and forward, Next is already navigating.
  const rendered = whenRendered();
  const view = (document as ViewTransitionDocument).startViewTransition!(() => {
    navigate();
    return rendered;
  });
  view.finished.finally(() => delete root.dataset.depth);
};

export const navigateWithDepth = (href: string, options: { replace?: boolean } = {}): void => {
  const go = () => void (options.replace ? Router.replace(href) : Router.push(href));
  const depth = depthBetween(Router.asPath, href);
  if (depth) transition(depth, go);
  else go();
};

export const followWithDepth = (event: MouseEvent<HTMLAnchorElement>): void => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const href = event.currentTarget.getAttribute('href');
  const route = href ? stripBasePath(href) : null;
  if (!route || !depthBetween(Router.asPath, route)) return;
  event.preventDefault();
  navigateWithDepth(route);
};

/** Returning `false` keeps the page; the guard must restore its URL itself. */
let popStateGuard: (() => boolean) | null = null;

// Next allows only one `beforePopState` handler, so pages register their guard here.
export const guardPopState = (guard: () => boolean): (() => void) => {
  popStateGuard = guard;
  return () => {
    if (popStateGuard === guard) popStateGuard = null;
  };
};

export const installDepthPopState = (): (() => void) => {
  Router.beforePopState(({ as }) => {
    if (popStateGuard && !popStateGuard()) return false;
    const depth = depthBetween(Router.asPath, as);
    if (depth && canAnimate()) transition(depth, () => undefined);
    return true;
  });
  return () => Router.beforePopState(() => true);
};
