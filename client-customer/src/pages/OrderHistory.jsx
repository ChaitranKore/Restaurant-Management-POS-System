import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Receipt, Store, UtensilsCrossed } from 'lucide-react';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PaymentBadge, StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDateTime, relativeTime } from '@/lib/utils';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

function OrderRow({ order, index }) {
  const isActive = ACTIVE_STATUSES.includes(order.status);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.24) }}
    >
      <Link to={`/orders/${order._id}`} className="block">
        <Card interactive className="p-4">
          <div className="flex items-center gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              {order.orderType === 'dine-in' ? (
                <UtensilsCrossed className="size-4.5" aria-hidden="true" />
              ) : (
                <Store className="size-4.5" aria-hidden="true" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                <StatusBadge status={order.status} pulse={isActive} />
                <PaymentBadge paid={order.paymentStatus === 'paid'} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <time dateTime={new Date(order.createdAt).toISOString()}>
                  {formatDateTime(order.createdAt)}
                </time>
                {' · '}
                {itemCount} item{itemCount === 1 ? '' : 's'}
                {isActive ? ` · ${relativeTime(order.createdAt)}` : ''}
              </p>
            </div>

            <span className="nums shrink-0 font-semibold">{formatCurrency(order.grandTotal)}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/orders/my')
      .then((res) => {
        if (!cancelled) setOrders(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your orders.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const past = orders.filter((order) => !ACTIVE_STATUSES.includes(order.status));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
      <h1 className="font-display text-3xl">My orders</h1>
      <p className="mt-1 text-muted-foreground">Track what's cooking and revisit what you've had.</p>

      {loading ? (
        <div className="mt-7 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[74px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-7 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <EmptyState
          className="mt-7"
          icon={Receipt}
          title="No orders yet"
          description="When you place your first order it'll appear here, with live kitchen updates."
          action={
            <Button asChild>
              <Link to="/menu">Browse the menu</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-7 space-y-8">
          {active.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                In progress
              </h2>
              <div className="space-y-3">
                {active.map((order, index) => (
                  <OrderRow key={order._id} order={order} index={index} />
                ))}
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Past orders
              </h2>
              <div className="space-y-3">
                {past.map((order, index) => (
                  <OrderRow key={order._id} order={order} index={index} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
