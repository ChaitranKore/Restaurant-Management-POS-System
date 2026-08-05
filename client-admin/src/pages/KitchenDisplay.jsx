import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, GripVertical, Volume2, VolumeX } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useSocket } from '@/context/SocketContext';
import { playNewOrderChime, useTicker } from '@/lib/use-ticker';
import { cn, elapsedSince, minutesSince } from '@/lib/utils';

const COLUMNS = [
  { status: 'pending', title: 'New', next: 'confirmed', nextLabel: 'Confirm' },
  { status: 'confirmed', title: 'Confirmed', next: 'preparing', nextLabel: 'Start' },
  { status: 'preparing', title: 'Preparing', next: 'ready', nextLabel: 'Ready' },
  { status: 'ready', title: 'Ready', next: 'served', nextLabel: 'Served' },
];
const BOARD_STATUSES = COLUMNS.map((column) => column.status);

/* How long a ticket has been open, as a colour. The whole point of a KDS is
   that the oldest ticket is visible from across the pass — thresholds in
   minutes, tuned so a ticket goes amber around the time a diner starts
   wondering, and red when it is genuinely late. */
function ageTone(minutes) {
  if (minutes >= 10) return { text: 'text-timer-late', ring: 'ring-timer-late/45', bar: 'bg-timer-late' };
  if (minutes >= 5) return { text: 'text-timer-warn', ring: 'ring-timer-warn/40', bar: 'bg-timer-warn' };
  return { text: 'text-timer-fresh', ring: 'ring-white/10', bar: 'bg-timer-fresh' };
}

function TicketBody({ order, isNew }) {
  const minutes = minutesSince(order.createdAt);
  const tone = ageTone(minutes);

  const destination =
    order.orderType === 'dine-in'
      ? order.table
        ? `Table ${order.table.number}`
        : 'Dine in'
      : `Takeaway${order.guestName ? ` · ${order.guestName}` : ''}`;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-card shadow-sm ring-1',
        tone.ring,
        isNew && 'ring-2 ring-primary'
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', tone.bar)} aria-hidden="true" />

      <div className="flex items-start gap-2 px-3.5 pb-2 pt-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-bold">{order.orderNumber}</p>
          <p className="truncate text-xs text-muted-foreground">{destination}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn('nums text-lg font-bold leading-none', tone.text)}>
            {elapsedSince(order.createdAt)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">elapsed</p>
        </div>
        <GripVertical
          className="mt-0.5 size-4 shrink-0 cursor-grab text-muted-foreground/40"
          aria-hidden="true"
        />
      </div>

      <ul className="space-y-1 px-3.5 pb-2">
        {order.items.map((item) => (
          <li key={item.menuItem} className="flex gap-2 text-sm leading-snug">
            <span className="nums shrink-0 font-bold text-primary">{item.quantity}×</span>
            <span className="min-w-0">
              {item.name}
              {item.notes ? (
                <span className="block text-xs italic text-warning">{item.notes}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {order.notes ? (
        <p className="mx-3.5 mb-2 rounded-md bg-warning/15 px-2 py-1 text-xs italic text-warning">
          {order.notes}
        </p>
      ) : null}
    </div>
  );
}

function Ticket({ order, column, isNew, onAdvance }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order._id,
    data: { status: order.status },
  });

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    >
      <div ref={setNodeRef} {...listeners} {...attributes} className="touch-none">
        <TicketBody order={order} isNew={isNew} />
      </div>
      {/* Dragging is the quick path for anyone on a mouse; the button is what
          actually gets used on a greasy tablet mid-service. */}
      <Button
        size="touch"
        block
        className="mt-1.5"
        onClick={() => onAdvance(order._id, column.next)}
      >
        {column.nextLabel}
        <ArrowRight />
      </Button>
    </motion.li>
  );
}

function Column({ column, orders, newIds, onAdvance }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex min-h-0 flex-col rounded-xl border transition-colors',
        isOver ? 'border-primary bg-primary/8' : 'border-border bg-muted/35'
      )}
    >
      <header className="flex shrink-0 items-center gap-2 px-3 py-2.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide">{column.title}</h2>
        <span className="nums grid min-w-6 place-items-center rounded-full bg-background px-1.5 py-0.5 text-xs font-bold">
          {orders.length}
        </span>
      </header>

      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2.5 pb-2.5">
        <AnimatePresence initial={false}>
          {orders.map((order) => (
            <Ticket
              key={order._id}
              order={order}
              column={column}
              isNew={newIds.has(order._id)}
              onAdvance={onAdvance}
            />
          ))}
        </AnimatePresence>

        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing here</p>
        ) : null}
      </ul>
    </section>
  );
}

