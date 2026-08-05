import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  ChefHat,
  Check,
  CreditCard,
  GitBranch,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  Smartphone,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { ORDER_STATUSES, cn } from '@/lib/utils';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
const REPO_URL =
  import.meta.env.VITE_REPO_URL || 'https://github.com/ChaitranKore/Restaurant-Management-POS-System';

const DEMO_DINER = { email: 'diner@tableside.demo', password: 'demo1234' };

const FEATURES = [
  {
    icon: Radio,
    title: 'Real-time order routing',
    body: 'Placing an order emits over Socket.IO to every connected kitchen screen, and each status change pushes back to that specific customer. No polling anywhere.',
  },
  {
    icon: ChefHat,
    title: 'Kitchen display system',
    body: 'A drag-and-drop ticket board with per-ticket age timers that shift green to amber to red, so the oldest order is visible from across the pass.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access control',
    body: 'Admin, staff and customer roles enforced server-side by JWT middleware on every route. The frontends only hide what the API would refuse anyway.',
  },
  {
    icon: CreditCard,
    title: 'Cash and card payments',
    body: 'One endpoint, two methods: cash computes change due, card runs a simulated gateway isolated behind a single function so a real processor drops in cleanly.',
  },
  {
    icon: LayoutDashboard,
    title: 'Service analytics',
    body: 'Revenue trend, orders by hour, payment mix and top sellers — aggregated in MongoDB and grouped in the restaurant’s own timezone.',
  },
  {
    icon: Smartphone,
    title: 'Built for the room',
    body: 'Diners order from a phone; staff run the POS and kitchen board on tablets with touch-sized targets. Every screen works in light and dark.',
  },
];

const RBAC = [
  { capability: 'Browse menu, place an order', admin: true, staff: true, customer: true },
  { capability: 'Track own orders live', admin: true, staff: true, customer: true },
  { capability: 'View and advance all orders', admin: true, staff: true, customer: false },
  { capability: 'Take walk-in orders, process payment', admin: true, staff: true, customer: false },
  { capability: 'Manage menu, tables and categories', admin: true, staff: false, customer: false },
  { capability: 'Manage staff accounts and roles', admin: true, staff: false, customer: false },
  { capability: 'Payment history and reconciliation', admin: true, staff: false, customer: false },
];

const STACK = [
  'React 18',
  'Vite',
  'Tailwind v4',
  'Node.js',
  'Express',
  'MongoDB',
  'Mongoose',
  'Socket.IO',
  'JWT',
  'Recharts',
  'Docker',
];

