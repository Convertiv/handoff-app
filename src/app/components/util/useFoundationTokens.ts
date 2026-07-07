'use client';

import { useEffect, useState } from 'react';
import type { Types as CoreTypes } from 'handoff-core';

/**
 * Client-side hydration for foundation token pages.
 *
 * Foundation routes are static, so their `getStaticProps` data is build-time only — which is empty in
 * a registry build (no local `tokens.json`). In registry mode this hook fetches the mutable token data
 * from the docs read API on mount (mirroring `NavProvider`'s client fetch), so a publish surfaces
 * without a rebuild/redeploy. In workspace/static mode it returns the build-time props unchanged.
 */

const isRegistry = process.env.HANDOFF_RUNTIME_MODE === 'registry';
const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

export interface FoundationTokensState {
  design: CoreTypes.IDocumentationObject['localStyles'];
  css: string;
  scss: string;
  styleDictionary: string;
  types: string;
}

const emptyDesign = (): CoreTypes.IDocumentationObject['localStyles'] =>
  ({ color: [], typography: [], effect: [] }) as CoreTypes.IDocumentationObject['localStyles'];

export const useFoundationTokens = (
  type: 'colors' | 'typography' | 'effects',
  initial: Partial<FoundationTokensState>
): FoundationTokensState => {
  const [state, setState] = useState<FoundationTokensState>({
    design: initial.design ?? emptyDesign(),
    css: initial.css ?? '',
    scss: initial.scss ?? '',
    styleDictionary: initial.styleDictionary ?? '',
    types: initial.types ?? '',
  });

  useEffect(() => {
    if (!isRegistry) {
      return;
    }
    let active = true;
    fetch(`${basePath}/api/docs/tokens/foundations/${type}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) {
          return;
        }
        setState((prev) => ({
          design: { ...prev.design, ...(data.design ?? {}) },
          css: data.css ?? '',
          scss: data.scss ?? '',
          styleDictionary: data.styleDictionary ?? '',
          types: data.types ?? '',
        }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [type]);

  return state;
};
