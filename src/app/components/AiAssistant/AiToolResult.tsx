'use client';

import { ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

/**
 * Tool results the reader can act on, drawn as cards under the step that produced them. Every other
 * tool, and any result in a shape this does not recognize, stays a status row.
 */

/** Search results shown before the rest collapse into a count. */
const MAX_COMPONENT_CARDS = 5;

type ComponentCard = { id: string; title: string; group?: string; description?: string };

type PreviewCard = { id: string; title: string; url: string; html?: string; component: { id: string; title: string } };

const componentRoute = (id: string): string => `/system/component/${encodeURIComponent(id)}`;

/** The JSON payload of the single text block an MCP tool returns, or `null` for anything else. */
const payloadOf = (output: unknown): Record<string, unknown> | null => {
  const block = Array.isArray(output) ? output.find((entry) => entry?.type === 'text') : null;
  if (typeof block?.text !== 'string') return null;
  try {
    const value = JSON.parse(block.text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
};

const ComponentCards: React.FC<{ components: ComponentCard[]; total: number }> = ({ components, total }) => {
  const shown = components.slice(0, MAX_COMPONENT_CARDS);
  const hidden = total - shown.length;

  return (
    <div className="flex flex-col gap-1.5">
      {shown.map((component) => (
        <Link
          key={component.id}
          href={componentRoute(component.id)}
          className="flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left no-underline transition-colors hover:bg-muted/60 active:bg-muted"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium leading-tight text-foreground">{component.title}</span>
            {(component.description || component.group) && (
              <span className="line-clamp-2 text-xs text-muted-foreground">{component.description || component.group}</span>
            )}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
      {hidden > 0 && <p className="px-1 text-xs text-muted-foreground">and {hidden} more</p>}
    </div>
  );
};

const PreviewFrame: React.FC<{ preview: PreviewCard }> = ({ preview }) => (
  <div className="overflow-hidden rounded-xl border bg-card">
    {/* The rendered artifact, as the component page frames it. A preview that was never built has no markup to show. */}
    {preview.html && (
      <iframe
        src={preview.url}
        title={`${preview.component.title}: ${preview.title}`}
        loading="lazy"
        className="block h-48 w-full border-b bg-background"
      />
    )}
    <Link
      href={componentRoute(preview.component.id)}
      className="flex items-center gap-3 px-3 py-2.5 no-underline transition-colors hover:bg-muted/60"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-tight text-foreground">{preview.component.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{preview.title}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  </div>
);

/** The card for one finished tool call, or `null` when the result has none. */
export const toolResultCard = (toolName: string, output: unknown): React.ReactNode => {
  const payload = payloadOf(output);
  if (!payload) return null;

  if (toolName === 'handoff_search_components' && Array.isArray(payload.components) && payload.components.length > 0) {
    const total = typeof payload.total === 'number' ? payload.total : payload.components.length;
    return <ComponentCards components={payload.components as ComponentCard[]} total={total} />;
  }
  if (toolName === 'handoff_get_component_preview' && typeof payload.url === 'string' && payload.component) {
    return <PreviewFrame preview={payload as unknown as PreviewCard} />;
  }
  return null;
};
