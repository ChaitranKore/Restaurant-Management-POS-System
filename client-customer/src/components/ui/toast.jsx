import { Toaster as Sonner, toast } from 'sonner';
import { useTheme } from '@/lib/theme';

/**
 * Sonner wired to our tokens rather than its own palette, so toasts match the
 * app in both themes. Mount once, near the router.
 */
function Toaster({ ...props }) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="top-right"
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            'group flex items-center gap-3 w-full rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground rounded-md px-2.5 h-7 text-xs font-semibold',
          cancelButton: 'bg-muted text-muted-foreground rounded-md px-2.5 h-7 text-xs font-semibold',
          closeButton: 'bg-card border-border text-muted-foreground hover:text-foreground',
          success: '[&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-destructive',
          warning: '[&_[data-icon]]:text-warning',
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
