'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, getToolOrDynamicToolName, isDynamicToolUIPart, isToolUIPart, type UIMessage } from 'ai';
import { ArrowUp, ArrowUpRight, ExternalLink, Square, SquarePen } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '../../lib/utils';
import { MarkdownComponents } from '../Markdown/MarkdownComponents';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
 * The panel keeps a fixed height and does not grow with the transcript. A panel that resizes on
 * every streamed token moves the composer while the reader types.
 */
const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

/**
 * The composer grows with the question up to this many pixels, then scrolls. A taller one leaves the
 * transcript no room.
 */
const COMPOSER_MAX_HEIGHT = 128;

/** Every page and component the tools read during this answer, deduplicated across its parts. */
const sourcesOf = (message: UIMessage): { url: string; title: string }[] => {
  const seen = new Map<string, string>();
  for (const part of message.parts) {
    if (part.type === 'source-url' && !seen.has(part.url)) seen.set(part.url, part.title ?? part.url);
  }
  return [...seen].map(([url, title]) => ({ url, title }));
};

const AnswerMark: React.FC<{ busy?: boolean }> = ({ busy = false }) => (
  <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md p-px">
    {busy ? <AiEdge motion="always" /> : <span aria-hidden="true" className="absolute inset-0 bg-border" />}
    <span className="relative flex h-full w-full items-center justify-center rounded-[5px] bg-background">
      <AiMark className="h-3 w-3" />
    </span>
  </span>
);

/**
 * A call that is still in flight carries a moving highlight. That highlight is the only progress
 * signal the transport gives before the output arrives.
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
              // Tailwind Typography puts literal backticks around inline code with `::before` and
              // `::after`. The assistant hits this in almost every answer, because it answers about
              // props and token names. Wide output, such as a props table, scrolls inside the answer
              // and does not widen the panel.
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
              A new tab, although these are pages of this same site. The conversation lives in the
              dialog and nowhere else, so a source opened in place throws the answer away.
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
 * The transport opens the assistant's message as soon as the request is accepted. That message first
 * carries only bookkeeping parts, such as `step-start`, which show nothing. An answer in that state
 * draws an avatar above an empty column, so the transcript leaves it out until it has content.
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
  // One mark at a time. The waiting row stands in for the answer until the answer has a first tool
  // call or a first token of its own.
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

/** Takes the place of the conversation when no model is reachable for this reader. */
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

  // `useChat` builds a new `Chat` each time its `id` changes. The transcript, the error and the
  // status stay with the discarded instance.
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
   * Start a new conversation without a page reload.
   *
   * A close of the panel keeps the transcript on purpose, so a reader who opens it again still has
   * the last answer. This control is the only way to clear one.
   *
   * A replacement chat also settles an answer that still streams: `useChat` aborts the instance it
   * discards, and that instance keeps whatever the transport wrote midway. An in-place clear of the
   * message list races that write.
   *
   * The chosen model survives, because the reader already did the work to pick one.
   */
  const startFresh = () => {
    setConversation((current) => current + 1);
    setInput('');
    composerRef.current?.focus();
  };

  // A reset control on an empty panel is noise, and an error outlives the messages that caused it.
  const canStartFresh = messages.length > 0 || Boolean(error);

  // The composer is a textarea, so a long question wraps and does not scroll sideways. A textarea
  // has no automatic height, so it needs a measurement after every change.
  React.useLayoutEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = 'auto';
    composer.style.height = `${Math.min(composer.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [input]);

  // Follow the answer as it streams. The scroll waits one frame: the panel is portalled and
  // animated, so on the open that mounts it, the transcript has no scroll height yet.
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
        {/* The assistant's signature: the one line of color on an otherwise monochrome surface. */}
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
              A soft chip and not an outlined box. It shares this corner with the close control, and
              two competing rectangles there read as a toolbar that the header does not have.
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
                <span className="px-1.5 text-xs text-muted-foreground">
                  {connections.models[0] ? `${connections.models[0].label} · ${connections.models[0].model}` : ''}
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
