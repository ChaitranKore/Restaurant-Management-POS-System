import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">🍽️ POS Admin</div>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/kitchen" className={({ isActive }) => (isActive ? 'active' : '')}>
          Kitchen Display
        </NavLink>
        <NavLink to="/pos" className={({ isActive }) => (isActive ? 'active' : '')}>
          New Order (POS)
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
          Orders
        </NavLink>
        {isAdmin && (
          <>
            <NavLink to="/menu" className={({ isActive }) => (isActive ? 'active' : '')}>
              Menu Management
            </NavLink>
            <NavLink to="/tables" className={({ isActive }) => (isActive ? 'active' : '')}>
              Tables
            </NavLink>
            <NavLink to="/staff" className={({ isActive }) => (isActive ? 'active' : '')}>
              Staff & Roles
            </NavLink>
            <NavLink to="/payments" className={({ isActive }) => (isActive ? 'active' : '')}>
              Payments
            </NavLink>
          </>
        )}
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout
        </button>
        <div className="role-tag">
          {user?.name} · {user?.role}
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
