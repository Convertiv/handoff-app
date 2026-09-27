'use client';

import { getToolOrDynamicToolName, isDynamicToolUIPart, isToolUIPart, type UIMessage } from 'ai';
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  CircleAlert,
  Copy,
  FileText,
  Layers,
  LayoutTemplate,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Square,
  SquarePen,
  X,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { stripBasePath } from '../../lib/utils';
import type { AiPageKind } from '../../lib/ai/context';
import { MarkdownComponents } from '../Markdown/MarkdownComponents';
import { Attachment, AttachmentAction, AttachmentContent, AttachmentMedia, AttachmentTitle } from '../ui/attachment';
import { Bubble, BubbleContent } from '../ui/bubble';
import { Button } from '../ui/button';
import { Marker, MarkerContent, MarkerIcon } from '../ui/marker';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../ui/select';
import { toolResultCard } from './AiToolResult';
import { toolCallLabel } from './toolLabel';
import { useAiChat } from './useAiChat';
import { useAiConnections, type AiModelOption } from './useAiConnections';
import { useNavTitles, usePageContext, type AiPage } from './usePageContext';

/**
 * The docs assistant: a conversation with the design system, grounded in the same records the MCP
 * tools return.
 *
 * The conversation alone. {@link AiAssistantPanel} decides where it sits and passes that frame's
 * controls in through `controls`. The messages live in {@link useAiChat}, above both, so they
 * outlast a page navigation, a close and a reload.
 */

/** Openers that name what the assistant can reach, because the tools answer from this catalog. */
const BROWSE_PROMPT = 'What components are in this design system?';
const PROMPT_SUGGESTIONS = [
  'Which color tokens are defined, and what is each one for?',
  'What typography styles are available, and when should I use each?',
  'Which components accept an icon, and how do I pass one?',
];

const COMPOSER_MAX_HEIGHT = 160;

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

/**
 * One tool call as a status row. The spinner is the only progress signal the transport gives before
 * the output arrives.
 */
const ToolRow: React.FC<{ label: string; state: 'running' | 'done' | 'failed' }> = ({ label, state }) => (
  <Marker className="text-xs">
    <MarkerIcon>
      {state === 'running' ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : state === 'failed' ? (
        <CircleAlert className="size-3.5 text-destructive" />
      ) : (
        <Check className="size-3.5" />
      )}
    </MarkerIcon>
    <MarkerContent className="truncate">{label}</MarkerContent>
  </Marker>
);

/** Progress for time that has no tool activity or answer text of its own. */
const Thinking: React.FC = () => (
  <Marker role="status">
    <MarkerIcon>
      <Loader2 className="animate-spin" />
    </MarkerIcon>
    <MarkerContent>Thinking…</MarkerContent>
  </Marker>
);

const hasTextContent = (message: UIMessage): boolean =>
  message.parts.some((part) => part.type === 'text' && part.text.trim().length > 0);

const hasRunningTool = (message: UIMessage): boolean =>
  message.parts.some(
    (part) =>
      (isToolUIPart(part) || isDynamicToolUIPart(part)) && part.state !== 'output-available' && part.state !== 'output-error'
  );

const Answer: React.FC<{ message: UIMessage; waitingForText: boolean }> = ({ message, waitingForText }) => {
  const sources = sourcesOf(message);
  const showThinking = waitingForText && !hasTextContent(message) && !hasRunningTool(message);

  return (
    <Bubble variant="ghost">
      <BubbleContent className="flex w-full flex-col gap-2.5 overflow-visible">
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
            const name = getToolOrDynamicToolName(part);
            const card = part.state === 'output-available' ? toolResultCard(name, part.output) : null;
            const state = part.state === 'output-available' ? 'done' : part.state === 'output-error' ? 'failed' : 'running';
            return (
              <div key={index} className="flex flex-col gap-2">
                <ToolRow label={toolCallLabel(name, part.input)} state={state} />
                {card}
              </div>
            );
          }
          return null;
        })}
        {showThinking && <Thinking />}
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
                className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowUpRight className="h-3 w-3" />
                {source.title}
              </Link>
            ))}
          </div>
        )}
      </BubbleContent>
    </Bubble>
  );
};

/**
 * The transport opens the assistant's message as soon as the request is accepted. That message first
 * carries only bookkeeping parts, such as `step-start`, which show nothing. An answer in that state
 * draws an avatar above an empty column, so the transcript leaves it out until it has content.
 */
