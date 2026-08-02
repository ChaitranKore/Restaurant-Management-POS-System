import { useEffect, useState } from 'react';
import api from '../api/client';
import MenuItemCard from '../components/MenuItemCard';

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/menu')])
      .then(([catRes, menuRes]) => {
        setCategories(catRes.data);
        setItems(menuRes.data);
      })
      .catch(() => setError('Could not load the menu. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleItems =
    activeCategory === 'all' ? items : items.filter((i) => i.category?._id === activeCategory);

  if (loading) return <div className="container page">Loading menu...</div>;

  return (
    <div className="container page">
      <h1>Our Menu</h1>
      {error && <p className="error">{error}</p>}

      <div className="category-tabs">
        <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            className={activeCategory === c._id ? 'active' : ''}
            onClick={() => setActiveCategory(c._id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <p className="empty-state">No items available in this category right now.</p>
      ) : (
        <div className="grid">
          {visibleItems.map((item) => (
            <MenuItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
