import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// ── Sidebar layout wrapper ────────────────────────────────────────────────────
export function AdminLayout() {
  const { logout, adminEmail } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/admin');
  }

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
    )},
    { to: '/admin/products', label: 'Products', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
    )},
    { to: '/admin/collections', label: 'Collections', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" /></svg>
    )},
    { to: '/admin/orders', label: 'Orders', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
    )},
    { to: '/admin/discounts', label: 'Discounts', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-navy flex flex-col transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <img src="/images/logo.png" alt="Anaqa" className="h-9 brightness-0 invert" />
          <p className="font-sans text-[10px] text-white/40 mt-1 tracking-widest uppercase">Admin Panel</p>
        </div>
        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs font-sans tracking-widest uppercase transition-all
                ${pathname === link.to ? 'bg-white/10 text-cream' : 'text-white/60 hover:text-cream hover:bg-white/5'}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 text-xs font-sans text-white/40 hover:text-white/70 tracking-widest uppercase transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            View Store
          </Link>
          <p className="font-sans text-[10px] text-white/30 px-3 py-1 truncate">{adminEmail}</p>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-xs font-sans text-white/40 hover:text-red-400 tracking-widest uppercase transition-colors w-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-5 flex-shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="lg:hidden mr-4 text-navy">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
          <h2 className="font-sans text-sm font-medium text-navy tracking-wide">
            {links.find(l => l.to === pathname)?.label || 'Admin'}
          </h2>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ── Dashboard home ─────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, by_status: [] });
  const [recentOrders, setRecentOrders] = useState([]);
  const [period, setPeriod] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { token } = useAuth();

  function getDateRange() {
    const now = new Date();
    if (period === '24h') {
      return { from: new Date(now - 86400000).toISOString(), to: now.toISOString() };
    }
    if (period === '7d') {
      return { from: new Date(now - 7 * 86400000).toISOString(), to: now.toISOString() };
    }
    if (period === '30d') {
      return { from: new Date(now - 30 * 86400000).toISOString(), to: now.toISOString() };
    }
    if (period === 'custom') {
      return {
        from: customFrom ? new Date(customFrom).toISOString() : undefined,
        to: customTo ? new Date(customTo + 'T23:59:59').toISOString() : undefined,
      };
    }
    return {};
  }

  useEffect(() => {
    const cfg = { headers: { Authorization: `Bearer ${token}` } };
    const range = getDateRange();
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(range).filter(([,v]) => v))).toString();
    axios.get(`/api/orders/stats/summary${qs ? '?' + qs : ''}`, cfg).then(r => setStats(r.data)).catch(() => {});
    axios.get('/api/orders?limit=5', cfg).then(r => setRecentOrders(r.data.slice(0, 5))).catch(() => {});
  }, [token, period, customFrom, customTo]);

  const statusColor = { pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const periodBtns = [
    { key: 'all', label: 'All Time' },
    { key: '24h', label: 'Last 24h' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy mb-6">Dashboard</h1>

      {/* Date filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {periodBtns.map(b => (
            <button
              key={b.key}
              onClick={() => setPeriod(b.key)}
              className={`px-3 py-1.5 text-xs font-sans tracking-wide transition-all ${
                period === b.key ? 'bg-navy text-cream' : 'border border-beige text-navy hover:border-navy'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label className="block font-sans text-[10px] text-navy/50 mb-1">From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="input-field text-xs py-1.5 w-36" />
            </div>
            <div>
              <label className="block font-sans text-[10px] text-navy/50 mb-1">To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="input-field text-xs py-1.5 w-36" />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: stats.total_orders },
          { label: 'Total Revenue', value: '$' + Number(stats.total_revenue).toFixed(2) },
          { label: 'Pending Orders', value: stats.by_status?.find(s => s.status === 'pending')?.count || 0 },
        ].map(s => (
          <div key={s.label} className="admin-card">
            <p className="font-sans text-xs text-navy/50 tracking-widest uppercase mb-1">{s.label}</p>
            <p className="font-serif text-2xl text-navy">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-sm font-medium text-navy tracking-wide">Recent Orders</h2>
          <Link to="/admin/orders" className="font-sans text-xs text-beige hover:text-navy transition-colors">View all →</Link>
        </div>
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-cream-dark">
                {['#', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="pb-2 font-sans text-xs text-navy/50 tracking-widest uppercase pr-4">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-cream-dark">
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td className="py-3 pr-4 font-sans text-xs text-navy/60">#{o.id}</td>
                    <td className="py-3 pr-4 font-sans text-sm text-navy">{o.customer_name}</td>
                    <td className="py-3 pr-4 font-sans text-sm text-navy">${Number(o.total).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-0.5 text-xs font-sans rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                    </td>
                    <td className="py-3 font-sans text-xs text-navy/50">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="font-sans text-sm text-navy/40 py-4 text-center">No orders yet</p>
        )}
      </div>
    </div>
  );
}