const hasAnswerContent = (message: UIMessage): boolean =>
  hasTextContent(message) ||
  message.parts.some((part) => part.type === 'source-url' || isToolUIPart(part) || isDynamicToolUIPart(part));

/** "just now", then minutes, then hours, then a date. Read at render, since precision is not the point. */
const timeAgo = (at: number): string => {
  const seconds = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return new Date(at).toLocaleDateString();
};

/** When the question was sent. Messages saved before this was recorded have none. */
const sentAtOf = (message: UIMessage): number | undefined => {
  const sentAt = (message.metadata as { sentAt?: unknown } | undefined)?.sentAt;
  return typeof sentAt === 'number' ? sentAt : undefined;
};

/** The page the question was asked from. Messages sent without page context have none. */
const pathOf = (message: UIMessage): string | undefined => {
  const path = (message.metadata as { path?: unknown } | undefined)?.path;
  return typeof path === 'string' ? path : undefined;
};

/** The reader's question, with when and where it was sent and a copy action revealed on hover or focus. */
const Question: React.FC<{ message: UIMessage; titles: Map<string, string> }> = ({ message, titles }) => {
  const text = message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('');
  const sentAt = sentAtOf(message);
  const path = pathOf(message);

  return (
    <div className="group flex flex-col items-end gap-2">
      <span className="sr-only">You said:</span>
      <Bubble variant="secondary" align="end">
        <BubbleContent className="whitespace-pre-wrap">{text}</BubbleContent>
      </Bubble>
      <div className="-mt-1.5 flex h-5 items-center justify-end gap-2 text-[11px] text-muted-foreground opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        {(sentAt !== undefined || path) && (
          <span>
            {sentAt !== undefined && timeAgo(sentAt)}
            {sentAt !== undefined && path && ' · '}
            {path && (
              <>
                on{' '}
                <Link href={path} className="text-muted-foreground no-underline transition-colors hover:text-foreground">
                  {titles.get(path) ?? path}
                </Link>
              </>
            )}
          </span>
        )}
        <button
          type="button"
          title="Copy message"
          aria-label="Copy message"
          onClick={() => void navigator.clipboard?.writeText(text)}
          className="transition-colors hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const Conversation: React.FC<{ messages: UIMessage[]; thinking: boolean }> = ({ messages, thinking }) => {
  const visible = messages.filter((message) => message.role === 'user' || hasAnswerContent(message));
  const activeMessage = messages[messages.length - 1];
  // One mark at a time. The waiting row stands in for the answer until the answer has a first tool
  // call or a first token of its own.
  const waiting = thinking && visible[visible.length - 1]?.role !== 'assistant';
  const titles = useNavTitles();

  return (
    <div className="flex flex-col gap-4">
      {visible.map((message) =>
        message.role === 'user' ? (
          <Question key={message.id} message={message} titles={titles} />
        ) : (
          <Answer key={message.id} message={message} waitingForText={thinking && message.id === activeMessage?.id} />
        )
      )}
      {waiting && <Thinking />}
    </div>
  );
};

/** The opening panel: a heading and a few ways in, sitting just above the composer. */
const PanelIntro: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="flex min-h-full flex-col justify-end gap-3 p-4">
    <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
      <MessageSquareText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
    </span>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {children}
  </div>
);

