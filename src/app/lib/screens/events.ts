'use client';

/**
 * Browser-side links between a screen and the assistant. They live in separate trees under `_app`,
 * so they share state here, not through context. Client-safe: no server imports.
 */

/** A screen document that a tool wrote. `revision: 0` means it was deleted. */
export interface ChangedDocument {
  screen: string;
  collection: string;
  id: string;
  revision: number;
}

const SCREEN_CHANGE_EVENT = 'handoff:screen-documents-changed';

export const announceScreenChanges = (changed: ChangedDocument[]): void => {
  if (typeof window === 'undefined' || changed.length === 0) return;
  window.dispatchEvent(new CustomEvent<ChangedDocument[]>(SCREEN_CHANGE_EVENT, { detail: changed }));
};

export const onScreenChanges = (listener: (changed: ChangedDocument[]) => void): (() => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<ChangedDocument[]>).detail);
  window.addEventListener(SCREEN_CHANGE_EVENT, handler);
  return () => window.removeEventListener(SCREEN_CHANGE_EVENT, handler);
};

/** What a screen told the assistant it has open (`useAssistantContext`). Sent with each question. */
let assistantContext: Record<string, unknown> | null = null;

export const setScreenAssistantContext = (value: Record<string, unknown> | null): void => {
  assistantContext = value;
};

export const getScreenAssistantContext = (): Record<string, unknown> | null => assistantContext;
