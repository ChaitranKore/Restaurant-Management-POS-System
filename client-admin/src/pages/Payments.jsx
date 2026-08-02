import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [methodFilter, setMethodFilter] = useState('');

  useEffect(() => {
    api.get('/payments', { params: methodFilter ? { method: methodFilter } : {} }).then((res) => setPayments(res.data));
  }, [methodFilter]);

  return (
    <Layout>
      <div className="topbar">
        <h1>Payments</h1>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
          <option value="">All methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
      </div>

      {payments.length === 0 ? (
        <p className="empty-state">No payments recorded yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Order</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td>{p.transactionId}</td>
                <td>{p.order?.orderNumber}</td>
                <td style={{ textTransform: 'capitalize' }}>
                  {p.method}
                  {p.method === 'card' && p.cardLast4 ? ` ····${p.cardLast4}` : ''}
                </td>
                <td>${p.amount.toFixed(2)}</td>
                <td>
                  <span className="badge">{p.status}</span>
                </td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