const IntroAction: React.FC<{ icon: React.ReactNode; onClick: () => void; expanded?: boolean; children: React.ReactNode }> = ({
  icon,
  onClick,
  expanded,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={expanded}
    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
  >
    {icon}
    <span className="truncate">{children}</span>
  </button>
);

/** "Try a prompt" drops the example into the composer rather than sending it, so the reader can adjust it first. */
const EmptyState: React.FC<{ onAsk: (text: string) => void; onDraft: (text: string) => void }> = ({ onAsk, onDraft }) => {
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);

  return (
    <PanelIntro title="Explore and understand your design system">
      <div className="space-y-0.5">
        <IntroAction icon={<Layers className="h-4 w-4 shrink-0" />} onClick={() => onAsk(BROWSE_PROMPT)}>
          Browse the components...
        </IntroAction>
        <IntroAction
          icon={<Lightbulb className="h-4 w-4 shrink-0" />}
          onClick={() => setSuggestionsOpen((open) => !open)}
          expanded={suggestionsOpen}
        >
          Try a prompt...
        </IntroAction>
        {suggestionsOpen && (
          <div className="space-y-2 pt-1">
            {PROMPT_SUGGESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => onDraft(text)}
                className="block w-full rounded-lg bg-muted/60 px-2 py-2 text-left text-xs leading-snug text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
    </PanelIntro>
  );
};

/** Takes the place of the conversation when no model is reachable for this reader. */
const Unavailable: React.FC<{ canAddKeys: boolean; failed: boolean }> = ({ canAddKeys, failed }) => (
  <PanelIntro title={canAddKeys ? 'Add a provider key' : 'The assistant is unavailable'}>
    <p className="text-xs text-muted-foreground">
      {failed
        ? 'The list of AI providers could not be loaded.'
        : canAddKeys
          ? 'This site needs your API key before the assistant can answer.'
          : 'No AI provider is configured for this site.'}
    </p>
    {canAddKeys && (
      <Link
        href="/account/ai"
        className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground"
      >
        <ArrowUpRight className="h-4 w-4 shrink-0" />
        Add a key...
      </Link>
    )}
  </PanelIntro>
);

/**
 * The models grouped under their connection, in the order the config declares both. That order is
 * the author's preference and the server's fallback order, so it is kept rather than sorted.
 *
 * The trigger names the model alone, and adds its connection only when another connection offers a
 * model of the same name.
 */
const ModelPicker: React.FC<{ models: AiModelOption[]; value: string | null; onChange: (id: string) => void }> = ({
  models,
  value,
  onChange,
}) => {
  // A `Map` keeps insertion order for every key; a plain object would move an integer-like id first.
  const byConnection = new Map<string, AiModelOption[]>();
  for (const entry of models) byConnection.set(entry.connectionId, [...(byConnection.get(entry.connectionId) ?? []), entry]);
  const groups = [...byConnection.values()];
  const selected = models.find((entry) => entry.id === value);
  const ambiguous = selected ? models.some((entry) => entry.model === selected.model && entry.id !== selected.id) : false;

  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Model"
        title={selected ? `${selected.label} · ${selected.model}` : undefined}
        className="-ml-2 h-8 w-auto min-w-0 gap-1 border-0 px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-muted hover:text-foreground focus:ring-0"
      >
        <SelectValue>
          <span className="truncate">{selected && (ambiguous ? `${selected.label} · ${selected.model}` : selected.model)}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="max-w-72">
        {groups.map((group, index) => (
          <React.Fragment key={group[0].connectionId}>
            {index > 0 && <SelectSeparator />}
            <SelectGroup>
              <SelectLabel className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">{group[0].label}</SelectLabel>
              {group.map((entry) => (
                <SelectItem key={entry.id} value={entry.id} className="text-xs">
                  {entry.model}
                </SelectItem>
              ))}
            </SelectGroup>
          </React.Fragment>
        ))}
      </SelectContent>
    </Select>
  );
};

const PAGE_ICONS: Record<AiPageKind, React.ElementType> = { component: Layers, pattern: LayoutTemplate, page: FileText };

/**
 * The page the next question is asked about. The reader can leave it out.
 *
 * A tighter `xs` attachment: the chip sits inside the composer, so it stays about one line tall.
 * `-mt-1.5` cancels the composer's top padding, which is sized for text, so the chip sits as far
 * from the border above as from the text below.
 */
const PageChip: React.FC<{ page: AiPage; onRemove: () => void }> = ({ page, onRemove }) => {
  const Icon = PAGE_ICONS[page.kind];
  return (
    <Attachment
      size="xs"
      className="-mt-1.5 mb-2 min-w-0 has-data-[slot=attachment-content]:p-0.5 has-data-[slot=attachment-media]:p-0.5"
    >
      <AttachmentMedia className="group-data-[size=xs]/attachment:w-5">
        <Icon className="size-3" aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle title={page.title}>{page.title}</AttachmentTitle>
      </AttachmentContent>
      <AttachmentAction
        type="button"
        aria-label={`Leave ${page.title} out of the question`}
        title={`Leave ${page.title} out of the question`}
        onClick={onRemove}
        className="h-5 w-5 text-muted-foreground hover:text-foreground [&_svg]:size-3"
      >
        <X />
      </AttachmentAction>
    </Attachment>
  );
};

export const AiConversation: React.FC<{ active: boolean; controls?: React.ReactNode }> = ({ active, controls }) => {
  const [input, setInput] = React.useState('');
  const connections = useAiConnections(active);
  const composerRef = React.useRef<HTMLTextAreaElement>(null);
  const transcriptRef = React.useRef<HTMLDivElement>(null);
  // A reader who scrolled up to an earlier answer must not be pulled back down by the next token.
  const following = React.useRef(true);

  const { messages, sendMessage, status, stop, error, model, chooseModel, startFresh } = useAiChat();

  // A dismissed page stays out only while the reader stays on it.
  const page = usePageContext();
  const [dismissedPath, setDismissedPath] = React.useState<string | null>(null);
  React.useEffect(() => setDismissedPath(null), [page?.path]);
  const context = page && page.path !== dismissedPath ? page : null;

  // The picker follows the deployment's default until the reader chooses, and falls back to the
  // first usable model so a deployment whose default is not usable here still answers.
  const usable = (id: string | null) => Boolean(id) && connections.models.some((entry) => entry.id === id);
  const selectedModel =
    (usable(model) ? model : usable(connections.defaultModel) ? connections.defaultModel : connections.models[0]?.id) ?? null;

  const busy = status === 'submitted' || status === 'streaming';
  const hasModel = connections.models.length > 0;

  const draft = (text: string) => {
    setInput(text);
    composerRef.current?.focus();
  };

  const ask = (text: string) => {
    if (!text.trim() || busy || !selectedModel) return;
    setInput('');
    following.current = true;
    void sendMessage(
      { text: text.trim(), metadata: { sentAt: Date.now(), ...(context && { path: context.path }) } },
      { body: { model: selectedModel } }
    );
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
    !hasTextContent(lastMessage);

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
      <div className="flex h-11 shrink-0 items-center justify-end gap-0.5 px-2">
        {canStartFresh && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              startFresh();
              setInput('');
              composerRef.current?.focus();
            }}
            title="New conversation"
            aria-label="New conversation"
            className="text-muted-foreground"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        )}
        {controls}
      </div>

      <div ref={transcriptRef} onScroll={onTranscriptScroll} className="min-h-0 flex-1 overflow-y-auto">
        {messages.length > 0 ? (
          <div className="flex flex-col gap-4 px-3 pb-4 pt-1">
            <Conversation messages={messages} thinking={busy} />
            {answeredNothing && (
              <Marker>
                <MarkerIcon>
                  <CircleAlert />
                </MarkerIcon>
                <MarkerContent>
                  The model stopped without an answer. A long conversation is the usual cause, so a new one often helps.
                </MarkerContent>
              </Marker>
            )}
            {error && (
              <Marker>
                <MarkerIcon>
                  <CircleAlert className="text-destructive" />
                </MarkerIcon>
                <MarkerContent className="text-destructive">{error.message}</MarkerContent>
              </Marker>
            )}
          </div>
        ) : connections.loading ? null : hasModel ? (
          <EmptyState onAsk={ask} onDraft={draft} />
        ) : (
          <Unavailable canAddKeys={connections.canAddKeys} failed={connections.failed} />
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
        className="shrink-0 border-t p-3"
      >
        <div className="px-1 pt-1.5">
          {context && (
            <PageChip
              page={context}
              onRemove={() => {
                setDismissedPath(context.path);
                composerRef.current?.focus();
              }}
            />
          )}
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
            aria-label="Question"
            placeholder={hasModel ? 'Ask about your design system...' : 'The assistant is unavailable'}
            disabled={!hasModel}
            className="outline-hidden block w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-2">
          {hasModel ? <ModelPicker models={connections.models} value={selectedModel} onChange={chooseModel} /> : <span />}
          {busy ? (
            // The spinner doubles as the stop control, and shows its square on hover.
            <Button
              type="button"
              size="icon-sm"
              onClick={() => void stop()}
              title="Stop"
              aria-label="Stop"
              className="group shrink-0 rounded-full"
            >
              <Loader2 className="h-4 w-4 animate-spin group-hover:hidden" />
              <Square className="hidden h-3 w-3 fill-current group-hover:block" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-sm"
              title="Send (Enter)"
              aria-label="Send"
              disabled={!input.trim() || !hasModel}
              className="shrink-0 rounded-full"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
