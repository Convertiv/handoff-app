'use client';

import { DefaultChatTransport, getToolOrDynamicToolName, isDynamicToolUIPart, isToolUIPart, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { ArrowUp, ArrowUpRight, ExternalLink, SquarePen, Square } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MarkdownComponents } from '../Markdown/MarkdownComponents';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../../lib/utils';
import { AiEdge, AiMark } from './AiMark';
import { toolCallLabel } from './toolLabel';
import { useAiConnections } from './useAiConnections';

/**
 * The docs assistant: a conversation with the design system, grounded in the same records the MCP
 * tools return.
 *
 * Controlled by {@link AiAssistantProvider}, which owns both the availability gate and the `⌘K`
 * shortcut, so the header and the mobile nav open the same conversation.
 *
 * The panel keeps a fixed height rather than growing with the transcript: a chat that resizes on
 * every streamed token drags the composer around under the reader's hands.
 */
const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

/** Grows with the question up to this many pixels, then scrolls — past it the transcript is gone. */
const COMPOSER_MAX_HEIGHT = 128;

/** Every page and component the tools read during this answer, deduplicated across its parts. */
const sourcesOf = (message: UIMessage): { url: string; title: string }[] => {
  const seen = new Map<string, string>();
  for (const part of message.parts) {
    if (part.type === 'source-url' && !seen.has(part.url)) seen.set(part.url, part.title ?? part.url);
  }
  return [...seen].map(([url, title]) => ({ url, title }));
};

/** The assistant's own avatar, reused by every answer and by the thinking placeholder. */
const AnswerMark: React.FC<{ busy?: boolean }> = ({ busy = false }) => (
  <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md p-px">
    {busy ? <AiEdge motion="always" /> : <span aria-hidden="true" className="absolute inset-0 bg-border" />}
    <span className="relative flex h-full w-full items-center justify-center rounded-[5px] bg-background">
      <AiMark className="h-3 w-3" />
    </span>
  </span>
);

/**
 * One tool call, as a quiet row under the answer. A call still in flight carries a travelling
 * highlight, which is the only progress signal the transport gives us before its output lands.
 */
const ToolRow: React.FC<{ label: string; running: boolean }> = ({ label, running }) => (
  <div
    className={cn(
      'flex w-fit max-w-full items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground',
      running && 'animate-ai-shimmer bg-[linear-gradient(90deg,transparent,hsl(var(--ai-via)/0.18),transparent)] bg-[length:200%_100%]'
    )}
  >
    <AiMark className="h-3 w-3 shrink-0" muted={!running} />
    <span className="truncate">{label}</span>
  </div>
);

