import { cn } from '@/lib/utils';

/**
 * Recharts renders SVG, which can't read Tailwind classes for stroke/fill —
 * it needs concrete colour values. Reading the CSS custom properties off the
 * document at render time keeps the charts on the same tokens as everything
 * else, and re-reading on theme change keeps them correct in both modes.
 */
export function readToken(name, fallback = '#888') {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function chartPalette() {
  return {
    grid: readToken('--border'),
    muted: readToken('--muted-foreground'),
    text: readToken('--foreground'),
    card: readToken('--card'),
    series: [
      readToken('--chart-1'),
      readToken('--chart-2'),
      readToken('--chart-3'),
      readToken('--chart-4'),
      readToken('--chart-5'),
    ],
  };
}

/** Shared tooltip so every chart in the app explains itself the same way. */
export function ChartTooltip({ active, payload, label, formatter, labelFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey ?? entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: entry.color ?? entry.payload?.fill }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="nums ml-auto font-semibold">
            {formatter ? formatter(entry.value, entry) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Placeholder that keeps a chart card at full height when there's no data. */
export function ChartEmpty({ message, className }) {
  return (
    <div
      className={cn(
        'flex h-full min-h-48 items-center justify-center text-center text-sm text-muted-foreground',
        className
      )}
    >
      {message}
    </div>
  );
}
