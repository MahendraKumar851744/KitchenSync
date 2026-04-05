import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', kitchen_name: '', mobile_number: '', password: '', confirm_password: '', address: '' });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    try {
      const { confirm_password, ...submitData } = form;
      const formData = new FormData();
      Object.entries(submitData).forEach(([k, v]) => formData.append(k, v));
      if (logo) formData.append('kitchen_logo', logo);
      await api.post('/vendors/register/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/vendor/login', { state: { success: 'Registration successful! Awaiting admin approval.' } });
    } catch (err) {
      const data = err.response?.data;
      if (!data) { setError('Cannot reach server. Is the backend running?'); }
      else if (typeof data === 'string') { setError('Server error. Make sure the KitchenSync backend is running on port 8000.'); }
      else if (data.detail) { setError(data.detail); }
      else {
        const msgs = Object.entries(data).map(([field, errs]) =>
          `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`
        );
        setError(msgs.join(' · '));
      }
    } finally {
      setLoading(false);
    }
  }

  const field = (key, label, opts = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        {...opts}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-base"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-brand-500 pt-14 pb-12 px-6 text-center text-white">
        <div className="text-5xl mb-3">🍽️</div>
        <h1 className="text-2xl font-black tracking-tight">Kitchen Sync</h1>
        <p className="text-brand-100 text-sm mt-1">Join as a Vendor</p>
      </div>

      <div className="px-5 -mt-6">
        <div className="bg-white rounded-3xl shadow-lg px-5 py-7 max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Create your kitchen 🏪</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-2">
              <label htmlFor="logo-upload" className="cursor-pointer">
                {logoPreview
                  ? <img src={logoPreview} className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-300" alt="Logo preview" />
                  : <div className="w-20 h-20 rounded-2xl bg-brand-50 border-2 border-dashed border-brand-200 flex flex-col items-center justify-center text-brand-400">
                      <span className="text-2xl">📷</span>
                      <span className="text-xs mt-1">Add Logo</span>
                    </div>
                }
              </label>
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <p className="text-xs text-gray-400">Kitchen Logo (optional)</p>
            </div>

            {field('name', 'Your Name', { placeholder: 'e.g. Ramesh Kumar' })}
            {field('kitchen_name', 'Kitchen Name', { placeholder: 'e.g. Ramesh Idli Stall' })}
            {field('mobile_number', 'Mobile Number', { type: 'tel', placeholder: '9876543210' })}
            {field('password', 'Password', { type: 'password', placeholder: 'Min. 6 characters', minLength: 6 })}
            {field('confirm_password', 'Confirm Password', { type: 'password', placeholder: 'Re-enter your password', minLength: 6 })}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kitchen Address</label>
              <textarea
                placeholder="e.g. Near Bus Stand, Hyderabad"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                required
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-base resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-amber-700 text-sm">
              ⏳ After registration, an admin will approve your account before you can log in.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 disabled:bg-brand-300 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-base"
            >
              {loading
                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering...</>
                : 'Register Kitchen'
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already registered?{' '}
            <Link to="/vendor/login" className="text-brand-500 font-semibold">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
