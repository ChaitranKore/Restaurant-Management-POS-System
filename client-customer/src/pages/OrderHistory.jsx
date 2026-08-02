import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders/my')
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container page">Loading...</div>;

  return (
    <div className="container page">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p className="empty-state">You haven't placed any orders yet.</p>
      ) : (
        orders.map((order) => (
          <Link to={`/orders/${order._id}`} key={order._id} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{order.orderNumber}</strong>
                <span className="badge">{order.status}</span>
              </div>
              <div style={{ color: '#756b64', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {new Date(order.createdAt).toLocaleString()} · ${order.grandTotal.toFixed(2)} ·{' '}
                {order.paymentStatus}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
