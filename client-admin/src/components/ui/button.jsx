import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/35',
        success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90',
        outline:
          'border border-border bg-card shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-primary/35',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/75',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        default: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        /* Touch targets for the POS terminal and kitchen display, which run
           on tablets and get used with a thumb, at speed, by someone busy. */
        touch: "h-14 px-6 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: 'size-10',
        'icon-sm': 'size-8',
        'icon-touch': "size-14 [&_svg:not([class*='size-'])]:size-6",
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * `loading` swaps in a spinner and blocks the click, so callers never have to
 * remember to also set `disabled` on an in-flight submit.
 */
const Button = forwardRef(function Button(
  { className, variant, size, block, asChild = false, loading = false, children, disabled, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
});

export { Button, buttonVariants };
