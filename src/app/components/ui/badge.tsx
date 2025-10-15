import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded px-2 py-1 text-xs font-normal transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-slate-50 text-gray-600 ring-slate-500/20 ring-1 ring-inset [&>svg]:text-gray-600',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80',
        outline: 'text-foreground',
        warning: 'bg-yellow-50 text-yellow-800 ring-yellow-500/20 ring-1 ring-inset [&>svg]:text-yellow-800',
        info: 'bg-blue-50 text-sky-800 ring-blue-500/20 ring-1 ring-inset [&>svg]:text-sky-700',
        green: 'bg-green-50 text-green-800 ring-green-500/20 ring-1 ring-inset [&>svg]:text-green-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
