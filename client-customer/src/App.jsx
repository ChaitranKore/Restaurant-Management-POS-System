import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CartSheet from './components/CartSheet';
import StickyCartBar from './components/StickyCartBar';
import Menu from './pages/Menu';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const { pathname } = useLocation();

  // Route changes should land at the top, and never leave the cart hanging open.
  useEffect(() => {
    setCartOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // The cart bar would only duplicate what checkout already shows.
  const showCartBar = pathname !== '/checkout';

  return (
    <>
      <Navbar onOpenCart={() => setCartOpen(true)} />

      <main>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderTracking />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
      {showCartBar ? <StickyCartBar onOpen={() => setCartOpen(true)} /> : null}
    </>
  );
}
