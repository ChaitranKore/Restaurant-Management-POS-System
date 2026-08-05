import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Delete,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { cn, formatCurrency } from '@/lib/utils';

const TAX_RATE = 0.05;

/** Large tap targets — this runs on a counter tablet, used at speed. */
function MenuTile({ item, quantity, onAdd }) {
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      className={cn(
        'relative flex h-24 flex-col justify-between rounded-xl border p-3 text-left transition-all active:scale-[0.98]',
        quantity > 0
          ? 'border-primary bg-primary/8 ring-[3px] ring-ring/20'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
      )}
    >
      <span className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</span>
      <span className="nums text-sm font-bold text-primary">{formatCurrency(item.price)}</span>
      {quantity > 0 ? (
        <span className="nums absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {quantity}
        </span>
      ) : null}
    </button>
  );
}

/** Visual floor plan instead of a dropdown — staff think in table positions. */
function TablePicker({ tables, value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {tables.map((table) => {
        const selected = value === table._id;
        const occupied = table.status === 'occupied';
        return (
          <button
            key={table._id}
            type="button"
            onClick={() => onChange(selected ? '' : table._id)}
            title={`Table ${table.number} · seats ${table.capacity} · ${table.status}`}
            className={cn(
              'flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-semibold transition-all active:scale-95',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : occupied
                  ? 'border-warning/40 bg-warning/12 text-warning'
                  : 'border-border bg-card hover:border-primary/50'
            )}
          >
            <span className="nums text-sm">{table.number}</span>
            <span className="nums text-[10px] font-normal opacity-70">{table.capacity}p</span>
          </button>
        );
      })}
    </div>
  );
}

