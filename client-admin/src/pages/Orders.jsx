import { useEffect, useMemo, useState } from 'react';
import { Ban, ReceiptText, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaymentBadge, StatusBadge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { useSocket } from '@/context/SocketContext';
import { cn, formatCurrency, formatDateTime, relativeTime } from '@/lib/utils';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'served', label: 'Served' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CANCELLABLE = ['pending', 'confirmed', 'preparing'];

function OrderDetail({ order, onClose, onCancel }) {
  return (
    <Sheet open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {order ? (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono">{order.orderNumber}</SheetTitle>
              <SheetDescription>
                {formatDateTime(order.createdAt)} · {relativeTime(order.createdAt)}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={order.status} />
                <PaymentBadge paid={order.paymentStatus === 'paid'} />
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Items
                </h3>
                <ul className="space-y-2 text-sm">
                  {order.items.map((item) => (
                    <li key={item.menuItem} className="flex justify-between gap-3">
                      <span>
                        <span className="nums font-semibold">{item.quantity}×</span> {item.name}
                        {item.notes ? (
                          <span className="block text-xs italic text-muted-foreground">
                            {item.notes}
                          </span>
                        ) : null}
                      </span>
                      <span className="nums shrink-0 font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium capitalize">
                    {order.orderType}
                    {order.table ? ` · Table ${order.table.number}` : ''}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="nums font-medium">{formatCurrency(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="nums font-medium">{formatCurrency(order.tax)}</dd>
                </div>
                <Separator className="my-1.5" />
                <div className="flex justify-between text-base font-bold">
                  <dt>Total</dt>
                  <dd className="nums">{formatCurrency(order.grandTotal)}</dd>
                </div>
              </dl>

              {order.notes ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Notes
                    </h3>
                    <p className="text-sm italic text-muted-foreground">{order.notes}</p>
                  </div>
                </>
              ) : null}

              {order.statusHistory?.length ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      History
                    </h3>
                    <ol className="space-y-1.5 text-sm">
                      {order.statusHistory.map((entry, index) => (
                        <li key={`${entry.status}-${index}`} className="flex justify-between gap-3">
                          <span className="capitalize">{entry.status}</span>
                          <span className="nums text-muted-foreground">
                            {formatDateTime(entry.at)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : null}
            </div>

            {CANCELLABLE.includes(order.status) ? (
              <div className="border-t border-border p-5">
                <Button variant="destructive" block onClick={() => onCancel(order)}>
                  <Ban />
                  Cancel this order
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default function Orders() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/orders', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => {
        if (!cancelled) setOrders(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load orders.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  // Keep the list live rather than making staff refresh to see the kitchen move.
  useEffect(() => {
    if (!socket) return undefined;
    const onUpdate = (updated) => {
      setOrders((previous) =>
        previous.map((order) => (order._id === updated._id ? updated : order))
      );
      setSelected((current) => (current?._id === updated._id ? updated : current));
    };
    socket.on('order:statusUpdate', onUpdate);
    return () => socket.off('order:statusUpdate', onUpdate);
  }, [socket]);

  const visible = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    if (!normalised) return orders;
    return orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(normalised) ||
        order.items.some((item) => item.name.toLowerCase().includes(normalised))
    );
  }, [orders, query]);

  const confirmCancel = async () => {
    setCancelBusy(true);
    try {
      const res = await api.patch(`/orders/${pendingCancel._id}/status`, { status: 'cancelled' });
      setOrders((previous) =>
        previous.map((order) => (order._id === res.data._id ? res.data : order))
      );
      setSelected(null);
      setPendingCancel(null);
      toast.success(`Order ${res.data.orderNumber} cancelled`);
    } catch (err) {
      toast.error('Could not cancel', {
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <Layout title="Orders" subtitle={`${visible.length} order${visible.length === 1 ? '' : 's'}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Order number or item…"
            aria-label="Search orders"
            className="pl-9"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === filter.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No orders found"
            description={
              query || statusFilter
                ? 'Try clearing the search or filter.'
                : 'Orders will appear here as they come in.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Payment</TableHead>
                <TableHead className="hidden lg:table-cell">Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => (
                <TableRow key={order._id} interactive onClick={() => setSelected(order)}>
                  <TableCell className="font-mono font-semibold">{order.orderNumber}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {order.orderType}
                    {order.table ? ` · T${order.table.number}` : ''}
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate text-muted-foreground md:table-cell">
                    {order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                  </TableCell>
                  <TableCell className="nums font-semibold">
                    {formatCurrency(order.grandTotal)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <PaymentBadge paid={order.paymentStatus === 'paid'} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {relativeTime(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <OrderDetail order={selected} onClose={() => setSelected(null)} onCancel={setPendingCancel} />

      <Dialog open={Boolean(pendingCancel)} onOpenChange={(open) => !open && setPendingCancel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel order {pendingCancel?.orderNumber}?</DialogTitle>
            <DialogDescription>
              The kitchen will see it disappear from the board immediately. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingCancel(null)}>
              Keep it
            </Button>
            <Button variant="destructive" loading={cancelBusy} onClick={confirmCancel}>
              Cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
