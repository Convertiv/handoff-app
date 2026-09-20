'use client';

import { useCallback, useEffect, useState } from 'react';

/** One connection as `/api/ai/connections` reports it. Never carries a key, only whether one is set. */
export interface AiConnection {
  id: string;
  label: string;
  baseUrl?: string;
  models?: string[];
  credential: 'service' | 'user' | 'none';
  configured: boolean;
}

export interface AiConnectionsState {
  /** Every `<connectionId>/<model>` this reader can run right now, in declaration order. */
  models: { id: string; label: string; model: string }[];
  defaultModel: string | null;
  /** Whether this deployment has an account page where a reader can add a key. */
  canAddKeys: boolean;
  loading: boolean;
  /** The request failed, rather than succeeding with nothing usable. */
  failed: boolean;
}

const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

/**
 * The models the assistant may offer. Loaded once the modal is first opened rather than on every
 * page, so a reader who never asks a question pays nothing for the feature.
 */
export const useAiConnections = (active: boolean): AiConnectionsState => {
  const [state, setState] = useState<AiConnectionsState>({
    models: [],
    defaultModel: null,
    canAddKeys: false,
    loading: true,
    failed: false,
  });

  const load = useCallback(async () => {
    const response = await fetch(`${basePath}/api/ai/connections`, { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error('unavailable');
    const body = (await response.json()) as { connections: AiConnection[]; defaultModel: string | null; canAddKeys: boolean };
    setState({
      models: body.connections
        .filter((connection) => connection.configured)
        .flatMap((connection) =>
          (connection.models ?? []).map((model) => ({ id: `${connection.id}/${model}`, label: connection.label, model }))
        ),
      defaultModel: body.defaultModel,
      canAddKeys: body.canAddKeys,
      loading: false,
      failed: false,
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    let live = true;
    void load().catch(() => {
      if (live) setState((current) => ({ ...current, loading: false, failed: true }));
    });
    return () => {
      live = false;
    };
  }, [active, load]);

  return state;
};
