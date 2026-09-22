'use client';

import { getToolOrDynamicToolName, isDynamicToolUIPart, isToolUIPart, type UIMessage } from 'ai';
import { ArrowUp, ArrowUpRight, Square, SquarePen } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn, stripBasePath } from '../../lib/utils';
import { MarkdownComponents } from '../Markdown/MarkdownComponents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AiEdge, AiMark } from './AiMark';
import { toolCallLabel } from './toolLabel';
import { useAiChat } from './useAiChat';
import { useAiConnections } from './useAiConnections';

/**
 * The docs assistant: a conversation with the design system, grounded in the same records the MCP
 * tools return.
 *
 * The conversation alone. {@link AiAssistantPanel} decides where it sits and passes that frame's
 * controls in through `controls`. The messages live in {@link useAiChat}, above both, so they
 * outlast a page navigation, a collapse to the rail and a reload.
 */

/** Openers that name what the assistant can reach, because the tools answer from this catalog. */
const STARTERS = ['What components are in this design system?', 'Which color tokens are defined?', 'What typography styles are available?'];

const COMPOSER_MAX_HEIGHT = 128;

/** Within this distance of the end, the transcript follows the answer. Past it, the reader reads. */
const FOLLOW_THRESHOLD_PX = 48;

/** Every page and component the tools read during this answer, deduplicated across its parts. */
const sourcesOf = (message: UIMessage): { url: string; title: string }[] => {
  const seen = new Map<string, string>();
  for (const part of message.parts) {
    if (part.type === 'source-url' && !seen.has(part.url)) seen.set(part.url, part.title ?? part.url);
  }
  return [...seen].map(([url, title]) => ({ url, title }));
};

/**
/**
 * A page of this app, not a file it serves. A rendered preview and an API route share the origin,
 * and the router answers a soft navigation to either with its 404 page.
 */
const isPageRoute = (pathname: string): boolean => !/\.[a-z0-9]+$/i.test(pathname) && !/(^|\/)api\//.test(pathname);

/**
 * The route on this site an href points at, or `null` where it leaves the site. An answer can carry
 * an absolute URL back to this same site, and that has to travel by soft navigation too.
 */
const internalRoute = (href: string): string | null => {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || !isPageRoute(url.pathname)) return null;
    return stripBasePath(`${url.pathname}${url.search}${url.hash}`);
  } catch {
    // A `mailto:` or any other scheme with no origin of its own.
    return null;
  }
};

/**
 * `react-markdown` renders a plain anchor, which reloads the app and restarts the panel holding the
 * answer. A route on this site goes through `next/link` instead, so only the page beside the
 * assistant changes. A link off this site keeps its new tab, because leaving would take the
 * conversation with it.
 */
