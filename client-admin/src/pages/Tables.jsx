import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ number: '', capacity: 4 });
  const [error, setError] = useState('');

  const load = () => api.get('/tables').then((res) => setTables(res.data));
  useEffect(() => {
    load();
  }, []);

  const addTable = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tables', { number: Number(form.number), capacity: Number(form.capacity) });
      setForm({ number: '', capacity: 4 });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add table');
    }
  };

  const setStatus = async (table, status) => {
    await api.put(`/tables/${table._id}`, { status });
    load();
  };

  const deleteTable = async (id) => {
    await api.delete(`/tables/${id}`);
    load();
  };

  return (
    <Layout>
      <div className="topbar">
        <h1>Tables</h1>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <form onSubmit={addTable} className="form-row" style={{ alignItems: 'end' }}>
          <div>
            <label>Table number</label>
            <input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
          </div>
          <div>
            <label>Capacity</label>
            <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
          </div>
          <button className="btn" type="submit">
            Add table
          </button>
        </form>

        <table>
          <thead>
            <tr>
              <th>Table</th>
              <th>Capacity</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t._id}>
                <td>{t.number}</td>
                <td>{t.capacity}</td>
                <td>
                  <span className="badge">{t.status}</span>
                </td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <select value={t.status} onChange={(e) => setStatus(t, e.target.value)}>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                  <button className="btn danger" onClick={() => deleteTable(t._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
