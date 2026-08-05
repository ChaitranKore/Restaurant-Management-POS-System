import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'tableside-cart';
export const TAX_RATE = 0.05;

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Tolerate a stale or hand-edited payload rather than crashing the app on boot.
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.menuItem && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // { menuItem, name, price, quantity, notes, imageUrl }
  const [items, setItems] = useState(readStoredCart);

  // Survive a reload — losing a half-built cart to an accidental refresh is
  // the fastest way to lose an order.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota or private mode — the cart just won't persist */
    }
  }, [items]);

  const addItem = useCallback((menuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem === menuItem._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem === menuItem._id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          imageUrl: menuItem.imageUrl || '',
          quantity,
          notes: '',
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((menuItemId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.menuItem !== menuItemId)
        : prev.map((i) => (i.menuItem === menuItemId ? { ...i, quantity } : i))
    );
  }, []);

  const updateNotes = useCallback((menuItemId, notes) => {
    setItems((prev) => prev.map((i) => (i.menuItem === menuItemId ? { ...i, notes } : i)));
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItem !== menuItemId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const quantities = useMemo(
    () => Object.fromEntries(items.map((i) => [i.menuItem, i.quantity])),
    [items]
  );

  /** How many of a given menu item are in the cart — drives the card steppers. */
  const getQuantity = useCallback((menuItemId) => quantities[menuItemId] ?? 0, [quantities]);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  // Mirrors the server's own re-pricing so the displayed total matches the
  // order that comes back. The API remains the authority on both.
  const tax = useMemo(() => Number((subtotal * TAX_RATE).toFixed(2)), [subtotal]);
  const total = useMemo(() => Number((subtotal + tax).toFixed(2)), [subtotal, tax]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      updateNotes,
      removeItem,
      clearCart,
      getQuantity,
      subtotal,
      tax,
      total,
      itemCount,
    }),
    [
      items,
      addItem,
      updateQuantity,
      updateNotes,
      removeItem,
      clearCart,
      getQuantity,
      subtotal,
      tax,
      total,
      itemCount,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
