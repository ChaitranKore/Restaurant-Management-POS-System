import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KitchenDisplay from './pages/KitchenDisplay';
import POS from './pages/POS';
import Orders from './pages/Orders';
import MenuManagement from './pages/MenuManagement';
import Tables from './pages/Tables';
import Staff from './pages/Staff';
import Payments from './pages/Payments';

const STAFF_ROLES = ['admin', 'staff'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <KitchenDisplay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <POS />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/menu"
        element={
          <ProtectedRoute roles={['admin']}>
            <MenuManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tables"
        element={
          <ProtectedRoute roles={['admin']}>
            <Tables />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute roles={['admin']}>
            <Staff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute roles={['admin']}>
            <Payments />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
