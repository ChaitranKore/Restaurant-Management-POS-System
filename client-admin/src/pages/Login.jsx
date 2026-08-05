import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChefHat, LayoutDashboard, Loader2, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';

const HIGHLIGHTS = [
  { icon: ChefHat, title: 'Live kitchen board', blurb: 'Tickets appear the instant an order lands.' },
  { icon: LayoutDashboard, title: 'Service at a glance', blurb: 'Revenue, covers and the day’s rush.' },
  { icon: ShieldCheck, title: 'Role-based access', blurb: 'Enforced server-side on every route.' },
];

/* Seeded by `npm run seed:demo`. Read-only in spirit — the demo database is
   reset on every deploy, so anything a visitor changes is temporary. */
const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@tableside.demo',
    password: 'demo1234',
    blurb: 'Full access — menu, staff, payments',
  },
  {
    role: 'Staff',
    email: 'staff@tableside.demo',
    password: 'demo1234',
    blurb: 'Kitchen board and POS only',
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState('');

  const signIn = async (emailValue, passwordValue) => {
    setError('');
    const user = await login(emailValue, passwordValue);
    toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
    navigate('/', { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Those details did not match an account.');
    } finally {
      setBusy(false);
    }
  };

  const enterAsDemo = async (account) => {
    setDemoBusy(account.role);
    try {
      await signIn(account.email, account.password);
    } catch (err) {
      // The demo accounts only exist once the demo seed has been run.
      setError(
        err.response?.data?.message ||
          'Demo account unavailable — run `npm run seed:demo` on the server.'
      );
    } finally {
      setDemoBusy('');
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative flex items-center justify-center px-4 py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <span className="mb-8 inline-flex items-center gap-2 font-display text-lg font-semibold lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-4.5" aria-hidden="true" />
            </span>
            TableSide
          </span>

          <h1 className="font-display text-3xl">Staff console</h1>
          <p className="mt-1.5 text-muted-foreground text-pretty">
            Sign in with an admin or staff account.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive"
              >
                {error}
              </p>
            ) : null}

            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@restaurant.local"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
                required
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
                required
              />
            </Field>

            <Button type="submit" size="lg" block loading={busy}>
              Sign in
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Or explore the demo
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-4 grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => enterAsDemo(account)}
                  disabled={Boolean(demoBusy)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/45 hover:shadow-sm disabled:opacity-60"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    {account.role === 'Admin' ? (
                      <ShieldCheck className="size-4.5" aria-hidden="true" />
                    ) : (
                      <ChefHat className="size-4.5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Enter as {account.role}</span>
                    <span className="block text-xs text-muted-foreground">{account.blurb}</span>
                  </span>
                  {demoBusy === account.role ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  ) : (
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground text-pretty">
              Demo data resets on every deploy — nothing you do here is permanent.
            </p>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,color-mix(in_oklch,var(--primary)_40%,transparent),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-sidebar-foreground">
          <span className="inline-flex items-center gap-2 font-display text-xl font-semibold text-white">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" aria-hidden="true" />
            </span>
            TableSide
          </span>

          <div>
            <p className="font-display text-3xl leading-snug text-white text-balance">
              Every order, from the till to the pass, on one screen.
            </p>

            <ul className="mt-8 space-y-5">
              {HIGHLIGHTS.map(({ icon: Icon, title, blurb }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="text-sm text-sidebar-foreground/70">{blurb}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
