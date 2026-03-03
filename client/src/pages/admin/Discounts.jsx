import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = { code: '', type: 'percent', value: '', max_uses: '' };

export default function AdminDiscounts() {
  const { token } = useAuth();
  const cfg = { headers: { Authorization: `Bearer ${token}` } };

  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { load(); }, []);

  function load() {
    axios.get('/api/discounts', cfg).then(r => setDiscounts(r.data)).catch(() => {});
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await axios.post('/api/discounts', {
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      }, cfg);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create discount');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(discount) {
    try {
      await axios.put(`/api/discounts/${discount.id}`, { active: !discount.active }, cfg);
      load();
    } catch {}
  }

  async function handleDelete(id) {
    if (!confirm('Delete this discount code?')) return;
    try {
      await axios.delete(`/api/discounts/${id}`, cfg);
      load();
    } catch {}
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy mb-6">Discount Codes</h1>

      {/* Create form */}
      <div className="admin-card mb-8">
        <h2 className="font-sans text-sm font-medium text-navy tracking-wide mb-4">Create New Code</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Code */}
          <div className="lg:col-span-1">
            <label className="block font-sans text-xs text-navy/60 mb-1.5">Code *</label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              placeholder="e.g. SUMMER20"
              className="input-field uppercase"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block font-sans text-xs text-navy/60 mb-1.5">Type *</label>
            <div className="flex gap-3 h-[42px] items-center">
              {[
                { value: 'percent', label: '% Percent' },
                { value: 'flat', label: '$ Flat' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer font-sans text-sm text-navy">
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={form.type === opt.value}
                    onChange={handleChange}
                    className="accent-navy"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block font-sans text-xs text-navy/60 mb-1.5">
              Value * {form.type === 'percent' ? '(%)' : '(USD)'}
            </label>
            <input
              name="value"
              type="number"
              step="0.01"
              min="0.01"
              value={form.value}
              onChange={handleChange}
              required
              placeholder={form.type === 'percent' ? '15' : '50'}
              className="input-field"
            />
          </div>

          {/* Max uses */}
          <div>
            <label className="block font-sans text-xs text-navy/60 mb-1.5">Max Uses (optional)</label>
            <input
              name="max_uses"
              type="number"
              min="1"
              value={form.max_uses}
              onChange={handleChange}
              placeholder="Unlimited"
              className="input-field"
            />
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 lg:col-span-4">
            {formError && <p className="font-sans text-xs text-red-600 mb-3">{formError}</p>}
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-40">
              {saving ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </form>
      </div>

      {/* Discounts table */}
      <div className="admin-card">
        <h2 className="font-sans text-sm font-medium text-navy tracking-wide mb-4">All Codes</h2>
        {discounts.length === 0 ? (
          <p className="font-sans text-sm text-navy/40 py-6 text-center">No discount codes yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-cream-dark">
                  {['Code', 'Type', 'Value', 'Used / Max', 'Status', 'Created', ''].map(h => (
                    <th key={h} className="pb-2 font-sans text-xs text-navy/50 tracking-widest uppercase pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {discounts.map(d => (
                  <tr key={d.id}>
                    <td className="py-3 pr-4 font-sans text-sm font-medium text-navy tracking-wider">{d.code}</td>
                    <td className="py-3 pr-4 font-sans text-xs text-navy/60 capitalize">{d.type}</td>
                    <td className="py-3 pr-4 font-sans text-sm text-navy">
                      {d.type === 'percent' ? `${d.value}%` : `${Number(d.value).toFixed(2)} USD`}
                    </td>
                    <td className="py-3 pr-4 font-sans text-sm text-navy/70">
                      {d.uses_count} / {d.max_uses ?? '∞'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-0.5 text-xs font-sans rounded-full ${
                        d.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-sans text-xs text-navy/40 whitespace-nowrap">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(d)}
                          className="font-sans text-xs text-beige hover:text-navy transition-colors whitespace-nowrap"
                        >
                          {d.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="font-sans text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
