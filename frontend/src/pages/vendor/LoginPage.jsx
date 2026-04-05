import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { setVendorToken } from '../../utils/localStorage';

export default function VendorLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile_number: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/vendor/login/', form);
      setVendorToken(data.access);
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || (err.response ? 'Login failed.' : 'Cannot reach server. Is the backend running?'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Brand */}
      <div className="bg-brand-500 pt-16 pb-12 px-6 text-center text-white">
        <div className="text-5xl mb-3">🍽️</div>
        <h1 className="text-2xl font-black tracking-tight">Kitchen Sync</h1>
        <p className="text-brand-100 text-sm mt-1">Vendor Portal</p>
      </div>

      <div className="flex-1 px-5 -mt-6">
        <div className="bg-white rounded-3xl shadow-lg px-5 py-7 max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Welcome back 👋</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.mobile_number}
                onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-base"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 disabled:bg-brand-300 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-base"
            >
              {loading
                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</>
                : 'Login'
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            New vendor?{' '}
            <Link to="/vendor/register" className="text-brand-500 font-semibold">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
