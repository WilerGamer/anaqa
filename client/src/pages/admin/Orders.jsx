import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = ['pending', 'processing', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const { token } = useAuth();
  const cfg = { headers: { Authorization: `Bearer ${token}` } };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQ, setSearchQ] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await axios.get(`/api/orders${params}`, cfg);
      setOrders(res.data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterStatus]);

  async function openOrder(id) {
    const res = await axios.get(`/api/orders/${id}`, cfg);
    setSelectedOrder(res.data);
  }

  async function updateStatus(id, status) {
    await axios.put(`/api/orders/${id}/status`, { status }, cfg);
    load();
    if (selectedOrder?.id === id) setSelectedOrder(o => ({ ...o, status }));
  }

  async function deleteOrder(id) {
    if (!window.confirm('Delete this order permanently?')) return;
    await axios.delete(`/api/orders/${id}`, cfg);
    setSelectedOrder(null);
    load();
  }

  const filtered = orders.filter(o =>
    !searchQ ||
    o.customer_name.toLowerCase().includes(searchQ.toLowerCase()) ||
    o.email.toLowerCase().includes(searchQ.toLowerCase()) ||
    String(o.id).includes(searchQ)
  );

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy mb-6">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by name, email, or #..." className="input-field w-60" />
        <div className="flex gap-1">
          <button onClick={() => setFilterStatus('')} className={`px-4 py-2 text-xs font-sans tracking-widest uppercase transition-all ${!filterStatus ? 'bg-navy text-cream' : 'border border-beige text-navy hover:border-navy'}`}>All</button>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 text-xs font-sans tracking-widest uppercase capitalize transition-all ${filterStatus === s ? 'bg-navy text-cream' : 'border border-beige text-navy hover:border-navy'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-cream-dark animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="admin-card overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead className="border-b border-cream-dark">
              <tr>{['#', 'Customer', 'Email', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 font-sans text-xs text-navy/50 tracking-widest uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-4 py-3 font-sans text-xs text-navy/60">#{o.id}</td>
                  <td className="px-4 py-3 font-sans text-sm text-navy font-medium">{o.customer_name}</td>
                  <td className="px-4 py-3 font-sans text-xs text-navy/60">{o.email}</td>
                  <td className="px-4 py-3 font-sans text-sm text-navy">${Number(o.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className={`text-xs font-sans px-2 py-1 rounded-full border-0 cursor-pointer capitalize ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-sans text-xs text-navy/50">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openOrder(o.id)} className="font-sans text-xs text-navy/60 hover:text-navy underline mr-3">View</button>
                    <button onClick={() => deleteOrder(o.id)} className="font-sans text-xs text-red-400 hover:text-red-600 underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 admin-card">
          <p className="font-serif text-xl text-navy/40 italic">No orders yet</p>
        </div>
      )}

      {/* ── Order Detail Modal ──────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-6">
          <div className="bg-white w-full max-w-lg shadow-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
              <h2 className="font-serif text-xl text-navy">Order #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-navy/40 hover:text-navy">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="font-sans text-xs text-navy/60 tracking-widest uppercase">Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                  className={`text-xs font-sans px-3 py-1.5 rounded-full capitalize cursor-pointer border-0 ${STATUS_COLORS[selectedOrder.status]}`}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Customer info */}
              <div className="bg-cream-dark p-4">
                <p className="font-sans text-xs text-navy/60 tracking-widest uppercase mb-3">Customer Information</p>
                <div className="grid grid-cols-2 gap-y-2 font-sans text-sm">
                  <span className="text-navy/60">Name</span><span className="text-navy font-medium">{selectedOrder.customer_name}</span>
                  <span className="text-navy/60">Email</span><span className="text-navy">{selectedOrder.email}</span>
                  <span className="text-navy/60">Phone</span><span className="text-navy">{selectedOrder.phone}</span>
                  <span className="text-navy/60">Delivery</span><span className="text-navy capitalize">{selectedOrder.delivery_option === 'cod' ? 'Cash on Delivery' : 'Free Delivery'}</span>
                  <span className="text-navy/60">Address</span><span className="text-navy">{selectedOrder.address}</span>
                  {selectedOrder.notes && <><span className="text-navy/60">Notes</span><span className="text-navy italic">{selectedOrder.notes}</span></>}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="font-sans text-xs text-navy/60 tracking-widest uppercase mb-3">Items Ordered</p>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-cream-dark last:border-0">
                      {item.product_image && (
                        <img src={item.product_image} alt="" className="w-10 h-12 object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-navy font-medium truncate">{item.product_name}</p>
                        <p className="font-sans text-xs text-navy/50">Size: {item.size} · Qty: {item.quantity}</p>
                      </div>
                      <p className="font-sans text-sm text-navy flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t border-cream-dark">
                <span className="font-serif text-base text-navy">Total</span>
                <span className="font-serif text-lg text-navy font-medium">${Number(selectedOrder.total).toFixed(2)}</span>
              </div>

              <button onClick={() => deleteOrder(selectedOrder.id)} className="w-full text-center font-sans text-xs text-red-400 hover:text-red-600 transition-colors pt-2">
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