export default function KitchenDisplay() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [newIds, setNewIds] = useState(() => new Set());
  const [soundOn, setSoundOn] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  // Read inside the socket handler, which is registered once — state would be
  // captured stale there.
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  // One interval keeps every ticket's elapsed clock moving.
  useTicker(1000);

  const sensors = useSensors(
    // A small threshold so tapping a ticket doesn't register as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    let cancelled = false;
    api
      .get('/orders')
      .then((res) => {
        if (!cancelled) setOrders(res.data.filter((order) => BOARD_STATUSES.includes(order.status)));
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load the board.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const onNewOrder = (order) => {
      setOrders((previous) =>
        previous.some((existing) => existing._id === order._id) ? previous : [order, ...previous]
      );
      setNewIds((previous) => new Set(previous).add(order._id));
      if (soundOnRef.current) playNewOrderChime();
      toast(`New order ${order.orderNumber}`, {
        description: order.items.map((item) => `${item.quantity}× ${item.name}`).join(', '),
      });
      setTimeout(() => {
        setNewIds((previous) => {
          const next = new Set(previous);
          next.delete(order._id);
          return next;
        });
      }, 6000);
    };

    const onStatusUpdate = (updated) => {
      setOrders((previous) => {
        if (!BOARD_STATUSES.includes(updated.status)) {
          return previous.filter((order) => order._id !== updated._id);
        }
        return previous.some((order) => order._id === updated._id)
          ? previous.map((order) => (order._id === updated._id ? updated : order))
          : [updated, ...previous];
      });
    };

    socket.on('order:new', onNewOrder);
    socket.on('order:statusUpdate', onStatusUpdate);
    return () => {
      socket.off('order:new', onNewOrder);
      socket.off('order:statusUpdate', onStatusUpdate);
    };
  }, [socket]);

  const advance = useCallback(async (orderId, status) => {
    // Move the ticket immediately — the board is read at a glance, and a
    // round-trip of lag reads as an unresponsive tap. The socket echo
    // reconciles; a failure rolls the ticket back.
    let snapshot;
    setOrders((previous) => {
      snapshot = previous;
      if (!BOARD_STATUSES.includes(status)) {
        return previous.filter((order) => order._id !== orderId);
      }
      return previous.map((order) => (order._id === orderId ? { ...order, status } : order));
    });

    try {
      await api.patch(`/orders/${orderId}/status`, { status });
    } catch (err) {
      setOrders(snapshot);
      const message = err.response?.data?.message || 'Could not update that order.';
      setError(message);
      toast.error('Update failed', { description: message });
    }
  }, []);

  const ordersByColumn = useMemo(() => {
    const map = Object.fromEntries(BOARD_STATUSES.map((status) => [status, []]));
    for (const order of orders) {
      if (map[order.status]) map[order.status].push(order);
    }
    // Oldest first: the ticket waiting longest is the one to pick up next.
    for (const status of BOARD_STATUSES) {
      map[status].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    return map;
  }, [orders]);

  const draggingOrder = draggingId ? orders.find((order) => order._id === draggingId) : null;

  const handleDragEnd = ({ active, over }) => {
    setDraggingId(null);
    if (!over) return;
    const target = over.id;
    const current = active.data.current?.status;
    if (!BOARD_STATUSES.includes(target) || target === current) return;
    advance(active.id, target);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    // Play immediately, so the tap doubles as the gesture that unlocks audio.
    if (next) playNewOrderChime();
  };

  return (
    <Layout
      title="Kitchen Display"
      subtitle="Live tickets — oldest first"
      bleed
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSound}
          className="h-9"
          aria-pressed={soundOn}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
          <span className="hidden sm:inline">{soundOn ? 'Sound on' : 'Sound off'}</span>
        </Button>
      }
    >
      {/* Forced dark: a kitchen display hangs on a wall in a bright room and is
          read at distance, where a light UI glares. The `dark` class re-points
          the design tokens for this subtree only. */}
      <div className="dark flex h-[calc(100dvh-4rem)] flex-col bg-background p-3 text-foreground">
        {error ? (
          <p className="mb-2 shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setDraggingId(active.id)}
          onDragCancel={() => setDraggingId(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 xl:grid-cols-4">
            {COLUMNS.map((column) => (
              <Column
                key={column.status}
                column={column}
                orders={ordersByColumn[column.status]}
                newIds={newIds}
                onAdvance={advance}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {draggingOrder ? (
              <div className="w-72 rotate-2 opacity-95">
                <TicketBody order={draggingOrder} isNew={false} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </Layout>
  );
}
