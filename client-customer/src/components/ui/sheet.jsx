import { forwardRef } from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Overlay
      ref={ref}
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        className
      )}
      {...props}
    />
  );
});

const sideClasses = {
  right:
    'inset-y-0 right-0 h-full w-3/4 max-w-md border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  left: 'inset-y-0 left-0 h-full w-3/4 max-w-md border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  top: 'inset-x-0 top-0 h-auto border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
  /* The cart on mobile. Respects the home-indicator inset so the checkout
     button never sits under it. */
  bottom:
    'inset-x-0 bottom-0 h-auto max-h-[85dvh] border-t rounded-t-2xl pb-[env(safe-area-inset-bottom)] data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
};

const SheetContent = forwardRef(function SheetContent(
  { className, children, side = 'right', showClose = true, ...props },
  ref
) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-popover shadow-lg transition ease-in-out',
          'data-[state=open]:animate-in data-[state=open]:duration-300',
          'data-[state=closed]:animate-out data-[state=closed]:duration-200',
          sideClasses[side],
          className
        )}
        {...props}
      >
        {side === 'bottom' ? (
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-border" aria-hidden="true" />
        ) : null}
        {children}
        {showClose ? (
          <SheetPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});

function SheetHeader({ className, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1 px-5 pt-5', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 px-5 pb-5', className)}
      {...props}
    />
  );
}

const SheetTitle = forwardRef(function SheetTitle({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Title
      ref={ref}
      data-slot="sheet-title"
      className={cn('text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  );
});

const SheetDescription = forwardRef(function SheetDescription({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Description
      ref={ref}
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
});

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
