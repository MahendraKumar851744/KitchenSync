import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { clearVendorToken } from '../../utils/localStorage';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    api.get('/admin/vendors/pending/').then(r => setVendors(r.data)).catch(() => {});
    api.get('/admin/analytics/').then(r => setAnalytics(r.data)).catch(() => {});
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

  function logout() {
    clearVendorToken();
    navigate('/vendor/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white pt-10 pb-6 px-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium">Kitchen Sync</p>
            <h1 className="text-xl font-bold mt-0.5">Admin Panel</h1>
          </div>
          <button onClick={logout} className="text-gray-300 text-sm bg-gray-700 px-3 py-1.5 rounded-xl">Logout</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Stats */}
        {analytics && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Revenue', value: `₹${analytics.total_revenue}`, icon: '💰' },
              { label: 'Total Orders',  value: analytics.total_orders,        icon: '📦' },
              { label: 'Active Vendors',value: analytics.active_vendors,      icon: '🏪' },
              { label: 'Pending Approvals', value: analytics.pending_vendors, icon: '⏳' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl shadow-sm px-4 py-4">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pending Vendors */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
            Pending Approvals ({vendors.length})
          </p>

          {vendors.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-semibold text-gray-700">All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">No pending vendor approvals</p>
            </div>
          )}

          <div className="space-y-3">
            {vendors.map(vendor => (
              <div key={vendor.id} className="bg-white rounded-2xl shadow-sm px-4 py-4">
                <div className="flex items-start gap-3">
                  {vendor.kitchen_logo
                    ? <img src={vendor.kitchen_logo} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
                    : <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{vendor.kitchen_name}</p>
                    <p className="text-sm text-gray-500">{vendor.name}</p>
                    <p className="text-sm text-gray-400">{vendor.mobile_number}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{vendor.address}</p>
                  </div>
                </div>
                <button
                  onClick={() => approve(vendor.id)}
                  disabled={approvingId === vendor.id}
                  className="mt-3 w-full bg-green-500 disabled:bg-green-300 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm"
                >
                  {approvingId === vendor.id
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Approving...</>
                    : '✓ Approve Vendor'
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
