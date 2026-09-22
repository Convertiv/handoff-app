'use client';

import { Chat, useChat, type UseChatHelpers } from '@ai-sdk/react';
import { DefaultChatTransport, isDynamicToolUIPart, isToolUIPart, type UIMessage, type UIMessagePart } from 'ai';
import * as React from 'react';

const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

const TRANSCRIPT_KEY = 'handoff:ai:transcript';
const MODEL_KEY = 'handoff:ai:model';

/** A transcript past this size is dropped, so one long answer cannot fill the storage quota. */
const MAX_TRANSCRIPT_BYTES = 512 * 1024;

/** Each token postpones the write, so only a settled answer reaches storage. */
const SAVE_DELAY_MS = 400;

/**
 * Whether a stored part is safe to send back to the model.
 *
 * The transcript is written while an answer is in flight, so it can hold a call with an input and
 * no output. A provider rejects a call with no matching result, and one of those in a restored
 * conversation breaks every question after it.
 */
const isSettledPart = (part: UIMessagePart<never, never>): boolean => {
  // MCP tools reach the agent as dynamic tools, so their parts carry `dynamic-tool` and not
  // `tool-<name>`. Check both or this matches none of the app's own calls.
  if (!isToolUIPart(part) && !isDynamicToolUIPart(part)) return true;
  return (
    part.state === 'output-error' ||
    part.state === 'output-denied' ||
    part.state === 'approval-responded' ||
    (part.state === 'output-available' && part.preliminary !== true)
  );
};

/** A message still worth restoring once the unsettled parts are gone. */
const hasContent = (message: UIMessage): boolean =>
  message.role === 'user' ||
  message.parts.some(
    (part) =>
      (part.type === 'text' && part.text.trim().length > 0) || part.type === 'source-url' || isToolUIPart(part) || isDynamicToolUIPart(part)
  );

const readTranscript = (): UIMessage[] => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(TRANSCRIPT_KEY) ?? 'null');
    if (!Array.isArray(stored)) return [];
    return (stored as UIMessage[]).map((message) => ({ ...message, parts: message.parts.filter(isSettledPart) })).filter(hasContent);
  } catch {
    return [];
  }
};

const writeTranscript = (messages: UIMessage[]): void => {
  try {
    const payload = JSON.stringify(messages);
    // Drop the older transcript too: the reader must not return to a conversation that stops halfway.
    if (messages.length === 0 || payload.length > MAX_TRANSCRIPT_BYTES) window.localStorage.removeItem(TRANSCRIPT_KEY);
    else window.localStorage.setItem(TRANSCRIPT_KEY, payload);
  } catch {
    /* empty */
  }
};

const readModel = (): string | null => {
  try {
    return window.localStorage.getItem(MODEL_KEY);
  } catch {
    return null;
  }
};

const writeModel = (model: string): void => {
  try {
    window.localStorage.setItem(MODEL_KEY, model);
  } catch {
    /* empty */
  }
};

/**
 * The live conversation, owned here and not by a component.
 *
 * `useChat` discards everything it owns when its component goes, and the panel does unmount. An
 * instance held here outlives that, and an answer that still streams keeps arriving into it.
 *
 * Created on first use, never at import: a module-scope chat on the server would be shared by every
 * request.
 */
let chat: Chat<UIMessage> | null = null;
const listeners = new Set<() => void>();

const createChat = (messages: UIMessage[]): Chat<UIMessage> =>
  new Chat<UIMessage>({
    messages,
    transport: new DefaultChatTransport({ api: `${basePath}/api/ai/chat`, credentials: 'include' }),
  });

const getChat = (): Chat<UIMessage> => (chat ??= createChat(readTranscript()));

const subscribe = (onChange: () => void): (() => void) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};

export interface AiChat extends UseChatHelpers<UIMessage> {
  /** The model this reader picked, kept across reloads. `null` until the connections load. */
  model: string | null;
  chooseModel: (model: string) => void;
  /** Replace the conversation with an empty one. */
  startFresh: () => void;
}

export const useAiChat = (): AiChat => {
  // Every caller must land on the same instance, including after a reset. Component state would
  // give each a copy, and the one that did not call `startFresh` would keep reporting on the
  // conversation the reader just cleared.
  const instance = React.useSyncExternalStore(subscribe, getChat, getChat);
  const [model, setModel] = React.useState<string | null>(readModel);
  const helpers = useChat<UIMessage>({ chat: instance });
  const { messages } = helpers;

  React.useEffect(() => {
    const timer = window.setTimeout(() => writeTranscript(messages), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [messages]);

  /**
   * A replacement instance also settles an answer that still streams: the discarded chat is aborted
   * and keeps whatever the transport wrote midway. Clearing the list in place races that write.
   *
   * The chosen model survives, because the reader already did the work to pick one.
   */
  const startFresh = React.useCallback(() => {
    chat = createChat([]);
    writeTranscript([]);
    listeners.forEach((onChange) => onChange());
  }, []);

  const chooseModel = React.useCallback((next: string) => {
    writeModel(next);
    setModel(next);
  }, []);

  return { ...helpers, model, chooseModel, startFresh };
};
