import {
  ChefHat,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  ShoppingCart,
  Table2,
  UsersRound,
  UtensilsCrossed,
} from 'lucide-react';

/**
 * Single source of truth for admin navigation — consumed by the sidebar, the
 * mobile drawer and the command palette, so a new screen only has to be added
 * in one place. `roles` mirrors the server-side authorize() guard on each route;
 * the API remains the real gate, this only hides what the user can't use.
 */
export const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'staff'],
    end: true,
    keywords: 'stats revenue overview home',
  },
  {
    to: '/kitchen',
    label: 'Kitchen Display',
    icon: ChefHat,
    roles: ['admin', 'staff'],
    keywords: 'kds tickets board cooking',
  },
  {
    to: '/pos',
    label: 'New Order',
    icon: ShoppingCart,
    roles: ['admin', 'staff'],
    keywords: 'pos till terminal walk-in checkout',
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: ReceiptText,
    roles: ['admin', 'staff'],
    keywords: 'history tickets list',
  },
  {
    to: '/menu',
    label: 'Menu',
    icon: UtensilsCrossed,
    roles: ['admin'],
    keywords: 'items categories dishes prices',
  },
  { to: '/tables', label: 'Tables', icon: Table2, roles: ['admin'], keywords: 'seating floor covers' },
  {
    to: '/staff',
    label: 'Staff & Roles',
    icon: UsersRound,
    roles: ['admin'],
    keywords: 'users accounts permissions rbac',
  },
  {
    to: '/payments',
    label: 'Payments',
    icon: CreditCard,
    roles: ['admin'],
    keywords: 'transactions cash card reconciliation',
  },
];

export function navItemsForRole(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
