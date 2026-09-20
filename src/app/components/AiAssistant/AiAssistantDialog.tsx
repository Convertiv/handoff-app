'use client';

import { DefaultChatTransport, getToolOrDynamicToolName, isDynamicToolUIPart, isToolUIPart, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { ArrowUp, ExternalLink, Sparkles, Square, Wrench } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MarkdownComponents } from '../Markdown/MarkdownComponents';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../../lib/utils';
import { toolCallLabel } from './toolLabel';
import { useAiConnections } from './useAiConnections';

/**
 * The docs assistant: a conversation with the design system, grounded in the same records the MCP
 * tools return.
 *
 * Controlled by {@link AiAssistantProvider}, which owns both the availability gate and the `⌘K`
 * shortcut, so the header and the mobile nav open the same conversation.
 */
const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

/** Starter prompts are built from the real catalog, so the empty modal shows what the assistant knows. */
const STARTER_COUNT = 3;

interface CatalogEntry {
  id: string;
  title?: string;
}

const useStarterPrompts = (active: boolean): string[] => {
  const [prompts, setPrompts] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!active || prompts.length > 0) return;
    let live = true;
    void fetch(`${basePath}/api/docs/components.json`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : []))
      .then((components: CatalogEntry[]) => {
        if (!live || !Array.isArray(components) || components.length === 0) return;
        const names = components.slice(0, STARTER_COUNT).map((component) => component.title || component.id);
        setPrompts([
          `What props does ${names[0]} take?`,
          ...(names[1] ? [`When should I use ${names[1]}?`] : []),
          ...(names[2] ? [`Show me the markup for ${names[2]}`] : []),
          'Which color tokens are available?',
        ]);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [active, prompts.length]);

  return prompts;
};

/** Every page and component the tools read during this answer, deduplicated across its parts. */
const sourcesOf = (message: UIMessage): { url: string; title: string }[] => {
  const seen = new Map<string, string>();
  for (const part of message.parts) {
    if (part.type === 'source-url' && !seen.has(part.url)) seen.set(part.url, part.title ?? part.url);
  }
  return [...seen].map(([url, title]) => ({ url, title }));
};

const ToolRow: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
    <Wrench className="h-3 w-3 shrink-0" />
    <span className="truncate">{label}</span>
  </div>
);

const Answer: React.FC<{ message: UIMessage }> = ({ message }) => {
  const sources = sourcesOf(message);

  return (
    <div className="space-y-2">
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div key={index} className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                {part.text}
              </ReactMarkdown>
            </div>
          );
        }
        if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
          return <ToolRow key={index} label={toolCallLabel(getToolOrDynamicToolName(part), part.input)} />;
        }
        return null;
      })}
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {sources.map((source) => (
            <Link
              key={source.url}
              href={source.url}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {source.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Conversation: React.FC<{ messages: UIMessage[] }> = ({ messages }) => (
  <div className="space-y-6">
    {messages.map((message) =>
      message.role === 'user' ? (
        <p key={message.id} className="text-sm font-medium">
          {message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('')}
        </p>
      ) : (
        <Answer key={message.id} message={message} />
      )
    )}
  </div>
);

export const AiAssistantDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => {
  const [input, setInput] = React.useState('');
  const [model, setModel] = React.useState<string | null>(null);
  const connections = useAiConnections(open);
  const starters = useStarterPrompts(open);

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: `${basePath}/api/ai/chat`, credentials: 'include' }),
  });

  // The picker follows the deployment's default until the reader chooses, and falls back to the
  // first usable model so a deployment whose default is not usable here still answers.
  const selectedModel =
    model ??
    (connections.models.some((entry) => entry.id === connections.defaultModel) ? connections.defaultModel : connections.models[0]?.id) ??
    null;

  const busy = status === 'submitted' || status === 'streaming';

  const ask = (text: string) => {
    if (!text.trim() || busy || !selectedModel) return;
    setInput('');
    void sendMessage({ text: text.trim() }, { body: { model: selectedModel } });
  };

  const hasModel = connections.models.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-[680px]">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Ask the design system
          </DialogTitle>
          <DialogDescription>Answers come from the components, tokens and documentation of this design system.</DialogDescription>
        </DialogHeader>

        <div className="min-h-[220px] flex-1 overflow-y-auto px-5 py-4">
          {messages.length > 0 ? (
            <Conversation messages={messages} />
          ) : connections.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : hasModel ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Try asking</p>
              {starters.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => ask(prompt)}
                  className="block w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-accent/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">{connections.canAddKeys ? 'Add a provider key' : 'The assistant is unavailable'}</p>
              <p className="text-sm text-muted-foreground">
                {connections.failed
                  ? 'The list of AI providers could not be loaded.'
                  : connections.canAddKeys
                    ? 'This site needs your API key before the assistant can answer.'
                    : 'No AI provider is configured for this site.'}
              </p>
              {connections.canAddKeys && (
                <Link href="/account/ai" className="inline-block text-sm underline underline-offset-4">
                  Add a key
                </Link>
              )}
            </div>
          )}
          {error && <p className="mt-4 text-sm text-destructive">{error.message}</p>}
        </div>

        <div className="border-t px-5 py-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="What props does Button take?"
              disabled={!hasModel}
              autoFocus
            />
            {busy ? (
              <Button type="button" size="icon" variant="ghost" onClick={() => void stop()} title="Stop">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim() || !hasModel} title="Ask">
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </form>
          {connections.models.length > 1 && (
            <div className="mt-2 flex justify-end">
              <Select value={selectedModel ?? undefined} onValueChange={setModel}>
                <SelectTrigger className={cn('h-7 w-auto gap-1 border-0 text-xs text-muted-foreground shadow-none')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {connections.models.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id} className="text-xs">
                      {entry.label} · {entry.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
