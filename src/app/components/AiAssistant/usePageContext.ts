'use client';

import type { NavMenuItem, SectionLink } from '@handoff/nav';
import { useRouter } from 'next/router';
import * as React from 'react';

import { pageRefFromPath, type AiPageKind } from '../../lib/ai/context';
import { normalizePathForMatch, stripBasePath } from '../../lib/utils';
import { useNav } from '../context/NavProvider';

/** The page a question can be asked about: its route as the server reads it, and its nav title. */
export interface AiPage {
  path: string;
  kind: AiPageKind;
  title: string;
}

/** A route with no base path, query, fragment or trailing slash, so nav paths and the router compare. */
const routeOf = (href: string): string => `/${normalizePathForMatch(href)}`;

/** Every titled route in the nav. The first title found for a route wins, as the side nav shows it first. */
const collectTitles = (sections: SectionLink[]): Map<string, string> => {
  const titles = new Map<string, string>();
  const add = (path: string | undefined, title: string) => {
    if (!path || !title) return;
    const route = routeOf(stripBasePath(path));
    if (!titles.has(route)) titles.set(route, title);
  };
  const walk = (items: NavMenuItem[] = []) => {
    for (const item of items) {
      add(item.path, item.title);
      walk(item.menu);
    }
  };
  for (const section of sections) {
    add(section.path, section.title);
    for (const sub of section.subSections) {
      add(sub.path, sub.title);
      walk(sub.menu);
    }
  }
  return titles;
};

/** Nav titles by route, from the data the side nav already holds, so the panel makes no request. */
export const useNavTitles = (): Map<string, string> => {
  const { nav } = useNav();
  return React.useMemo(() => collectTitles(nav.shell), [nav]);
};

/** The current page, or `null` when the route gives no context or is not in the nav. */
export const usePageContext = (): AiPage | null => {
  const { asPath } = useRouter();
  const titles = useNavTitles();
  const path = routeOf(asPath);
  const ref = pageRefFromPath(path);
  const title = titles.get(path);
  return ref && title ? { path, kind: ref.kind, title } : null;
};
