import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const EMPTY_FORM = {
  name: '', description: '', price: '', old_price: '',
  collectionIds: [],
  sizes: SIZES.map(s => ({ size: s, quantity: 0 })),
};
const EMPTY_ADJ = Object.fromEntries(SIZES.map(s => [s, 0]));

export default function AdminProducts() {
  const { token } = useAuth();
  const cfg = { headers: { Authorization: `Bearer ${token}` } };

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentSizes, setCurrentSizes] = useState([]); // existing stock when editing
  const [sizeAdj, setSizeAdj] = useState(EMPTY_ADJ);    // adjustment deltas when editing
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [stockModal, setStockModal] = useState(null); // product with sizes for Show popup
  const [loadingStock, setLoadingStock] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        axios.get('/api/products?limit=200', cfg),
        axios.get('/api/collections'),
      ]);
      setProducts(pRes.data);
      setCollections(cRes.data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setCurrentSizes([]);
    setSizeAdj(EMPTY_ADJ);
    setImageFiles([]);
    setImagePreviews([]);
    setError('');
    setShowForm(true);
  }

  async function openEdit(product) {
    setError('');
    // Fetch full product data (includes sizes and collection_ids)
    const res = await axios.get(`/api/products/${product.id}`);
    const full = res.data;
    const sizesMap = Object.fromEntries((full.sizes || []).map(s => [s.size, s.quantity]));

    setEditingId(full.id);
    setCurrentSizes(SIZES.map(s => ({ size: s, quantity: sizesMap[s] ?? 0 })));
    setSizeAdj(EMPTY_ADJ);
    setForm({
      name: full.name,
      description: full.description || '',
      price: full.price,
      old_price: full.old_price || '',
      collectionIds: full.collection_ids || [],
      sizes: SIZES.map(s => ({ size: s, quantity: sizesMap[s] ?? 0 })),
    });
    setImageFiles([]);
    setImagePreviews(full.images?.map(i => ({ id: i.id, url: i.url, existing: true })) || []);
    setShowForm(true);
  }

  async function handleShowStock(product) {
    setLoadingStock(true);
    try {
      const res = await axios.get(`/api/products/${product.id}`);
      setStockModal(res.data);
    } finally { setLoadingStock(false); }
  }

  function handleImages(e) {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(f => ({ url: URL.createObjectURL(f), existing: false, file: f }));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }

  function removePreview(idx) {
    const p = imagePreviews[idx];
    if (!p.existing) setImageFiles(prev => prev.filter(f => f !== p.file));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  }

  function toggleCollection(colId) {
    setForm(f => ({
      ...f,
      collectionIds: f.collectionIds.includes(colId)
        ? f.collectionIds.filter(id => id !== colId)
        : [...f.collectionIds, colId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('old_price', form.old_price);
      fd.append('collection_ids', JSON.stringify(form.collectionIds));

      if (editingId) {
        // Send adjustments (additive) — backend only applies non-zero deltas
        const adjustments = SIZES.map(s => ({ size: s, delta: parseInt(sizeAdj[s]) || 0 }));
        fd.append('size_adjustments', JSON.stringify(adjustments));

        // Track removed images
        const originalIds = products.find(p => p.id === editingId)?.images?.map(i => i.id) || [];
        const keptIds = imagePreviews.filter(p => p.existing && p.id).map(p => p.id);
        const toRemove = originalIds.filter(id => !keptIds.includes(id));
        if (toRemove.length) fd.append('remove_images', JSON.stringify(toRemove));
      } else {
        fd.append('sizes', JSON.stringify(form.sizes));
      }

      imageFiles.forEach(f => fd.append('images', f));

      const headers = { ...cfg.headers, 'Content-Type': 'multipart/form-data' };
      if (editingId) {
        await axios.put(`/api/products/${editingId}`, fd, { headers });
      } else {
        await axios.post('/api/products', fd, { headers });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    await axios.delete(`/api/products/${id}`, cfg);
    load();
  }

  const filtered = products.filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-navy">Products</h1>
        <button onClick={openNew} className="btn-primary text-xs px-5 py-2.5">+ Add Product</button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search products..." className="input-field max-w-xs" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-cream-dark animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="admin-card overflow-x-auto p-0">
          <table className="w-full text-left min-w-[600px]">
            <thead className="border-b border-cream-dark">
              <tr>{['Image', 'Name', 'Price', 'Collections', 'Stock', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 font-sans text-xs text-navy/50 tracking-widest uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-12 bg-cream-dark overflow-hidden flex-shrink-0">
                      {p.primary_image ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-navy font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-sans text-sm text-navy">
                    ${Number(p.price).toFixed(2)}
                    {p.old_price && <span className="ml-2 text-xs text-beige line-through">${Number(p.old_price).toFixed(2)}</span>}
                  </td>
                  <td className="px-4 py-3 font-sans text-xs text-navy/60">{p.collection_name || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleShowStock(p)}
                      disabled={loadingStock}
                      className="font-sans text-xs border border-beige text-navy px-2 py-1 hover:border-navy transition-colors disabled:opacity-40"
                    >
                      Show
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(p)} className="font-sans text-xs text-navy/60 hover:text-navy underline">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="font-sans text-xs text-red-400 hover:text-red-600 underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 admin-card">
          <p className="font-serif text-xl text-navy/40 italic mb-2">No products yet</p>
          <button onClick={openNew} className="btn-primary text-xs mt-4">Add Your First Product</button>
        </div>
      )}

      {/* ── Stock Popup ──────────────────────────────────────────────────────── */}
      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setStockModal(null)}>
          <div className="bg-white w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
              <h3 className="font-serif text-lg text-navy truncate pr-2">{stockModal.name}</h3>
              <button onClick={() => setStockModal(null)} className="text-navy/40 hover:text-navy flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5">
              <p className="font-sans text-xs text-navy/50 tracking-widest uppercase mb-3">Current Stock</p>
              {stockModal.sizes?.length > 0 ? (
                <table className="w-full">
                  <tbody className="divide-y divide-cream-dark">
                    {stockModal.sizes.map(s => (
                      <tr key={s.size}>
                        <td className="py-2 font-sans text-sm font-medium text-navy w-12">{s.size}</td>
                        <td className="py-2 font-sans text-sm text-navy">
                          <span className={`font-medium ${s.quantity === 0 ? 'text-red-400' : 'text-navy'}`}>
                            {s.quantity}
                          </span>
                          {' '}
                          <span className="text-navy/40 text-xs">in stock</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="font-sans text-sm text-navy/40 italic">No sizes configured</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Product Form Modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-4 px-4">
          <div className="bg-white w-full max-w-2xl my-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
              <h2 className="font-serif text-xl text-navy">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-navy/40 hover:text-navy">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-sans text-xs text-navy/60 mb-1.5">Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input-field" placeholder="e.g. Classic Linen Shirt" />
                </div>
                <div>
                  <label className="block font-sans text-xs text-navy/60 mb-1.5">Price (USD) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required className="input-field" placeholder="350.00" />
                </div>
                <div>
                  <label className="block font-sans text-xs text-navy/60 mb-1.5">Old Price (USD) — optional</label>
                  <input type="number" min="0" step="0.01" value={form.old_price} onChange={e => setForm(f => ({ ...f, old_price: e.target.value }))} className="input-field" placeholder="500.00" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-sans text-xs text-navy/60 mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Describe the product..." />
                </div>
              </div>

              {/* Collections (multi-select) */}
              <div>
                <label className="block font-sans text-xs text-navy/60 mb-2">Collections <span className="text-navy/30">(select one or more)</span></label>
                {collections.length === 0 ? (
                  <p className="font-sans text-xs text-navy/40 italic">No collections yet</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-beige p-3 max-h-36 overflow-y-auto">
                    {collections.map(c => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.collectionIds.includes(c.id)}
                          onChange={() => toggleCollection(c.id)}
                          className="accent-navy"
                        />
                        <span className="font-sans text-xs text-navy truncate">{c.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Inventory */}
              {editingId ? (
                <div>
                  <label className="block font-sans text-xs text-navy/60 mb-2">
                    Adjust Inventory <span className="text-navy/30">(positive = add, negative = remove)</span>
                  </label>
                  {/* Current stock row */}
                  <div className="bg-cream-dark px-3 py-2 mb-3 grid grid-cols-5 gap-2">
                    {currentSizes.map(s => (
                      <div key={s.size} className="text-center">
                        <p className="font-sans text-[10px] text-navy/50 uppercase tracking-wider">{s.size}</p>
                        <p className="font-sans text-sm font-medium text-navy">{s.quantity}</p>
                      </div>
                    ))}
                  </div>
                  {/* Adjustment inputs */}
                  <div className="grid grid-cols-5 gap-2">
                    {SIZES.map(s => (
                      <div key={s} className="text-center">
                        <p className="font-sans text-xs font-medium text-navy mb-1">{s}</p>
                        <input
                          type="number"
                          value={sizeAdj[s]}
                          onChange={e => setSizeAdj(prev => ({ ...prev, [s]: e.target.value }))}
                          className="input-field text-center px-1 py-2 text-sm"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="font-sans text-[10px] text-navy/40 mt-2">Current stock shown above. Enter adjustment below each size. Leave 0 to keep unchanged.</p>
                </div>
              ) : (
                <div>
                  <label className="block font-sans text-xs text-navy/60 mb-3">Initial Stock per Size</label>
                  <div className="grid grid-cols-5 gap-2">
                    {form.sizes.map(s => (
                      <div key={s.size} className="text-center">
                        <p className="font-sans text-xs font-medium text-navy mb-1">{s.size}</p>
                        <input
                          type="number" min="0" value={s.quantity}
                          onChange={e => setForm(f => ({ ...f, sizes: f.sizes.map(x => x.size === s.size ? { ...x, quantity: parseInt(e.target.value) || 0 } : x) }))}
                          className="input-field text-center px-2 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              <div>
                <label className="block font-sans text-xs text-navy/60 mb-3">Product Images</label>
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {imagePreviews.map((p, i) => (
                      <div key={i} className="relative w-16 h-20">
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePreview(i)} className="absolute -top-1 -right-1 bg-navy text-cream w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-beige px-4 py-3 hover:border-navy transition-colors">
                  <svg className="w-4 h-4 text-beige" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                  <span className="font-sans text-xs text-navy/60">Upload images (first = primary)</span>
                  <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
                </label>
              </div>

              {error && <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 text-center text-xs">
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 text-center text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
