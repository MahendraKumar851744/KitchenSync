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
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1); // 2-step form

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (file) { setLogo(file); setLogoPreview(URL.createObjectURL(file)); }
  }

  function nextStep(e) {
    e.preventDefault();
    if (!form.name || !form.kitchen_name || !form.mobile_number) return;
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const { confirm_password, ...submitData } = form;
      const fd = new FormData();
      Object.entries(submitData).forEach(([k, v]) => fd.append(k, v));
      if (logo) fd.append('kitchen_logo', logo);
      await api.post('/vendors/register/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/vendor/login', { state: { success: 'Registration successful! Awaiting admin approval.' } });
    } catch (err) {
      const data = err.response?.data;
      if (!data) { setError('Cannot reach server.'); }
      else if (typeof data === 'string') { setError('Server error. Make sure the backend is running.'); }
      else if (data.detail) { setError(data.detail); }
      else {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        setError(msgs.join(' · '));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Top branding */}
      <div className="flex-shrink-0 flex items-center gap-4 px-6 pt-14 pb-8">
        <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/40">
          <span className="text-2xl">🍽️</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Kitchen Sync</h1>
          <p className="text-gray-400 text-xs mt-0.5">Join as a Vendor</p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-[2rem] px-6 pt-7 pb-10 safe-bottom overflow-y-auto">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <StepDot n={1} active={step === 1} done={step > 1} />
          <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > 1 ? 'bg-brand-500' : 'bg-gray-100'}`} />
          <StepDot n={2} active={step === 2} done={false} />
        </div>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Your Kitchen</h2>
            <p className="text-gray-400 text-sm mb-6">Basic information about your business</p>

            <form onSubmit={nextStep} className="space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-4 mb-2">
                <label htmlFor="logo-upload" className="cursor-pointer flex-shrink-0">
                  {logoPreview
                    ? <img src={logoPreview} className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-200 shadow" alt="Logo" />
                    : <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-300 transition-colors">
                        <span className="text-2xl">📷</span>
                        <span className="text-xs mt-1 font-medium">Logo</span>
                      </div>
                  }
                </label>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Kitchen Logo</p>
                  <p className="text-xs text-gray-400 mt-0.5">Optional · Square image works best</p>
                  {logoPreview && (
                    <button type="button" onClick={() => { setLogo(null); setLogoPreview(''); }} className="text-xs text-red-400 font-medium mt-1">Remove</button>
                  )}
                </div>
              </div>

              <Field label="Your Name" placeholder="e.g. Ramesh Kumar"
                value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
              <Field label="Kitchen Name" placeholder="e.g. Ramesh Idli Stall"
                value={form.kitchen_name} onChange={v => setForm(f => ({ ...f, kitchen_name: v }))} required />
              <Field label="Mobile Number" placeholder="9876543210" type="tel"
                value={form.mobile_number} onChange={v => setForm(f => ({ ...f, mobile_number: v }))} required />

              <button type="submit" className="btn-primary mt-2">Continue</button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mb-4 -ml-1">
              <span className="text-lg leading-none">←</span> Back
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Almost there</h2>
            <p className="text-gray-400 text-sm mb-6">Set your password and address</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required minLength={6}
                    className="input-field pr-12"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <Field label="Confirm Password" placeholder="Re-enter password"
                type="password" value={form.confirm_password}
                onChange={v => setForm(f => ({ ...f, confirm_password: v }))} required />

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Kitchen Address</label>
                <textarea
                  placeholder="e.g. Near Bus Stand, Hyderabad"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  required rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex gap-3">
                <span className="text-lg flex-shrink-0">⏳</span>
                <p className="text-sm text-amber-700 font-medium">An admin will approve your account before you can log in.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Spinner /> Creating Account...</> : 'Create Account'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-400 mt-8">
          Already registered?{' '}
          <Link to="/vendor/login" className="text-brand-500 font-bold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</label>
      <input
        {...props}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}

function StepDot({ n, active, done }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
      ${active ? 'bg-brand-500 text-white ring-4 ring-brand-100' : done ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
      {done ? '✓' : n}
    </div>
  );
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}
