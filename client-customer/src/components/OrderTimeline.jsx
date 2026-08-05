import { motion } from 'motion/react';
import { Ban, Check, ChefHat, ClipboardCheck, HandPlatter, PartyPopper, Receipt } from 'lucide-react';
import { cn, formatTime, ORDER_STATUSES } from '@/lib/utils';

const STEP_META = {
  pending: { icon: Receipt, label: 'Order placed', blurb: 'Waiting for the kitchen to accept it.' },
  confirmed: { icon: ClipboardCheck, label: 'Confirmed', blurb: 'The kitchen has your order.' },
  preparing: { icon: ChefHat, label: 'Being prepared', blurb: 'Your food is on the stove.' },
  ready: { icon: HandPlatter, label: 'Ready', blurb: 'Plated and ready to come out.' },
  served: { icon: PartyPopper, label: 'Served', blurb: 'Enjoy your meal.' },
  completed: { icon: Check, label: 'Completed', blurb: 'Order closed out. Thanks for coming in.' },
};

/**
 * Vertical progress rail driven by the order's own statusHistory, so each step
 * carries the real timestamp the kitchen advanced it at — not a guess from
 * when this page happened to load.
 */
export default function OrderTimeline({ order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
          <Ban className="size-4.5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold text-destructive">This order was cancelled</p>
          <p className="text-sm text-muted-foreground">
            If that wasn't expected, please speak to a member of staff.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const timestamps = Object.fromEntries(
    (order.statusHistory ?? []).map((entry) => [entry.status, entry.at])
  );

  return (
    <ol className="relative">
      {ORDER_STATUSES.map((status, index) => {
        const { icon: Icon, label, blurb } = STEP_META[status];
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;
        const at = timestamps[status];
        const isLast = index === ORDER_STATUSES.length - 1;

        return (
          <li key={status} className="relative flex gap-4 pb-7 last:pb-0">
            {/* Connector. Fills only up to the step actually reached. */}
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute left-[1.125rem] top-9 h-[calc(100%-1.5rem)] w-0.5 -translate-x-1/2 rounded bg-border"
              >
                <motion.span
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: isDone ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  style={{ transformOrigin: 'top' }}
                  className="block size-full rounded bg-primary"
                />
              </span>
            ) : null}

            <span className="relative z-10 shrink-0">
              {isCurrent ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full animate-ping-ring"
                />
              ) : null}
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-full border-2 transition-colors duration-300',
                  isDone && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-card text-primary',
                  isFuture && 'border-border bg-card text-muted-foreground/50'
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </span>

            <div className={cn('min-w-0 flex-1 pt-1', isFuture && 'opacity-55')}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p
                  className={cn(
                    'font-semibold leading-tight',
                    isCurrent && 'text-primary',
                    isFuture && 'font-medium text-muted-foreground'
                  )}
                >
                  {label}
                </p>
                {at ? (
                  <time
                    dateTime={new Date(at).toISOString()}
                    className="nums text-xs text-muted-foreground"
                  >
                    {formatTime(at)}
                  </time>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{blurb}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
