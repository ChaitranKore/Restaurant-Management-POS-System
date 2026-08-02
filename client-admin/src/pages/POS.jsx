import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

export default function POS() {
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]); // { menuItem, name, price, quantity }
  const [orderType, setOrderType] = useState('dine-in');
  const [tableId, setTableId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  const [payMethod, setPayMethod] = useState('cash');
  const [tendered, setTendered] = useState('');
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [payError, setPayError] = useState('');
  const [payMessage, setPayMessage] = useState('');

  useEffect(() => {
    api.get('/menu?all=true').then((res) => setMenu(res.data.filter((m) => m.isAvailable)));
    api.get('/tables').then((res) => setTables(res.data));
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem === item._id);
      if (existing) return prev.map((c) => (c.menuItem === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { menuItem: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const changeQty = (menuItem, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItem === menuItem ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

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
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order');
    } finally {
      setBusy(false);
    }
  };

  const pay = async (e) => {
    e.preventDefault();
    setPayError('');
    setPayMessage('');
    try {
      const body =
        payMethod === 'card'
          ? { orderId: placedOrder._id, method: 'card', ...card }
          : { orderId: placedOrder._id, method: 'cash', tenderedAmount: Number(tendered) };
      const res = await api.post('/payments', body);
      setPlacedOrder(res.data.order);
      setPayMessage(
        payMethod === 'cash'
          ? `Payment recorded. Change due: $${res.data.payment.changeDue.toFixed(2)}`
          : 'Card payment approved.'
      );
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payment failed');
    }
  };

  const startNewOrder = () => {
    setPlacedOrder(null);
    setTendered('');
    setCard({ cardNumber: '', expiry: '', cvv: '' });
    setPayMessage('');
    setPayError('');
  };

  return (
    <Layout>
      <div className="topbar">
        <h1>New Order</h1>
      </div>

      {placedOrder ? (
        <div className="pos-grid">
          <div className="card">
            <h3>Order {placedOrder.orderNumber} placed</h3>
            {placedOrder.items.map((i) => (
              <div key={i.menuItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                <span>{i.quantity}× {i.name}</span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span>
              <span>${placedOrder.grandTotal.toFixed(2)}</span>
            </div>
            <p style={{ marginTop: '0.75rem' }}>
              This order has been routed to the kitchen display automatically.
            </p>
            <button className="btn secondary" onClick={startNewOrder} style={{ marginTop: '1rem' }}>
              Start another order
            </button>
          </div>

          <div className="card">
            <h3>Payment</h3>
            {placedOrder.paymentStatus === 'paid' ? (
              <p className="success">Paid ✓</p>
            ) : (
              <form onSubmit={pay}>
                <div className="form-row">
                  <div>
                    <label>Method</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                </div>
                {payMethod === 'cash' ? (
                  <div className="form-row">
                    <div>
                      <label>Cash tendered</label>
                      <input type="number" min={placedOrder.grandTotal} step="0.01" value={tendered} onChange={(e) => setTendered(e.target.value)} required />
                    </div>
                  </div>
                ) : (
                  <div className="form-row">
                    <div>
                      <label>Card number</label>
                      <input value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: e.target.value })} required />
                    </div>
                    <div>
                      <label>Expiry</label>
                      <input placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} required />
                    </div>
                    <div>
                      <label>CVV</label>
                      <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} required />
                    </div>
                  </div>
                )}
                {payError && <p className="error">{payError}</p>}
                {payMessage && <p className="success">{payMessage}</p>}
                <button className="btn" type="submit">
                  Charge ${placedOrder.grandTotal.toFixed(2)}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="pos-grid">
          <div>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {menu.map((item) => (
                <div className="card" key={item._id} style={{ cursor: 'pointer' }} onClick={() => addToCart(item)}>
                  <strong>{item.name}</strong>
                  <div style={{ color: '#6b7684', fontSize: '0.85rem' }}>${item.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Current Order</h3>
            {cart.length === 0 ? (
              <p className="empty-state">Tap menu items to add them.</p>
            ) : (
              <>
                {cart.map((c) => (
                  <div key={c.menuItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0' }}>
                    <span>{c.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button className="btn secondary" onClick={() => changeQty(c.menuItem, -1)}>-</button>
                      <span>{c.quantity}</span>
                      <button className="btn secondary" onClick={() => changeQty(c.menuItem, 1)}>+</button>
                    </div>
                  </div>
                ))}
                <hr />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div>
                <label>Order type</label>
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                  <option value="dine-in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>
              {orderType === 'dine-in' ? (
                <div>
                  <label>Table</label>
                  <select value={tableId} onChange={(e) => setTableId(e.target.value)}>
                    <option value="">None</option>
                    {tables.map((t) => (
                      <option key={t._id} value={t._id}>
                        Table {t.number}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label>Guest name</label>
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                </div>
              )}
            </div>

            {error && <p className="error">{error}</p>}

            <button className="btn" style={{ width: '100%' }} disabled={cart.length === 0 || busy} onClick={placeOrder}>
              {busy ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
