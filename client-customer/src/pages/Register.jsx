import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <form className="form" onSubmit={submit}>
        <h2>Create your account</h2>
        {error && <p className="error">{error}</p>}
        <div>
          <label>Full name</label>
          <input value={form.name} onChange={update('name')} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={form.email} onChange={update('email')} required />
        </div>
        <div>
          <label>Phone (optional)</label>
          <input value={form.phone} onChange={update('phone')} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" minLength={6} value={form.password} onChange={update('password')} required />
        </div>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Creating account...' : 'Sign up'}
        </button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
