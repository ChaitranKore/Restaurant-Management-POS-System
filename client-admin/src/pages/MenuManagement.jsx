import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

export default function MenuManagement() {
  const [tab, setTab] = useState('items');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category: '', isVeg: true });

  const load = () => {
    api.get('/categories?all=true').then((res) => setCategories(res.data));
    api.get('/menu?all=true').then((res) => setItems(res.data));
  };

  useEffect(load, []);

  const addCategory = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', { name: newCategory });
      setNewCategory('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add category');
    }
  };

  const toggleCategoryActive = async (cat) => {
    await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive });
    load();
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete category');
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/menu', { ...itemForm, price: Number(itemForm.price) });
      setItemForm({ name: '', description: '', price: '', category: '', isVeg: true });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add item');
    }
  };

  const toggleAvailable = async (item) => {
    await api.put(`/menu/${item._id}`, { isAvailable: !item.isAvailable });
    load();
  };

  const deleteItem = async (id) => {
    await api.delete(`/menu/${id}`);
    load();
  };

  return (
    <Layout>
      <div className="topbar">
        <h1>Menu Management</h1>
      </div>
      <div className="tabs-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`btn ${tab === 'items' ? '' : 'secondary'}`} onClick={() => setTab('items')}>
          Items
        </button>
        <button className={`btn ${tab === 'categories' ? '' : 'secondary'}`} onClick={() => setTab('categories')}>
          Categories
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {tab === 'categories' ? (
        <div className="card">
          <form onSubmit={addCategory} className="form-row" style={{ alignItems: 'end' }}>
            <div>
              <label>New category name</label>
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required />
            </div>
            <button className="btn" type="submit">
              Add category
            </button>
          </form>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>
                    <span className="badge">{c.isActive ? 'active' : 'hidden'}</span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn secondary" onClick={() => toggleCategoryActive(c)}>
                      {c.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button className="btn danger" onClick={() => deleteCategory(c._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={addItem} className="form-row" style={{ alignItems: 'end' }}>
            <div>
              <label>Name</label>
              <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
            </div>
            <div>
              <label>Description</label>
              <input value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
            </div>
            <div>
              <label>Price</label>
              <input type="number" step="0.01" min="0" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} required />
            </div>
            <div>
              <label>Category</label>
              <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} required>
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn" type="submit">
              Add item
            </button>
          </form>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.category?.name}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    <span className="badge">{item.isAvailable ? 'available' : 'unavailable'}</span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn secondary" onClick={() => toggleAvailable(item)}>
                      {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    </button>
                    <button className="btn danger" onClick={() => deleteItem(item._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
