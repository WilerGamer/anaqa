import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      login(data.token, data.email);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src="/images/logo.png" alt="Anaqa" className="h-14 mx-auto mb-6" />
          <h1 className="font-serif text-2xl text-navy">Admin Panel</h1>
          <p className="font-sans text-xs text-navy/50 mt-1 tracking-wide">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-sans text-xs text-navy/60 mb-1.5 tracking-wide">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="input-field"
              placeholder="admin@anaqa.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block font-sans text-xs text-navy/60 mb-1.5 tracking-wide">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              className="input-field"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-center mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center font-sans text-xs text-navy/30 mt-8 tracking-wide">
          Default: admin@anaqa.com / admin123
        </p>
      </div>
    </div>
  );
}
