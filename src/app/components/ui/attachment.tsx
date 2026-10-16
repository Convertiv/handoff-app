import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';

const attachmentVariants = cva(
  'group/attachment relative flex w-fit min-w-40 max-w-full shrink-0 flex-wrap items-center rounded-xl border bg-card text-card-foreground focus-within:ring-1 focus-within:ring-ring/50',
  {
    variants: {
      size: {
        default:
          'gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2',
        sm: 'gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5',
        xs: 'gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1',
      },
    },
  }
);

function Attachment({ className, size = 'default', ...props }: React.ComponentProps<'div'> & VariantProps<typeof attachmentVariants>) {
  return <div data-slot="attachment" data-size={size} className={cn(attachmentVariants({ size }), className)} {...props} />;
}

function AttachmentMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-media"
      className={cn(
        "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  );
}

function AttachmentContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="attachment-content" className={cn('min-w-0 max-w-full flex-1 leading-tight', className)} {...props} />;
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="attachment-title" className={cn('block min-w-0 max-w-full truncate font-medium', className)} {...props} />;
}

function AttachmentAction({ className, variant, size = 'icon-xs', ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="attachment-action" variant={variant ?? 'ghost'} size={size} className={cn(className)} {...props} />;
}

export { Attachment, AttachmentAction, AttachmentContent, AttachmentMedia, AttachmentTitle };
