import { useCart } from '../context/CartContext';

export default function MenuItemCard({ item }) {
  const { addItem } = useCart();

  return (
    <div className="card menu-item-card">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="price">${item.price.toFixed(2)}</span>
        <button className="btn" onClick={() => addItem(item)}>
          Add
        </button>
      </div>
    </div>
  );
}
