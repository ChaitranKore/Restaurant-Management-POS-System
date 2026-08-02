import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/orders', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const cancelOrder = async (id) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: 'cancelled' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel order');
    }
  };

  return (
    <Layout>
      <div className="topbar">
        <h1>Orders</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? s : 'All statuses'}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p className="empty-state">No orders found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Type</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Placed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.orderNumber}</td>
                <td>
                  {order.orderType}
                  {order.table ? ` · T${order.table.number}` : ''}
                </td>
                <td>{order.items.map((i) => `${i.quantity}×${i.name}`).join(', ')}</td>
                <td>${order.grandTotal.toFixed(2)}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
                <td>
                  <span className={`badge ${order.paymentStatus}`}>{order.paymentStatus}</span>
                </td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>
                  {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                    <button className="btn danger" onClick={() => cancelOrder(order._id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
