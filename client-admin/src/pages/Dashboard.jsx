import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard'));
  }, []);

  return (
    <Layout>
      <div className="topbar">
        <h1>Dashboard</h1>
      </div>
      {error && <p className="error">{error}</p>}
      {!stats ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="value">{stats.todayOrders}</div>
              <div className="label">Orders today</div>
            </div>
            <div className="stat-card">
              <div className="value">{stats.activeOrders}</div>
              <div className="label">Active orders</div>
            </div>
            <div className="stat-card">
              <div className="value">${stats.todayRevenue.toFixed(2)}</div>
              <div className="label">Revenue today</div>
            </div>
            <div className="stat-card">
              <div className="value">{stats.totalMenuItems}</div>
              <div className="label">Menu items</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="card">
              <h3>Payments today</h3>
              {stats.paymentBreakdown.length === 0 ? (
                <p className="empty-state">No payments recorded yet today.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Count</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.paymentBreakdown.map((p) => (
                      <tr key={p._id}>
                        <td style={{ textTransform: 'capitalize' }}>{p._id}</td>
                        <td>{p.count}</td>
                        <td>${p.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h3>Top items today</h3>
              {stats.topItemsToday.length === 0 ? (
                <p className="empty-state">No orders yet today.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topItemsToday.map((i) => (
                      <tr key={i._id}>
                        <td>{i._id}</td>
                        <td>{i.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
