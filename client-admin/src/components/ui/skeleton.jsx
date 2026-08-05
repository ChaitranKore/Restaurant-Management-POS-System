import { cn } from '@/lib/utils';

/**
 * A loading placeholder. Give it the geometry of the thing it stands in for —
 * a skeleton that doesn't match causes a visible jump when the data lands.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-muted rounded-md shimmer', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Matches the geometry of MenuItemCard: 4:3 image, title, description, price row. */
function MenuCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center justify-between pt-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-px">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn('h-4', columnIndex === 0 ? 'w-28' : 'flex-1 max-w-32')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { Skeleton, MenuCardSkeleton, StatCardSkeleton, TableSkeleton };
