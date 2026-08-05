import { cn } from '@/lib/utils';

/**
 * The "nothing here" state. Always says what would put something here —
 * a bare "No results" leaves the user with nowhere to go.
 */
function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-14 gap-3',
        className
      )}
    >
      {Icon ? (
        <div className="bg-muted text-muted-foreground rounded-full p-3.5 mb-1">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground text-sm max-w-sm text-pretty">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
