import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function AdminCollections() {
  const { token } = useAuth();
  const cfg = { headers: { Authorization: `Bearer ${token}` } };

  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionProducts, setCollectionProducts] = useState([]);
  const [addingProduct, setAddingProduct] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        axios.get('/api/collections'),
        axios.get('/api/products?limit=200'),
      ]);
      setCollections(cRes.data);
      setAllProducts(pRes.data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function loadCollectionProducts(slug) {
    const res = await axios.get(`/api/collections/${slug}`);
    setCollectionProducts(res.data.products || []);
  }

  function openNew() {
    setEditingId(null);
    setForm({ name: '' });
    setImageFile(null);
    setImagePreview('');
    setError('');
    setShowForm(true);
  }

  function openEdit(col) {
    setEditingId(col.id);
    setForm({ name: col.name });
    setImageFile(null);
    setImagePreview(col.image || '');
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (imageFile) fd.append('image', imageFile);

      const headers = { ...cfg.headers, 'Content-Type': 'multipart/form-data' };
      if (editingId) {
        await axios.put(`/api/collections/${editingId}`, fd, { headers });
      } else {
        await axios.post('/api/collections', fd, { headers });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this collection? Products will stay but be unassigned from it.')) return;
    await axios.delete(`/api/collections/${id}`, cfg);
    load();
  }

  async function handleAddProduct(colId, colSlug) {
    if (!addingProduct) return;
    await axios.post(`/api/collections/${colId}/products`, { product_id: parseInt(addingProduct) }, cfg);
    setAddingProduct('');
    loadCollectionProducts(colSlug);
    load();
  }

  async function handleRemoveProduct(productId, colSlug) {
    await axios.delete(`/api/collections/${selectedCollection.id}/products/${productId}`, cfg);
    loadCollectionProducts(colSlug);
    load();
  }

  function openManage(col) {
    setSelectedCollection(col);
    loadCollectionProducts(col.slug);
  }

  // Reorder: swap with the collection above or below
  async function handleReorder(colId, direction) {
    const idx = collections.findIndex(c => c.id === colId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === collections.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newOrder = [...collections];
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    setCollections(newOrder); // optimistic
    await axios.put('/api/collections/reorder', { order: newOrder.map(c => c.id) }, cfg);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-navy">Collections</h1>
        <button onClick={openNew} className="btn-primary text-xs px-5 py-2.5">+ New Collection</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-cream-dark animate-pulse" />)}
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((col, idx) => (
            <div key={col.id} className="admin-card overflow-hidden p-0">
              {/* Image */}
              <div className="h-36 bg-cream-dark relative overflow-hidden">
                {col.image ? (
                  <img src={col.image} alt={col.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-sans text-xs text-navy/30 tracking-widest uppercase">No Image</span>
                  </div>
                )}
                {/* Reorder arrows */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <button
                    onClick={() => handleReorder(col.id, 'up')}
                    disabled={idx === 0}
                    className="w-7 h-7 bg-white/80 hover:bg-white flex items-center justify-center text-navy disabled:opacity-30 shadow-sm"
                    title="Move up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
                  </button>
                  <button
                    onClick={() => handleReorder(col.id, 'down')}
                    disabled={idx === collections.length - 1}
                    className="w-7 h-7 bg-white/80 hover:bg-white flex items-center justify-center text-navy disabled:opacity-30 shadow-sm"
                    title="Move down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg text-navy">{col.name}</h3>
                <p className="font-sans text-xs text-navy/50 mt-0.5">{col.product_count} products</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => openManage(col)} className="btn-primary text-[10px] px-3 py-2 flex-1 text-center">Manage Products</button>
                  <button onClick={() => openEdit(col)} className="btn-outline text-[10px] px-3 py-2">Edit</button>
                  <button onClick={() => handleDelete(col.id)} className="btn-outline text-[10px] px-3 py-2 hover:!bg-red-500 hover:!border-red-500 hover:!text-white">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 admin-card">
          <p className="font-serif text-xl text-navy/40 italic mb-2">No collections yet</p>
          <button onClick={openNew} className="btn-primary text-xs mt-4">Create Collection</button>
        </div>
      )}

      {/* ── Collection Form Modal ──────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
              <h2 className="font-serif text-xl text-navy">{editingId ? 'Edit Collection' : 'New Collection'}</h2>
              <button onClick={() => setShowForm(false)} className="text-navy/40 hover:text-navy">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-sans text-xs text-navy/60 mb-1.5">Collection Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input-field" placeholder="e.g. Winter Collection" />
              </div>
              <div>
                <label className="block font-sans text-xs text-navy/60 mb-2">Collection Image</label>
                {imagePreview && (
                  <div className="w-full h-32 mb-3 overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-beige px-4 py-3 hover:border-navy transition-colors">
                  <svg className="w-4 h-4 text-beige" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                  <span className="font-sans text-xs text-navy/60">Upload image</span>
                  <input type="file" accept="image/*" onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                  }} className="hidden" />
                </label>
              </div>
              {error && <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1 text-xs text-center">{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 text-xs text-center">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Products Modal ──────────────────────────────────────────── */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark flex-shrink-0">
              <h2 className="font-serif text-xl text-navy">{selectedCollection.name}</h2>
              <button onClick={() => setSelectedCollection(null)} className="text-navy/40 hover:text-navy">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {/* Add product */}
              <div className="mb-5">
                <p className="font-sans text-xs text-navy/60 tracking-widest uppercase mb-2">Add Product to Collection</p>
                <div className="flex gap-2">
                  <select value={addingProduct} onChange={e => setAddingProduct(e.target.value)} className="input-field flex-1">
                    <option value="">Select a product...</option>
                    {allProducts.filter(p => !collectionProducts.find(cp => cp.id === p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button onClick={() => handleAddProduct(selectedCollection.id, selectedCollection.slug)} className="btn-primary text-xs px-4">Add</button>
                </div>
              </div>

              {/* Current products */}
              <p className="font-sans text-xs text-navy/60 tracking-widest uppercase mb-3">Products in Collection ({collectionProducts.length})</p>
              {collectionProducts.length > 0 ? (
                <div className="space-y-2">
                  {collectionProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-cream-dark">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.primary_image && <img src={p.primary_image} alt="" className="w-8 h-10 object-cover flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-sans text-sm text-navy truncate">{p.name}</p>
                          <p className="font-sans text-xs text-navy/50">${Number(p.price).toFixed(2)}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveProduct(p.id, selectedCollection.slug)} className="font-sans text-xs text-red-400 hover:text-red-600 ml-3 flex-shrink-0">Remove</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-sm text-navy/40 italic text-center py-4">No products in this collection</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
