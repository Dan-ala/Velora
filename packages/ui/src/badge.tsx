import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'bg-brand-black text-white',
        accent: 'bg-brand-gold text-brand-black',
        outline: 'border border-brand-black/20 text-brand-black',
        success: 'bg-green-50 text-green-700',
        warning: 'bg-orange-50 text-orange-600',
        error: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