const Answer: React.FC<{ message: UIMessage }> = ({ message }) => {
  const sources = sourcesOf(message);

  return (
    <div className="flex gap-3">
      <AnswerMark />
      <div className="min-w-0 flex-1 space-y-2">
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              // Typography's inline code carries literal backticks through `::before`/`::after`,
              // which the assistant hits constantly — it answers about props and token names. Wide
              // output (a props table) scrolls inside the answer rather than widening the panel.
              <div
                key={index}
                className="prose prose-sm max-w-none overflow-x-auto dark:prose-invert prose-code:before:content-none prose-code:after:content-none"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }
          if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
            const running = part.state !== 'output-available' && part.state !== 'output-error';
            return <ToolRow key={index} label={toolCallLabel(getToolOrDynamicToolName(part), part.input)} running={running} />;
          }
          return null;
        })}
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {/*
              A new tab even though these are this site's own pages: the conversation lives in the
              dialog and nowhere else, so following a source in place would throw the answer away to
              read what it cited. The icon has been promising a new tab all along.
            */}
            {sources.map((source) => (
              <Link
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:border-ai-via/50 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                {source.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Whether an answer has anything on screen yet.
 *
 * The transport opens the assistant's message as soon as the request is accepted, carrying only
 * bookkeeping parts (`step-start` and the like) that render to nothing. An answer in that state is
 * an avatar above an empty column, which is the stray mark that used to sit over the waiting row.
 */
const hasAnswerContent = (message: UIMessage): boolean =>
  message.parts.some(
    (part) =>
      (part.type === 'text' && part.text.trim().length > 0) ||
      part.type === 'source-url' ||
      isToolUIPart(part) ||
      isDynamicToolUIPart(part)
  );

const Conversation: React.FC<{ messages: UIMessage[]; thinking: boolean }> = ({ messages, thinking }) => {
  const visible = messages.filter((message) => message.role === 'user' || hasAnswerContent(message));
  // One mark at a time: the waiting row stands in for the answer until the answer has something of
  // its own to show — a first tool call or the first token — and hands over the moment it does.
  const waiting = thinking && visible[visible.length - 1]?.role !== 'assistant';

  return (
    <div className="space-y-5">
      {visible.map((message) =>
        message.role === 'user' ? (
          <div key={message.id} className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-muted px-3.5 py-2 text-sm text-foreground">
              {message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('')}
            </p>
          </div>
        ) : (
          <Answer key={message.id} message={message} />
        )
      )}
      {waiting && (
        <div className="flex items-center gap-3">
          <AnswerMark busy />
          <span className="text-sm text-muted-foreground">Reading the design system…</span>
        </div>
      )}
    </div>
  );
};

/** The first thing a reader sees: what this is, and nothing else to read past it. */
const EmptyState: React.FC = () => (
  <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
    <div className="relative mb-5">
      <span
        aria-hidden="true"
        className="animate-ai-breathe bg-linear-to-r from-ai-from via-ai-via to-ai-to absolute -inset-3 rounded-full opacity-50 blur-xl"
      />
      <span className="shadow-xs relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-background">
        <AiMark className="h-7 w-7" />
      </span>
    </div>
    <h3 className="text-base font-medium">Ask the design system</h3>
    <p className="mt-1.5 max-w-sm text-sm">Answers are drawn from the components, tokens and documentation published here.</p>
  </div>
);

/** Shown instead of the conversation when no model is reachable for this reader. */
const Unavailable: React.FC<{ canAddKeys: boolean; failed: boolean }> = ({ canAddKeys, failed }) => (
  <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted/50">
      <AiMark className="h-6 w-6 text-muted-foreground" muted />
    </span>
    <h3 className="text-base font-medium">{canAddKeys ? 'Add a provider key' : 'The assistant is unavailable'}</h3>
    <p className="mt-1.5 max-w-sm text-sm">
      {failed
        ? 'The list of AI providers could not be loaded.'
        : canAddKeys
          ? 'This site needs your API key before the assistant can answer.'
          : 'No AI provider is configured for this site.'}
    </p>
    {canAddKeys && (
      <Link
        href="/account/ai"
        className="hover:border-ai-via/50 mt-4 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent/50"
      >
        Add a key
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    )}
  </div>
);

export const AiAssistantDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => {
  const [input, setInput] = React.useState('');
  const [model, setModel] = React.useState<string | null>(null);
  const connections = useAiConnections(open);
  const composerRef = React.useRef<HTMLTextAreaElement>(null);
  const transcriptRef = React.useRef<HTMLDivElement>(null);

  // Bumping this is what starts a fresh conversation: `useChat` builds a new `Chat` whenever its
  // `id` changes, so the transcript, the error and the status all belong to the discarded one.
  const [conversation, setConversation] = React.useState(0);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: `docs-assistant-${conversation}`,
    transport: new DefaultChatTransport({ api: `${basePath}/api/ai/chat`, credentials: 'include' }),
  });

  // The picker follows the deployment's default until the reader chooses, and falls back to the
  // first usable model so a deployment whose default is not usable here still answers.
  const selectedModel =
    model ??
    (connections.models.some((entry) => entry.id === connections.defaultModel) ? connections.defaultModel : connections.models[0]?.id) ??
    null;

  const busy = status === 'submitted' || status === 'streaming';
  const hasModel = connections.models.length > 0;

  const ask = (text: string) => {
    if (!text.trim() || busy || !selectedModel) return;
    setInput('');
    void sendMessage({ text: text.trim() }, { body: { model: selectedModel } });
    composerRef.current?.focus();
  };

  /**
   * Drop the conversation and start over, without reloading the page.
   *
   * Closing the panel deliberately keeps the transcript, so a reader who reopens it still has the
   * last answer. That makes this the only way to clear one.
   *
   * Replacing the chat rather than emptying it also settles an answer still streaming: `useChat`
   * aborts the instance it discards, and the discarded instance keeps whatever the transport was
   * midway through writing. Clearing the message list in place would race that write.
   *
   * The chosen model survives, because picking one again is work the reader already did.
   */
  const startFresh = () => {
    setConversation((current) => current + 1);
    setInput('');
    composerRef.current?.focus();
  };

  // A reset control on an empty panel is noise, and an error outlives the messages that caused it.
  const canStartFresh = messages.length > 0 || Boolean(error);

  // The composer is a textarea so a long question wraps instead of scrolling sideways; it has to be
  // measured after every change because there is no intrinsic auto-height.
  React.useLayoutEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = 'auto';
    composer.style.height = `${Math.min(composer.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [input]);

  // Follow the answer as it streams. The scroll is deferred by a frame because the panel is
  // portalled and animated: on the open that mounts it, the transcript has no scroll height yet.
  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const transcript = transcriptRef.current;
      if (transcript) transcript.scrollTop = transcript.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, messages, status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(660px,82vh)] flex-col gap-0 overflow-hidden rounded-xl p-0 shadow-2xl sm:max-w-[720px]">
        {/* The assistant's signature: the one line of colour on an otherwise monochrome surface. */}
        <span aria-hidden="true" className="bg-linear-to-r via-ai-via absolute inset-x-0 top-0 h-px from-transparent to-transparent" />

        <DialogHeader className="shrink-0 space-y-0 border-b px-4 py-2.5 pr-12">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg p-px">
                <AiEdge />
                <span className="relative flex h-full w-full items-center justify-center rounded-[7px] bg-background">
                  <AiMark className="h-3.5 w-3.5" />
                </span>
              </span>
              <span className="truncate">Ask the design system</span>
            </DialogTitle>
            {/*
              A soft chip rather than an outlined box: it shares this corner with the close control,
              and two competing rectangles there read as a toolbar the header does not have. The
              surface is what carries it at rest, so nothing but weight separates it from the title.
            */}
            {canStartFresh && (
              <button
                type="button"
                onClick={startFresh}
                title="New conversation"
                className="group flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-muted/60 pl-2 pr-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <SquarePen className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-12" />
                New
              </button>
            )}
          </div>
          <DialogDescription className="sr-only">
            Answers come from the components, tokens and documentation of this design system.
          </DialogDescription>
        </DialogHeader>

        <div ref={transcriptRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {messages.length > 0 ? (
            <Conversation messages={messages} thinking={busy} />
          ) : connections.loading ? null : hasModel ? (
            <EmptyState />
          ) : (
            <Unavailable canAddKeys={connections.canAddKeys} failed={connections.failed} />
          )}
          {error && <p className="mt-4 text-sm text-destructive">{error.message}</p>}
        </div>

        <div className="shrink-0 border-t px-4 py-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="focus-within:border-ai-via/60 rounded-xl border bg-background transition-colors"
          >
            <textarea
              ref={composerRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends; the modifier keeps the newline, which is what every other chat does.
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              placeholder={hasModel ? 'Ask about a component, token or guideline…' : 'The assistant is unavailable'}
              disabled={!hasModel}
              autoFocus
              className="outline-hidden block w-full resize-none bg-transparent px-3.5 pb-1 pt-3 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              {connections.models.length > 1 ? (
                <Select value={selectedModel ?? undefined} onValueChange={setModel}>
                  <SelectTrigger className="h-7 w-auto gap-1 border-0 px-1.5 text-xs text-muted-foreground shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {connections.models.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id} className="text-xs">
                        {entry.label} · {entry.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="px-1.5 text-xs text-muted-foreground/60">
                  {hasModel ? 'Enter to send · Shift + Enter for a new line' : ''}
                </span>
              )}
              {busy ? (
                <button
                  type="button"
                  onClick={() => void stop()}
                  title="Stop"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  title="Ask"
                  disabled={!input.trim() || !hasModel}
                  className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg p-px transition-opacity disabled:opacity-40"
                >
                  <span aria-hidden="true" className="bg-linear-to-br from-ai-from via-ai-via to-ai-to absolute inset-0 rounded-lg" />
                  <span className="relative flex h-full w-full items-center justify-center rounded-[7px] bg-gray-900 text-white">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