/** Keypad for cash tendered — faster and less error-prone than a soft keyboard. */
function CashKeypad({ value, onChange, total }) {
  const press = (key) => {
    if (key === 'del') return onChange(value.slice(0, -1));
    if (key === '.' && value.includes('.')) return undefined;
    // Don't let cents run past two digits.
    if (value.includes('.') && value.split('.')[1]?.length >= 2 && key !== 'del') return undefined;
    return onChange(value + key);
  };

  const tendered = Number(value || 0);
  const change = tendered - total;

  // Quick amounts a till actually gets handed.
  const presets = [total, Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10]
    .filter((amount, index, all) => amount > 0 && all.indexOf(amount) === index)
    .slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/50 p-3 text-right">
        <p className="text-xs text-muted-foreground">Cash tendered</p>
        <p className="nums text-2xl font-bold">{value ? formatCurrency(tendered) : '—'}</p>
        {value && change >= 0 ? (
          <p className="nums mt-1 text-sm font-semibold text-success">
            Change due {formatCurrency(change)}
          </p>
        ) : value ? (
          <p className="nums mt-1 text-sm font-semibold text-destructive">
            {formatCurrency(Math.abs(change))} short
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(amount.toFixed(2))}
          >
            {formatCurrency(amount)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((key) => (
          <Button
            key={key}
            type="button"
            variant={key === 'del' ? 'secondary' : 'outline'}
            className="h-12 text-base"
            onClick={() => press(key)}
            aria-label={key === 'del' ? 'Delete last digit' : key}
          >
            {key === 'del' ? <Delete className="size-4" /> : key}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function POS() {
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [cart, setCart] = useState([]); // { menuItem, name, price, quantity }
  const [orderType, setOrderType] = useState('dine-in');
  const [tableId, setTableId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [placedOrder, setPlacedOrder] = useState(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [tendered, setTendered] = useState('');
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/menu?all=true'), api.get('/tables')])
      .then(([menuRes, tablesRes]) => {
        setMenu(menuRes.data.filter((item) => item.isAvailable));
        setTables(tablesRes.data);
      })
      .catch(() => setError('Could not load the menu.'))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (item) => {
    setCart((previous) => {
      const existing = previous.find((line) => line.menuItem === item._id);
      if (existing) {
        return previous.map((line) =>
          line.menuItem === item._id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...previous, { menuItem: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const changeQuantity = (menuItem, delta) => {
    setCart((previous) =>
      previous
        .map((line) => (line.menuItem === menuItem ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const quantities = useMemo(
    () => Object.fromEntries(cart.map((line) => [line.menuItem, line.quantity])),
    [cart]
  );

  const groupedMenu = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    const visible = normalised
      ? menu.filter((item) => item.name.toLowerCase().includes(normalised))
      : menu;

    const groups = new Map();
    for (const item of visible) {
      const name = item.category?.name ?? 'Uncategorised';
      if (!groups.has(name)) {
        groups.set(name, { order: item.category?.displayOrder ?? 999, items: [] });
      }
      groups.get(name).items.push(item);
    }

    // Follow the menu's own category order — otherwise the tiles come out in
    // whatever sequence the items happened to arrive in, and desserts lead.
    return [...groups.entries()]
      .sort(([nameA, a], [nameB, b]) => a.order - b.order || nameA.localeCompare(nameB))
      .map(([name, group]) => [name, group.items]);
  }, [menu, query]);

  const placeOrder = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/orders', {
        items: cart.map(({ menuItem, quantity }) => ({ menuItem, quantity })),
        orderType,
        table: orderType === 'dine-in' ? tableId || undefined : undefined,
        guestName,
      });
      setPlacedOrder(res.data);
      setCart([]);
      toast.success(`Order ${res.data.orderNumber} sent to the kitchen`);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not place the order.';
      setError(message);
      toast.error('Order failed', { description: message });
    } finally {
      setBusy(false);
    }
  };

  const pay = async (event) => {
    event.preventDefault();
    setPayError('');
    setPayBusy(true);
    try {
      const body =
        payMethod === 'card'
          ? { orderId: placedOrder._id, method: 'card', ...card }
          : { orderId: placedOrder._id, method: 'cash', tenderedAmount: Number(tendered) };
      const res = await api.post('/payments', body);
      setPlacedOrder(res.data.order);
      const change = res.data.payment?.changeDue;
      toast.success('Payment recorded', {
        description: change > 0 ? `Change due ${formatCurrency(change)}` : undefined,
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Payment failed.';
      setPayError(message);
      toast.error('Payment declined', { description: message });
    } finally {
      setPayBusy(false);
    }
  };

  const startNewOrder = () => {
    setPlacedOrder(null);
    setTendered('');
    setCard({ cardNumber: '', expiry: '', cvv: '' });
    setPayError('');
    setTableId('');
    setGuestName('');
    setQuery('');
  };

  if (placedOrder) {
    const paid = placedOrder.paymentStatus === 'paid';

    return (
      <Layout title="New Order" subtitle={`Order ${placedOrder.orderNumber}`}>
        <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2 lg:items-start">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                <CardTitle>Sent to the kitchen</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5 text-sm">
                {placedOrder.items.map((item) => (
                  <li key={item.menuItem} className="flex justify-between gap-3">
                    <span>
                      <span className="nums font-semibold">{item.quantity}×</span> {item.name}
                    </span>
                    <span className="nums font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <Separator className="my-3" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="nums">{formatCurrency(placedOrder.grandTotal)}</span>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" block onClick={startNewOrder}>
                  Start another order
                </Button>
                <Button variant="ghost" block asChild>
                  <Link to="/kitchen">View kitchen board</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {paid ? (
                <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/8 p-4">
                  <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-success">Paid in full</p>
                    <p className="nums text-sm text-muted-foreground">
                      {formatCurrency(placedOrder.grandTotal)} settled.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={pay} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'cash', label: 'Cash', icon: Banknote },
                      { value: 'card', label: 'Card', icon: CreditCard },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPayMethod(value)}
                        aria-pressed={payMethod === value}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-all',
                          payMethod === value
                            ? 'border-primary bg-primary/8 ring-[3px] ring-ring/20'
                            : 'border-border bg-card hover:border-primary/40'
                        )}
                      >
                        <Icon
                          className={cn(
                            'size-4',
                            payMethod === value ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        {label}
                      </button>
                    ))}
                  </div>

                  {payMethod === 'cash' ? (
                    <CashKeypad value={tendered} onChange={setTendered} total={placedOrder.grandTotal} />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cardNumber">Card number</Label>
                        <Input
                          id="cardNumber"
                          inputMode="numeric"
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
                            placeholder="123"
                            value={card.cvv}
                            onChange={(event) => setCard({ ...card, cvv: event.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {payError ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive">
                      {payError}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    size="touch"
                    block
                    loading={payBusy}
                    disabled={payMethod === 'cash' && Number(tendered || 0) < placedOrder.grandTotal}
                  >
                    Charge {formatCurrency(placedOrder.grandTotal)}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="New Order" subtitle="Walk-in and counter orders">
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div>
          <div className="relative mb-4">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find an item…"
              aria-label="Find a menu item"
              className="h-11 pl-9"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : groupedMenu.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No items match"
              description="Try a different search term."
            />
          ) : (
            <div className="space-y-6">
              {groupedMenu.map(([categoryName, items]) => (
                <section key={categoryName}>
                  <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {categoryName}
                  </h2>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                    {items.map((item) => (
                      <MenuTile
                        key={item._id}
                        item={item}
                        quantity={quantities[item._id] ?? 0}
                        onAdd={addToCart}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <Card className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Current order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {cart.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No items yet"
                description="Tap a menu item to start the check."
                className="py-8"
              />
            ) : (
              <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                <AnimatePresence initial={false}>
                  {cart.map((line) => (
                    <motion.li
                      key={line.menuItem}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 overflow-hidden py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{line.name}</p>
                        <p className="nums text-xs text-muted-foreground">
                          {formatCurrency(line.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 rounded-lg border border-border">
                        <button
                          type="button"
                          aria-label={`Remove one ${line.name}`}
                          onClick={() => changeQuantity(line.menuItem, -1)}
                          className="grid size-7 place-items-center rounded-l-lg transition-colors hover:bg-accent"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="nums min-w-6 text-center text-sm font-semibold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Add another ${line.name}`}
                          onClick={() => changeQuantity(line.menuItem, 1)}
                          className="grid size-7 place-items-center rounded-r-lg transition-colors hover:bg-accent"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="nums w-14 shrink-0 text-right text-sm font-semibold">
                        {formatCurrency(line.price * line.quantity)}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {cart.length > 0 ? (
              <>
                <Separator />
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="nums font-medium">{formatCurrency(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tax (5%)</dt>
                    <dd className="nums font-medium">{formatCurrency(tax)}</dd>
                  </div>
                  <div className="flex justify-between pt-1 text-base font-bold">
                    <dt>Total</dt>
                    <dd className="nums">{formatCurrency(total)}</dd>
                  </div>
                </dl>
                <Separator />
              </>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'dine-in', label: 'Dine in', icon: UtensilsCrossed },
                { value: 'takeaway', label: 'Takeaway', icon: Store },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrderType(value)}
                  aria-pressed={orderType === value}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-semibold transition-all',
                    orderType === value
                      ? 'border-primary bg-primary/8 ring-[3px] ring-ring/20'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4',
                      orderType === value ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  {label}
                </button>
              ))}
            </div>

            {orderType === 'dine-in' ? (
              <div className="space-y-1.5">
                <Label>Table</Label>
                <TablePicker tables={tables} value={tableId} onChange={setTableId} />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="guestName">Guest name</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  placeholder="For calling out the order"
                />
              </div>
            )}

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}

            <Button
              size="touch"
              block
              loading={busy}
              disabled={cart.length === 0}
              onClick={placeOrder}
            >
              {cart.length === 0 ? 'Add items to continue' : `Send to kitchen · ${formatCurrency(total)}`}
            </Button>

            {cart.length > 0 ? (
              <Button variant="ghost" size="sm" block onClick={() => setCart([])}>
                <Trash2 />
                Clear order
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
