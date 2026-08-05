import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-xs transition-[color,box-shadow,border-color]',
        'placeholder:text-muted-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/35 outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/25',
        className
      )}
      {...props}
    />
  );
});

const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs transition-[color,box-shadow,border-color] resize-y',
        'placeholder:text-muted-foreground',
        'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/35 outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/25',
        className
      )}
      {...props}
    />
  );
});

export { Input, Textarea };
