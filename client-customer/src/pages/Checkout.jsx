import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Minus, Plus, ShoppingBag, Store, Trash2, UtensilsCrossed } from 'lucide-react';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn, formatCurrency } from '@/lib/utils';

function OrderTypeToggle({ value, onChange }) {
  const options = [
    { value: 'dine-in', label: 'Dine in', icon: UtensilsCrossed, blurb: 'Served to your table' },
    { value: 'takeaway', label: 'Takeaway', icon: Store, blurb: 'Collect at the counter' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(({ value: optionValue, label, icon: Icon, blurb }) => {
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={selected}
            className={cn(
              'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
              selected
                ? 'border-primary bg-primary/8 ring-[3px] ring-ring/20'
                : 'border-border bg-card hover:border-primary/40'
            )}
          >
            <Icon className={cn('size-4.5', selected ? 'text-primary' : 'text-muted-foreground')} />
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground">{blurb}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Checkout() {
  const { items, updateQuantity, removeItem, subtotal, tax, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('dine-in');
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/tables')
      .then((res) => setTables(res.data))
      .catch(() => {
        /* the table list is optional — an order can still be placed without one */
      });
  }, []);

  const placeOrder = async () => {
    if (!user) {
      // Come back here after logging in rather than dumping them on the menu.
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/orders', {
        items: items.map(({ menuItem, quantity, notes: itemNotes }) => ({
          menuItem,
          quantity,
          notes: itemNotes,
        })),
        orderType,
        table: orderType === 'dine-in' ? tableId || undefined : undefined,
        notes,
      });
      clearCart();
      toast.success('Order sent to the kitchen', { description: `Order ${res.data.orderNumber}` });
      navigate(`/orders/${res.data._id}`);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not place your order.';
      setError(message);
      toast.error('Order failed', { description: message });
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Once you add a few dishes from the menu, they'll show up here ready to order."
          action={
            <Button asChild>
              <Link to="/">Browse the menu</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:pb-12">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground">
        <Link to="/">
          <ArrowLeft />
          Back to menu
        </Link>
      </Button>

      <h1 className="font-display text-3xl">Checkout</h1>
      <p className="mt-1 text-muted-foreground">Review your order, then send it to the kitchen.</p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Your items</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul>
                <AnimatePresence initial={false}>
                  {items.map((item, index) => (
                    <motion.li
                      key={item.menuItem}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {index > 0 ? <Separator /> : null}
                      <div className="flex items-center gap-3 py-3">
                        <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="grid size-full place-items-center">
                              <UtensilsCrossed
                                className="size-5 text-muted-foreground/50"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{item.name}</p>
                          <p className="nums text-sm text-muted-foreground">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>

                        <div className="hidden items-center gap-0.5 rounded-lg border border-border sm:flex">
                          <button
                            type="button"
                            aria-label={`Remove one ${item.name}`}
                            onClick={() => updateQuantity(item.menuItem, item.quantity - 1)}
                            className="grid size-8 place-items-center rounded-l-lg transition-colors hover:bg-accent"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="nums min-w-7 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Add another ${item.name}`}
                            onClick={() => updateQuantity(item.menuItem, item.quantity + 1)}
                            className="grid size-8 place-items-center rounded-r-lg transition-colors hover:bg-accent"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>

                        <span className="nums w-16 shrink-0 text-right font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItem(item.menuItem)}
                          aria-label={`Remove ${item.name}`}
                          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* On narrow screens the stepper moves onto its own line
                          rather than squeezing the name and price into nothing. */}
                      <div className="pb-3 pl-19 sm:hidden">
                        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border">
                          <button
                            type="button"
                            aria-label={`Remove one ${item.name}`}
                            onClick={() => updateQuantity(item.menuItem, item.quantity - 1)}
                            className="grid size-8 place-items-center rounded-l-lg transition-colors hover:bg-accent"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="nums min-w-7 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Add another ${item.name}`}
                            onClick={() => updateQuantity(item.menuItem, item.quantity + 1)}
                            className="grid size-8 place-items-center rounded-r-lg transition-colors hover:bg-accent"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How are you dining?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <OrderTypeToggle value={orderType} onChange={setOrderType} />

              {orderType === 'dine-in' ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="table">Table</Label>
                  <Select value={tableId} onValueChange={setTableId}>
                    <SelectTrigger id="table">
                      <SelectValue placeholder="Select a table (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => (
                        <SelectItem key={table._id} value={table._id}>
                          Table {table.number} · seats {table.capacity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Special instructions</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Allergies, spice level, anything the kitchen should know…"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="nums font-medium">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax (5%)</dt>
                <dd className="nums font-medium">{formatCurrency(tax)}</dd>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd className="nums">{formatCurrency(total)}</dd>
              </div>
            </dl>

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}

            <Button size="lg" block loading={busy} onClick={placeOrder}>
              {user ? `Place order · ${formatCurrency(total)}` : 'Log in to place order'}
            </Button>

            <p className="text-center text-xs text-muted-foreground text-pretty">
              You'll pay after ordering — by card or cash at the counter.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
