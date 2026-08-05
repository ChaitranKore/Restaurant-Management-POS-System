import { forwardRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

const Label = forwardRef(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="label"
      className={cn(
        'text-sm font-medium leading-none select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});

/** Label + control + error message, so forms stop re-deriving the same markup. */
function Field({ label, htmlFor, error, hint, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? (
        <p className="text-destructive text-xs font-medium">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export { Label, Field };
