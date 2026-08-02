import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { menuItem, name, price, quantity, notes }

  const addItem = (menuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem === menuItem._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem === menuItem._id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        { menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity, notes: '' },
      ];
    });
  };

  const updateQuantity = (menuItemId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.menuItem !== menuItemId)
        : prev.map((i) => (i.menuItem === menuItemId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItem !== menuItemId));
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, subtotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
