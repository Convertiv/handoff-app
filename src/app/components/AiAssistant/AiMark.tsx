import * as React from 'react';

import { cn } from '../../lib/utils';

/**
 * The assistant's glyph: a large four-point spark with a smaller one trailing it.
 *
 * It is drawn here rather than taken from the icon set because it is the one mark in the app that
 * carries the AI accent ramp — every other icon is monochrome, and that contrast is what makes the
 * assistant's controls read as the assistant at a glance.
 *
 * The gradient needs an id that is unique per instance; two marks on one page would otherwise share
 * (and fight over) a single `<defs>` entry.
 */
export const AiMark: React.FC<{ className?: string; muted?: boolean }> = ({ className, muted = false }) => {
  const gradientId = `ai-mark-${React.useId()}`;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={cn('h-4 w-4', className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--ai-from))" />
          <stop offset="55%" stopColor="hsl(var(--ai-via))" />
          <stop offset="100%" stopColor="hsl(var(--ai-to))" />
        </linearGradient>
      </defs>
      <g fill={muted ? 'currentColor' : `url(#${gradientId})`}>
        <path d="M11.2 1.6c.55 4.9 3.9 8.25 8.8 8.8-4.9.55-8.25 3.9-8.8 8.8-.55-4.9-3.9-8.25-8.8-8.8 4.9-.55 8.25-3.9 8.8-8.8Z" />
        <path d="M18.6 14.4c.26 2.3 1.84 3.88 4.14 4.14-2.3.26-3.88 1.84-4.14 4.14-.26-2.3-1.84-3.88-4.14-4.14 2.3-.26 3.88-1.84 4.14-4.14Z" />
      </g>
    </svg>
  );
};

/**
 * The gradient outline shared by the assistant's surfaces.
 *
 * It sits inside a `relative overflow-hidden` parent that carries the radius and a one-pixel pad;
 * the parent's own child then covers everything but that pad, leaving a hairline.
 *
 * At rest that hairline is a still gradient. `motion` says whether a conic sweep also turns over it:
 *
 * - `none` — the default, and what the header and the dialog's own header wear. Chrome that is on
 *   screen the whole time should not be moving the whole time.
 * - `hover` — the sweep fades in and turns only while the enclosing `group` is hovered.
 * - `always` — reserved for the one place the motion means something: an answer still being worked on.
 *
 * `-inset-` has to exceed the parent so the square conic still covers the corners as it turns.
 */
export const AiEdge: React.FC<{ motion?: 'none' | 'hover' | 'always'; className?: string }> = ({ motion = 'none', className }) => (
  <>
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 bg-linear-to-r from-ai-from via-ai-via to-ai-to', className)}
    />
    {motion !== 'none' && (
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -inset-[150%]',
          'bg-[conic-gradient(from_0deg,transparent_0deg,hsl(var(--ai-from))_40deg,hsl(var(--ai-via))_90deg,hsl(var(--ai-to))_140deg,transparent_200deg)]',
          motion === 'always'
            ? 'animate-ai-orbit'
            : 'opacity-0 transition-opacity duration-300 group-hover:animate-ai-orbit group-hover:opacity-100'
        )}
      />
    )}
  </>
);
