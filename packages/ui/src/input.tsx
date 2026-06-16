import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-brand-stone">
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-brand-ivory/50 px-4 py-3 text-sm transition-colors',
            'placeholder:text-brand-stone/60',
            'focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
