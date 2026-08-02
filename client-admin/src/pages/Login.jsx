import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h2>POS Admin Login</h2>
        <p style={{ color: '#6b7684', fontSize: '0.85rem', marginTop: '-0.5rem' }}>
          For Admin and Staff accounts only.
        </p>
        {error && <p className="error">{error}</p>}
        <div className="form-row">
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>
        <button className="btn" style={{ width: '100%' }} type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
