import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';

const COLUMNS = [
  { status: 'pending', title: 'New', next: 'confirmed', nextLabel: 'Confirm' },
  { status: 'confirmed', title: 'Confirmed', next: 'preparing', nextLabel: 'Start Preparing' },
  { status: 'preparing', title: 'Preparing', next: 'ready', nextLabel: 'Mark Ready' },
  { status: 'ready', title: 'Ready', next: 'served', nextLabel: 'Mark Served' },
];
const BOARD_STATUSES = COLUMNS.map((c) => c.status);

export default function KitchenDisplay() {
  const { socket, connected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [recentIds, setRecentIds] = useState(new Set());

  useEffect(() => {
    api
      .get('/orders')
      .then((res) => setOrders(res.data.filter((o) => BOARD_STATUSES.includes(o.status))))
      .catch((err) => setError(err.response?.data?.message || 'Could not load orders'));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNewOrder = (order) => {
      setOrders((prev) => [order, ...prev]);
      setRecentIds((prev) => new Set(prev).add(order._id));
      setTimeout(() => {
        setRecentIds((prev) => {
          const next = new Set(prev);
          next.delete(order._id);
          return next;
        });
      }, 2500);
    };

    const onStatusUpdate = (updated) => {
      setOrders((prev) => {
        if (!BOARD_STATUSES.includes(updated.status)) {
          return prev.filter((o) => o._id !== updated._id);
        }
        const exists = prev.some((o) => o._id === updated._id);
        return exists ? prev.map((o) => (o._id === updated._id ? updated : o)) : [updated, ...prev];
      });
    };

    socket.on('order:new', onNewOrder);
    socket.on('order:statusUpdate', onStatusUpdate);
    return () => {
      socket.off('order:new', onNewOrder);
      socket.off('order:statusUpdate', onStatusUpdate);
    };
  }, [socket]);

  const advance = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update order');
    }
  };

  const ordersByColumn = useMemo(() => {
    const map = Object.fromEntries(BOARD_STATUSES.map((s) => [s, []]));
    for (const order of orders) {
      if (map[order.status]) map[order.status].push(order);
    }
    return map;
  }, [orders]);

  return (
    <Layout>
      <div className="topbar">
        <h1>Kitchen Display</h1>
        <span className="badge" style={{ background: connected ? '#e3f7e8' : '#fdecec' }}>
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="kanban">
        {COLUMNS.map((col) => (
          <div className="kanban-column" key={col.status}>
            <h3>
              {col.title} ({ordersByColumn[col.status].length})
            </h3>
            {ordersByColumn[col.status].map((order) => (
              <div className={`order-ticket ${recentIds.has(order._id) ? 'new' : ''}`} key={order._id}>
                <div className="order-num">{order.orderNumber}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7684' }}>
                  {order.orderType === 'dine-in'
                    ? order.table
                      ? `Table ${order.table.number}`
                      : 'Dine-in'
                    : 'Takeaway'}
                </div>
                <div className="items">
                  {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </div>
                {order.notes && <div style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Note: {order.notes}</div>}
                <div className="actions">
                  <button className="btn" onClick={() => advance(order._id, col.next)}>
                    {col.nextLabel}
                  </button>
                </div>
              </div>
            ))}
            {ordersByColumn[col.status].length === 0 && (
              <p style={{ color: '#9aa5b1', fontSize: '0.85rem', textAlign: 'center' }}>No orders</p>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
