import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('dine-in');
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  useEffect(() => {
    api.get('/tables').then((res) => setTables(res.data)).catch(() => {});
  }, []);

  const placeOrder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/orders', {
        items: items.map(({ menuItem, quantity, notes: n }) => ({ menuItem, quantity, notes: n })),
        orderType,
        table: orderType === 'dine-in' ? tableId || undefined : undefined,
        notes,
      });
      clearCart();
      navigate(`/orders/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order');
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1>Your Cart</h1>
        <p className="empty-state">Your cart is empty. Go add something delicious from the menu.</p>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1>Your Cart</h1>

      <div className="card">
        {items.map((item) => (
          <div className="cart-row" key={item.menuItem}>
            <div>
              <strong>{item.name}</strong>
              <div style={{ fontSize: '0.85rem', color: '#756b64' }}>${item.price.toFixed(2)} each</div>
            </div>
            <div className="qty-control">
              <button onClick={() => updateQuantity(item.menuItem, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.menuItem, item.quantity + 1)}>+</button>
              <button onClick={() => removeItem(item.menuItem)} title="Remove">
                ✕
              </button>
            </div>
          </div>
        ))}

        <div className="order-summary-line">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="order-summary-line">
          <span>Tax (5%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="order-summary-line total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="tabs-row">
          <button className={orderType === 'dine-in' ? 'active' : ''} onClick={() => setOrderType('dine-in')}>
            Dine-in
          </button>
          <button className={orderType === 'takeaway' ? 'active' : ''} onClick={() => setOrderType('takeaway')}>
            Takeaway
          </button>
        </div>

        {orderType === 'dine-in' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label>Table</label>
            <select value={tableId} onChange={(e) => setTableId(e.target.value)}>
              <option value="">Select a table (optional)</option>
              {tables.map((t) => (
                <option key={t._id} value={t._id}>
                  Table {t.number} (seats {t.capacity})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label>Special instructions (optional)</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="error" style={{ marginTop: '0.75rem' }}>{error}</p>}

        <button className="btn" style={{ width: '100%', marginTop: '1rem' }} onClick={placeOrder} disabled={busy}>
          {busy ? 'Placing order...' : `Place Order · $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
