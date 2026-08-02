import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'];

export default function OrderTracking() {
  const { id } = useParams();
  const { socket } = useSocket();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [payMethod, setPayMethod] = useState('card');
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [cash, setCash] = useState('');
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState('');
  const [payMessage, setPayMessage] = useState('');

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load order'));
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('order:subscribe', id);
    const onUpdate = (updated) => {
      if (updated._id === id) setOrder(updated);
    };
    socket.on('order:statusUpdate', onUpdate);
    return () => {
      socket.emit('order:unsubscribe', id);
      socket.off('order:statusUpdate', onUpdate);
    };
  }, [socket, id]);

  const pay = async (e) => {
    e.preventDefault();
    setPayError('');
    setPayMessage('');
    setPayBusy(true);
    try {
      const body =
        payMethod === 'card'
          ? { orderId: id, method: 'card', ...card }
          : { orderId: id, method: 'cash', tenderedAmount: Number(cash) };
      const res = await api.post('/payments', body);
      setOrder(res.data.order);
      setPayMessage('Payment successful!');
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payment failed');
    } finally {
      setPayBusy(false);
    }
  };

  if (error) return <div className="container page error">{error}</div>;
  if (!order) return <div className="container page">Loading order...</div>;

  const currentStepIndex = STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="container page">
      <h1>Order {order.orderNumber}</h1>
      <p className="badge">{order.orderType === 'dine-in' ? `Dine-in${order.table ? ` · Table ${order.table.number}` : ''}` : 'Takeaway'}</p>

      {isCancelled ? (
        <p className="error">This order has been cancelled.</p>
      ) : (
        <div className="status-track">
          {STEPS.map((step, i) => (
            <div className={`status-step ${i <= currentStepIndex ? 'done' : ''}`} key={step}>
              <div className="dot" />
              {step}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Items</h3>
        {order.items.map((item) => (
          <div className="order-summary-line" key={item.menuItem}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="order-summary-line">
          <span>Subtotal</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="order-summary-line">
          <span>Tax</span>
          <span>${order.tax.toFixed(2)}</span>
        </div>
        <div className="order-summary-line total">
          <span>Total</span>
          <span>${order.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Payment</h3>
        {order.paymentStatus === 'paid' ? (
          <p className="success">Paid ✓</p>
        ) : (
          <form onSubmit={pay}>
            <div className="tabs-row">
              <button type="button" className={payMethod === 'card' ? 'active' : ''} onClick={() => setPayMethod('card')}>
                Card
              </button>
              <button type="button" className={payMethod === 'cash' ? 'active' : ''} onClick={() => setPayMethod('cash')}>
                Cash at counter
              </button>
            </div>

            {payMethod === 'card' ? (
              <div className="form" style={{ margin: 0, maxWidth: 'none' }}>
                <input
                  placeholder="Card number"
                  value={card.cardNumber}
                  onChange={(e) => setCard({ ...card, cardNumber: e.target.value })}
                  required
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    required
                  />
                  <input
                    placeholder="CVV"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="form" style={{ margin: 0, maxWidth: 'none' }}>
                <label>Cash tendered</label>
                <input type="number" min={order.grandTotal} step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} required />
              </div>
            )}

            {payError && <p className="error" style={{ marginTop: '0.75rem' }}>{payError}</p>}
            {payMessage && <p className="success" style={{ marginTop: '0.75rem' }}>{payMessage}</p>}

            <button className="btn" style={{ marginTop: '1rem' }} type="submit" disabled={payBusy}>
              {payBusy ? 'Processing...' : `Pay $${order.grandTotal.toFixed(2)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
