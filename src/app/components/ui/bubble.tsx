import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const bubbleVariants = cva(
  'group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 data-[align=end]:self-end data-[variant=ghost]:max-w-full',
  {
    variants: {
      variant: {
        default:
          '*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80',
        secondary:
          '*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-secondary/80',
        muted: '*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/80',
        outline:
          '*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground',
        ghost:
          '*:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted',
        destructive:
          '*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-destructive dark:*:data-[slot=bubble-content]:bg-destructive/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Bubble({
  variant = 'default',
  align = 'start',
  className,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof bubbleVariants> & { align?: 'start' | 'end' }) {
  return (
    <div data-slot="bubble" data-variant={variant} data-align={align} className={cn(bubbleVariants({ variant }), className)} {...props} />
  );
}

function BubbleContent({ asChild = false, className, ...props }: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-slot="bubble-content"
      className={cn(
        'wrap-break-word w-fit min-w-0 max-w-full overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed group-data-[align=end]/bubble:self-end',
        className
      )}
      {...props}
    />
  );
}

export { Bubble, BubbleContent, bubbleVariants };
