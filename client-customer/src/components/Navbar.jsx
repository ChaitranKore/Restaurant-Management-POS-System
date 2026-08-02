import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          🍽️ TableSide
        </Link>
        <div className="nav-links">
          <Link to="/">Menu</Link>
          <Link to="/checkout">Cart{itemCount > 0 ? ` (${itemCount})` : ''}</Link>
          {user ? (
            <>
              <Link to="/orders">My Orders</Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