function Section({ eyebrow, title, blurb, children, className }) {
  return (
    <section className={cn('mx-auto max-w-6xl px-4 py-16 sm:py-20', className)}>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
      {blurb ? <p className="mt-2 max-w-2xl text-muted-foreground text-pretty">{blurb}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function LifecycleRail() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ol className="flex min-w-max items-center gap-2">
        {ORDER_STATUSES.map((status, index) => (
          <li key={status} className="flex items-center gap-2">
            {/* StatusBadge rather than an interpolated `bg-status-${status}`:
                Tailwind extracts class names statically, so a template literal
                would only work by accident of the badge module listing them. */}
            <StatusBadge status={status} className="px-3 py-1.5 text-sm" />
            {index < ORDER_STATUSES.length - 1 ? (
              <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ArchitectureDiagram() {
  const boxes = [
    {
      label: 'client-customer',
      sub: 'React · Vite',
      body: 'Menu, cart, checkout, live order tracking',
    },
    {
      label: 'client-admin',
      sub: 'React · Vite',
      body: 'Dashboard, kitchen display, POS, management',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {boxes.map((box) => (
          <Card key={box.label} className="p-4">
            <p className="font-mono text-sm font-semibold text-primary">{box.label}</p>
            <p className="text-xs text-muted-foreground">{box.sub}</p>
            <p className="mt-2 text-sm text-pretty">{box.body}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 py-1 text-xs font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        REST for reads and writes · Socket.IO for live updates
        <span className="h-px flex-1 bg-border" />
      </div>

      <Card className="border-primary/30 bg-primary/5 p-4">
        <p className="font-mono text-sm font-semibold text-primary">server</p>
        <p className="text-xs text-muted-foreground">Express · Mongoose · Socket.IO · JWT</p>
        <p className="mt-2 text-sm text-pretty">
          Re-prices every order line server-side, persists it, then emits{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">order:new</code> to the
          kitchen and <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">order:statusUpdate</code>{' '}
          to both the kitchen and the one customer watching that order.
        </p>
      </Card>

      <div className="flex justify-center py-1">
        <span className="h-6 w-px bg-border" />
      </div>

      <Card className="p-4">
        <p className="font-mono text-sm font-semibold">MongoDB</p>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          User · Category · MenuItem · Table · Order · Payment
        </p>
      </Card>
    </div>
  );
}

export default function Landing() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const enterAsDiner = async () => {
    if (user) {
      navigate('/menu');
      return;
    }
    setBusy(true);
    try {
      await login(DEMO_DINER.email, DEMO_DINER.password);
      toast.success('Signed in as the demo diner');
      navigate('/menu');
    } catch {
      // The demo account only exists once the demo seed has been run.
      toast.error('Demo account unavailable', {
        description: 'Run `npm run seed:demo` on the server, or sign up for an account.',
      });
      navigate('/register');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/50 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          {/* Deliberately not animated in. An entrance animation starts the
              element at opacity 0, and anything that leaves the most important
              content on the site invisible until JavaScript finishes is a bad
              trade — a backgrounded tab pauses rAF and freezes it mid-fade. */}
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-success animate-pulse-soft" />
              Live demo · no signup required
            </span>

            <h1 className="mt-5 font-display text-4xl leading-[1.1] sm:text-6xl">
              A restaurant POS where the kitchen sees your order the moment you place it.
            </h1>

            <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
              Full-stack ordering platform: diners order from their phone, orders route to a live
              kitchen display over websockets, and staff run the floor from a POS terminal — with
              role-based access enforced on every API route.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" loading={busy} onClick={enterAsDiner}>
                <UtensilsCrossed />
                Order as a diner
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={ADMIN_URL} target="_blank" rel="noreferrer">
                  <ChefHat />
                  Open the staff console
                </a>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Staff console sign-in:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                admin@tableside.demo
              </code>{' '}
              / <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">demo1234</code>
            </p>
          </div>
        </div>
      </section>

      <Section
        eyebrow="The core of it"
        title="One order, six states, two screens watching"
        blurb="Every status change is written to the order's own history and pushed to whoever needs it — the kitchen board and the specific diner tracking that order — in the same moment."
      >
        <LifecycleRail />
      </Section>

      <Section
        eyebrow="What's in it"
        title="Built like a product, not a CRUD demo"
        className="border-t border-border"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-5">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Architecture"
        title="Three deployables, one API"
        blurb="Two React apps and an Express server, each independently deployable and containerised."
        className="border-t border-border"
      >
        <ArchitectureDiagram />
      </Section>

      <Section
        eyebrow="Access control"
        title="What each role can actually do"
        blurb="Enforced by protect() and authorize() middleware on the routes themselves — the API is the gate, not the UI."
        className="border-t border-border"
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Capability</th>
                  {['Admin', 'Staff', 'Customer'].map((role) => (
                    <th key={role} className="px-4 py-3 text-center font-semibold">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RBAC.map((row) => (
                  <tr key={row.capability} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{row.capability}</td>
                    {['admin', 'staff', 'customer'].map((role) => (
                      <td key={role} className="px-4 py-3">
                        <span className="flex justify-center">
                          {row[role] ? (
                            <Check className="size-4 text-success" aria-label="Allowed" />
                          ) : (
                            <X className="size-4 text-muted-foreground/40" aria-label="Denied" />
                          )}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <Section title="Built with" className="border-t border-border">
        <div className="flex flex-wrap gap-2">
          {STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" loading={busy} onClick={enterAsDiner}>
            <UtensilsCrossed />
            Try the diner app
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <GitBranch />
              Read the source
            </a>
          </Button>
        </div>
      </Section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-success" aria-hidden="true" />
            Demo data resets on redeploy — order freely, nothing here is real.
          </p>
          <Link to="/menu" className="font-semibold text-primary hover:underline">
            Go to the menu →
          </Link>
        </div>
      </footer>
    </>
  );
}
