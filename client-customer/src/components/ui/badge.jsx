import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn, STATUS_LABELS } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/20 text-warning-foreground',
        destructive: 'border-transparent bg-destructive/12 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Badge = forwardRef(function Badge({ className, variant, asChild = false, ...props }, ref) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp ref={ref} data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
});

/* Each lifecycle state gets its own token pair from theme.css, so a status
   reads the same everywhere it appears — kitchen ticket, order table,
   customer tracking page — in both light and dark. */
const statusStyles = {
  pending: 'bg-status-pending text-status-pending-foreground',
  confirmed: 'bg-status-confirmed text-status-confirmed-foreground',
  preparing: 'bg-status-preparing text-status-preparing-foreground',
  ready: 'bg-status-ready text-status-ready-foreground',
  served: 'bg-status-served text-status-served-foreground',
  completed: 'bg-status-completed text-status-completed-foreground',
  cancelled: 'bg-status-cancelled text-status-cancelled-foreground',
};

function StatusBadge({ status, className, pulse = false, ...props }) {
  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap capitalize',
        statusStyles[status] ?? statusStyles.pending,
        className
      )}
      {...props}
    >
      {pulse ? <span className="size-1.5 rounded-full bg-current animate-ember-pulse" /> : null}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function PaymentBadge({ paid, className }) {
  return (
    <Badge variant={paid ? 'success' : 'warning'} className={className}>
      {paid ? 'Paid' : 'Unpaid'}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, PaymentBadge };
