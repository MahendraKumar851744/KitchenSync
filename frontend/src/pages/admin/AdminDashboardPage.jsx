import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { clearVendorToken } from '../../utils/localStorage';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/vendors/pending/').then(r => setVendors(r.data)).catch(() => {}),
      api.get('/admin/analytics/').then(r => setAnalytics(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function approve(id) {
    setApprovingId(id);
    try {
      await api.patch(`/admin/vendors/${id}/approve/`);
      setVendors(prev => prev.filter(v => v.id !== id));
    } finally {
      setApprovingId(null);
    }
  }

  function logout() { clearVendorToken(); navigate('/vendor/login'); }

  const stats = analytics ? [
    { label: 'Total Revenue',     value: `₹${Number(analytics.total_revenue).toLocaleString('en-IN')}`, icon: '₹',    color: 'text-emerald-400' },
    { label: 'Total Orders',      value: analytics.total_orders,        icon: '📦',   color: 'text-blue-400' },
    { label: 'Active Vendors',    value: analytics.active_vendors,      icon: '🏪',   color: 'text-purple-400' },
    { label: 'Pending Approvals', value: analytics.pending_vendors,     icon: '⏳',   color: 'text-amber-400' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Header ── */}
      <div className="safe-top px-5 pt-10 pb-6 border-b border-white/5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/40">
              <span className="text-lg">🍽️</span>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium tracking-widest uppercase">Kitchen Sync</p>
              <h1 className="text-lg font-black leading-tight">Admin Panel</h1>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5 space-y-5">

        {/* ── Stats ── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/8 rounded-2xl px-4 py-4 hover:bg-white/8 transition-colors">
                <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-gray-400 text-xs font-medium mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Pending Vendors ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Approvals</p>
            {vendors.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
                {vendors.length} waiting
              </span>
            )}
          </div>

          {vendors.length === 0 && !loading && (
            <div className="bg-white/5 border border-white/8 rounded-2xl py-12 text-center">
              <p className="text-3xl mb-3">✅</p>
              <p className="font-semibold text-gray-300">All caught up!</p>
              <p className="text-sm text-gray-500 mt-1">No pending vendor approvals</p>
            </div>
          )}

          <div className="space-y-3">
            {vendors.map(vendor => (
              <div key={vendor.id} className="bg-white/5 border border-white/8 rounded-2xl p-4 hover:bg-white/8 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  {vendor.kitchen_logo
                    ? <img src={vendor.kitchen_logo} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/10" alt="" />
                    : <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-base">{vendor.kitchen_name}</p>
                    <p className="text-gray-300 text-sm mt-0.5">{vendor.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-gray-500 text-xs flex items-center gap-1">📞 {vendor.mobile_number}</span>
                    </div>
                    {vendor.address && (
                      <p className="text-gray-500 text-xs mt-1 truncate">📍 {vendor.address}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => approve(vendor.id)}
                  disabled={approvingId === vendor.id}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                >
                  {approvingId === vendor.id
                    ? <><Spinner /> Approving...</>
                    : <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Approve Vendor
                      </>
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}
