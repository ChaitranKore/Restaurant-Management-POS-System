import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Staff() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/users').then((res) => setUsers(res.data));
  useEffect(() => {
    load();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'staff', phone: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    }
  };

  const toggleActive = async (u) => {
    await api.put(`/users/${u.id}`, { isActive: !u.isActive });
    load();
  };

  const changeRole = async (u, role) => {
    await api.put(`/users/${u.id}`, { role });
    load();
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete user');
    }
  };

  return (
    <Layout>
      <div className="topbar">
        <h1>Staff & Roles</h1>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>Create Staff / Admin account</h3>
        <form onSubmit={createUser} className="form-row" style={{ alignItems: 'end' }}>
          <div>
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn" type="submit">
            Create
          </button>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} disabled={u.id === me.id}>
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <span className="badge">{u.isActive ? 'active' : 'disabled'}</span>
              </td>
              <td style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn secondary" onClick={() => toggleActive(u)} disabled={u.id === me.id}>
                  {u.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className="btn danger" onClick={() => deleteUser(u.id)} disabled={u.id === me.id}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
