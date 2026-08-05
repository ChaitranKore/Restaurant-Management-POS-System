import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

/**
 * Split layout for log in / sign up: the form on the left, and on wide screens
 * a warm brand panel on the right so the page doesn't read as a lone box
 * floating in whitespace.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 font-display text-lg font-semibold lg:hidden"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-4.5" aria-hidden="true" />
            </span>
            TableSide
          </Link>

          <h1 className="font-display text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-muted-foreground text-pretty">{subtitle}</p> : null}

          <div className="mt-7">{children}</div>

          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/85 to-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <span className="inline-flex items-center gap-2 font-display text-xl font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-white/15 backdrop-blur-sm">
              <UtensilsCrossed className="size-5" aria-hidden="true" />
            </span>
            TableSide
          </span>

          <div>
            <p className="font-display text-3xl leading-snug text-balance">
              From your table to the kitchen in one tap — and you see every step.
            </p>
            <p className="mt-4 max-w-sm text-primary-foreground/75 text-pretty">
              Orders route straight to the kitchen display the moment you place them, and the status
              on your screen changes the second the chef moves the ticket.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
