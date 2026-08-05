import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CreditCard,
  Radio,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import api from '@/api/client';
import OrderTimeline from '@/components/OrderTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { useSocket } from '@/context/SocketContext';
import { cn, formatCurrency, STATUS_LABELS } from '@/lib/utils';

function LiveIndicator({ connected }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        connected ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground'
      )}
      title={connected ? 'Connected — updates arrive instantly' : 'Reconnecting…'}
    >
      <Radio className={cn('size-3', connected && 'animate-pulse-soft')} aria-hidden="true" />
      {connected ? 'Live' : 'Offline'}
    </span>
  );
}

function PaymentPanel({ order, onPaid }) {
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [cash, setCash] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (order.paymentStatus === 'paid') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/8 p-3.5">
        <BadgeCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
        <div>
          <p className="font-semibold text-success">Payment received</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(order.grandTotal)} settled. Nothing left to pay.
          </p>
        </div>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body =
        method === 'card'
          ? { orderId: order._id, method: 'card', ...card }
          : { orderId: order._id, method: 'cash', tenderedAmount: Number(cash) };
      const res = await api.post('/payments', body);
      onPaid(res.data.order);
      const change = res.data.payment?.changeDue;
      toast.success('Payment approved', {
        description: change > 0 ? `Change due: ${formatCurrency(change)}` : undefined,
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Payment could not be processed.';
      setError(message);
      toast.error('Payment declined', { description: message });
    } finally {
      setBusy(false);
    }
  };

  const methods = [
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'cash', label: 'Cash at counter', icon: Banknote },
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {methods.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMethod(value)}
            aria-pressed={method === value}
            className={cn(
              'flex items-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-all',
              method === value
                ? 'border-primary bg-primary/8 ring-[3px] ring-ring/20'
                : 'border-border bg-card hover:border-primary/40'
            )}
          >
            <Icon
              className={cn('size-4', method === value ? 'text-primary' : 'text-muted-foreground')}
            />
            {label}
          </button>
        ))}
      </div>

      {method === 'card' ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cardNumber">Card number</Label>
            <Input
              id="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={card.cardNumber}
              onChange={(event) => setCard({ ...card, cardNumber: event.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(event) => setCard({ ...card, expiry: event.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={card.cvv}
                onChange={(event) => setCard({ ...card, cvv: event.target.value })}
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Simulated gateway — no real card is charged. Card number{' '}
            <code className="font-mono">0000000000000000</code> always declines.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cash">Cash tendered</Label>
          <Input
            id="cash"
            type="number"
            inputMode="decimal"
            min={order.grandTotal}
            step="0.01"
            placeholder={order.grandTotal.toFixed(2)}
            value={cash}
            onChange={(event) => setCash(event.target.value)}
            required
          />
          {Number(cash) > order.grandTotal ? (
            <p className="nums text-xs text-muted-foreground">
              Change due: {formatCurrency(Number(cash) - order.grandTotal)}
            </p>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" block loading={busy}>
        Pay {formatCurrency(order.grandTotal)}
      </Button>
    </form>
  );
}

function TrackingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-8 w-48" />
      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function OrderTracking() {
  const { id } = useParams();
  const { socket, connected } = useSocket();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const previousStatus = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/orders/${id}`)
      .then((res) => {
        if (cancelled) return;
        setOrder(res.data);
        previousStatus.current = res.data.status;
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load this order.');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!socket) return undefined;

    socket.emit('order:subscribe', id);
    const onUpdate = (updated) => {
      if (updated._id !== id) return;
      setOrder(updated);
      // Announce only real transitions, not the initial load or a re-emit.
      if (previousStatus.current && previousStatus.current !== updated.status) {
        toast(`Order ${STATUS_LABELS[updated.status] ?? updated.status}`, {
          description: `Order ${updated.orderNumber} was updated by the kitchen.`,
        });
      }
      previousStatus.current = updated.status;
    };

    socket.on('order:statusUpdate', onUpdate);
    return () => {
      socket.emit('order:unsubscribe', id);
      socket.off('order:statusUpdate', onUpdate);
    };
  }, [socket, id]);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/orders">Back to my orders</Link>
        </Button>
      </div>
    );
  }

  if (!order) return <TrackingSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground">
        <Link to="/orders">
          <ArrowLeft />
          My orders
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl">Order {order.orderNumber}</h1>
        <StatusBadge status={order.status} pulse={!['completed', 'cancelled'].includes(order.status)} />
        <LiveIndicator connected={connected} />
      </div>

      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        {order.orderType === 'dine-in' ? (
          <>
            <UtensilsCrossed className="size-3.5" aria-hidden="true" />
            Dine in{order.table ? ` · Table ${order.table.number}` : ''}
          </>
        ) : (
          <>
            <Store className="size-3.5" aria-hidden="true" />
            Takeaway
          </>
        )}
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={order.status}
                initial={{ opacity: 0.65 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <OrderTimeline order={order} />
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2.5 text-sm">
                {order.items.map((item) => (
                  <li key={item.menuItem} className="flex items-start justify-between gap-3">
                    <span>
                      <span className="nums font-semibold">{item.quantity}×</span> {item.name}
                      {item.notes ? (
                        <span className="block text-xs text-muted-foreground">{item.notes}</span>
                      ) : null}
                    </span>
                    <span className="nums shrink-0 font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <Separator className="my-4" />

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="nums font-medium">{formatCurrency(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="nums font-medium">{formatCurrency(order.tax)}</dd>
                </div>
                {order.discount > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Discount</dt>
                    <dd className="nums font-medium text-success">
                      −{formatCurrency(order.discount)}
                    </dd>
                  </div>
                ) : null}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold">
                  <dt>Total</dt>
                  <dd className="nums">{formatCurrency(order.grandTotal)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <PaymentPanel order={order} onPaid={setOrder} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