const AnswerLink: React.FC<{ href?: string; children?: React.ReactNode }> = ({ href, children }) => {
  const route = href && !href.startsWith('#') ? internalRoute(href) : null;
  if (route) return <Link href={route}>{children}</Link>;
  return (
    <a href={href} target={href?.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">
      {children}
    </a>
  );
};

const AnswerMarkdown = { ...MarkdownComponents, a: AnswerLink };

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
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={AnswerMarkdown}>
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
              A source opens in place: the conversation outlives the navigation, so the reader lands
              on the page the answer came from with the answer still beside it.
            */}
            {sources.map((source) => (
              <Link
                key={source.url}
                href={stripBasePath(source.url)}
                className="hover:border-ai-via/50 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowUpRight className="h-3 w-3" />
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
      (part.type === 'text' && part.text.trim().length > 0) || part.type === 'source-url' || isToolUIPart(part) || isDynamicToolUIPart(part)
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
            <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-muted px-3.5 py-2 text-sm text-foreground">
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

const EmptyState: React.FC<{ onPick: (text: string) => void }> = ({ onPick }) => (
  <div className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center px-2 py-10 text-center">
    <AiMark className="mb-5 h-9 w-9" />
    <h3 className="text-lg font-medium tracking-tight">What do you want to explore?</h3>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Ask about the components, tokens and guidance published here.</p>
    <div className="mt-7 flex w-full flex-wrap justify-center gap-2">
      {STARTERS.map((starter) => (
        <button
          key={starter}
          type="button"
          onClick={() => onPick(starter)}
          className="focus-visible:ring-ai-via/50 outline-hidden inline-flex min-h-9 max-w-full items-center rounded-full border border-border/60 bg-muted/30 px-3.5 py-1.5 text-center text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground focus-visible:ring-2"
        >
          {starter}
        </button>
      ))}
    </div>
  </div>
);

/** Takes the place of the conversation when no model is reachable for this reader. */
const Unavailable: React.FC<{ canAddKeys: boolean; failed: boolean }> = ({ canAddKeys, failed }) => (
  <div className="flex h-full flex-col items-center justify-center px-2 py-10 text-center">
    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted/50">
      <AiMark className="h-6 w-6 text-muted-foreground" muted />
    </span>
    <h3 className="text-base font-medium">{canAddKeys ? 'Add a provider key' : 'The assistant is unavailable'}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
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

export const AiConversation: React.FC<{ active: boolean; controls?: React.ReactNode }> = ({ active, controls }) => {
  const [input, setInput] = React.useState('');
  const connections = useAiConnections(active);
  const composerRef = React.useRef<HTMLTextAreaElement>(null);
  const transcriptRef = React.useRef<HTMLDivElement>(null);
  // A reader who scrolled up to an earlier answer must not be pulled back down by the next token.
  const following = React.useRef(true);

  const { messages, sendMessage, status, stop, error, model, chooseModel, startFresh } = useAiChat();

  // The picker follows the deployment's default until the reader chooses, and falls back to the
  // first usable model so a deployment whose default is not usable here still answers.
  const usable = (id: string | null) => Boolean(id) && connections.models.some((entry) => entry.id === id);
  const selectedModel =
    (usable(model) ? model : usable(connections.defaultModel) ? connections.defaultModel : connections.models[0]?.id) ?? null;

  const busy = status === 'submitted' || status === 'streaming';
  const hasModel = connections.models.length > 0;

  const ask = (text: string) => {
    if (!text.trim() || busy || !selectedModel) return;
    setInput('');
    following.current = true;
    void sendMessage({ text: text.trim() }, { body: { model: selectedModel } });
    composerRef.current?.focus();
  };

  // A reset control on an empty panel is noise, and an error outlives the messages that caused it.
  const canStartFresh = messages.length > 0 || Boolean(error);

  /**
   * A turn that ended with no text at all.
   *
   * The transport reports it as an ordinary completion, so without this the panel draws the tool
   * rows and stops, which reads like a request that is still running. A conversation long enough to
   * overrun the model's context window is the usual cause, and only the reader can act on that.
   */
  const lastMessage = messages[messages.length - 1];
  const answeredNothing =
    !busy &&
    !error &&
    lastMessage?.role === 'assistant' &&
    !lastMessage.parts.some((part) => part.type === 'text' && part.text.trim().length > 0);

  // The composer is a textarea, so a long question wraps and does not scroll sideways. A textarea
  // has no automatic height, so it needs a measurement after every change.
  React.useLayoutEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = 'auto';
    composer.style.height = `${Math.min(composer.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [input]);

  // The scroll waits one frame: the transcript has no scroll height on the render that reveals it.
  React.useEffect(() => {
    if (!active || !following.current) return;
    const frame = requestAnimationFrame(() => {
      const transcript = transcriptRef.current;
      if (transcript) transcript.scrollTop = transcript.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [active, messages, status]);

  const onTranscriptScroll = () => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    following.current = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < FOLLOW_THRESHOLD_PX;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="h-17 flex shrink-0 items-center justify-between gap-2 px-3 shadow-[0_1px_0_var(--color-border)]">
        <h2 className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
          <AiMark className="h-4 w-4 shrink-0" />
          <span className="truncate">Ask the design system</span>
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          {/*
            A soft chip and not an outlined box. It shares this corner with the panel's own controls,
            and competing rectangles there read as a toolbar that the header does not have.
          */}
          {canStartFresh && (
            <button
              type="button"
              onClick={() => {
                startFresh();
                setInput('');
                composerRef.current?.focus();
              }}
              title="New conversation"
              className="group flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-muted/60 pl-2 pr-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <SquarePen className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-12" />
              New
            </button>
          )}
          {controls}
        </div>
      </div>

      <div ref={transcriptRef} onScroll={onTranscriptScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {messages.length > 0 ? (
          <Conversation messages={messages} thinking={busy} />
        ) : connections.loading ? null : hasModel ? (
          <EmptyState onPick={ask} />
        ) : (
          <Unavailable canAddKeys={connections.canAddKeys} failed={connections.failed} />
        )}
        {answeredNothing && (
          <p className="mt-4 text-sm text-muted-foreground">
            The model stopped without writing an answer. A long conversation is the usual cause, so starting a new one often helps.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-destructive">{error.message}</p>}
      </div>

      <div className="shrink-0 border-t px-3 py-3">
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
            className="outline-hidden block w-full resize-none bg-transparent px-3.5 pb-1 pt-3 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            {connections.models.length > 1 ? (
              <Select value={selectedModel ?? undefined} onValueChange={chooseModel}>
                <SelectTrigger className="h-7 w-auto min-w-0 gap-1 border-0 px-1.5 text-xs text-muted-foreground shadow-none">
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
              <span className="truncate px-1.5 text-xs text-muted-foreground">
                {connections.models[0] ? `${connections.models[0].label} · ${connections.models[0].model}` : ''}
              </span>
            )}
            {busy ? (
              <button
                type="button"
                onClick={() => void stop()}
                title="Stop"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground"
              >
                <Square className="h-3 w-3 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                title="Ask"
                disabled={!input.trim() || !hasModel}
                className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg p-px transition-opacity disabled:opacity-40"
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
    </div>
  );
};
