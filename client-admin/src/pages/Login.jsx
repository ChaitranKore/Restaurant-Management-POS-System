import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, LayoutDashboard, ShieldCheck, UtensilsCrossed } from 'lucide-react';
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Those details did not match an account.');
    } finally {
      setBusy(false);
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
