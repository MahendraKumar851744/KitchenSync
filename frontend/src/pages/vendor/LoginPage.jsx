import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { setVendorToken } from '../../utils/localStorage';

export default function VendorLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile_number: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/vendor/login/', form);
      setVendorToken(data.access);
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        (err.response ? 'Invalid credentials. Please try again.' : 'Cannot reach server. Is the backend running?')
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Top branding section */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center pt-16 pb-10 px-6">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/40 mb-5">
          <span className="text-3xl">🍽️</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Kitchen Sync</h1>
        <p className="text-gray-400 text-sm mt-1.5">Vendor Portal</p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-[2rem] px-6 pt-8 pb-10 safe-bottom">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
        <p className="text-gray-400 text-sm mb-8">Sign in to manage your kitchen</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Mobile Number</label>
            <input
              type="tel"
              placeholder="9876543210"
              value={form.mobile_number}
              onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading
              ? <><Spinner /> Signing in...</>
              : 'Sign In'
            }
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-8">
          New vendor?{' '}
          <Link to="/vendor/register" className="text-brand-500 font-bold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}
