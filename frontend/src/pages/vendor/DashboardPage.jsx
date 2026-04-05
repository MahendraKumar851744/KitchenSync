import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { clearVendorToken } from '../../utils/localStorage';

const STATUS_NEXT = { RECEIVED: 'ACCEPTED', ACCEPTED: 'READY', READY: 'COMPLETED' };
const STATUS_LABEL = { RECEIVED: 'Accept Order', ACCEPTED: 'Mark Ready', READY: 'Mark Complete' };
const STATUS_COLOR = {
  RECEIVED:  'bg-blue-50 border-blue-200 text-blue-700',
  ACCEPTED:  'bg-amber-50 border-amber-200 text-amber-700',
  READY:     'bg-green-50 border-green-200 text-green-700',
  COMPLETED: 'bg-gray-50 border-gray-200 text-gray-500',
};
const STATUS_BTN = {
  RECEIVED: 'bg-blue-500 active:bg-blue-600',
  ACCEPTED: 'bg-amber-500 active:bg-amber-600',
  READY:    'bg-green-500 active:bg-green-600',
};

const TABS = ['Orders', 'Menu', 'Analytics'];

const EMPTY_ITEM = { name: '', price: '', is_available: true };

export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Orders');
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Menu state
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = add mode, object = edit mode
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [itemImage, setItemImage] = useState(null);
  const [itemImagePreview, setItemImagePreview] = useState('');
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  function fetchAll() {
    fetchOrders();
    api.get('/vendor/analytics/').then(r => setAnalytics(r.data)).catch(() => {});
    api.get('/vendor/profile/').then(r => setVendor(r.data)).catch(() => {});
    fetchMenu();
  }

  function fetchOrders() {
    api.get('/vendor/orders/').then(r => setOrders(r.data)).catch(() => {});
  }

  function fetchMenu() {
    api.get('/vendor/menu/').then(r => setMenuItems(r.data)).catch(() => {});
  }

  async function updateStatus(orderId, newStatus) {
    setUpdatingId(orderId);
    try {
      await api.patch(`/vendor/orders/${orderId}/status/`, { order_status: newStatus });
      fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  }

  function openAddForm() {
    setEditItem(null);
    setItemForm(EMPTY_ITEM);
    setItemImage(null);
    setItemImagePreview('');
    setItemError('');
    setShowForm(true);
  }

  function openEditForm(item) {
    setEditItem(item);
    setItemForm({ name: item.name, price: item.price, is_available: item.is_available });
    setItemImage(null);
    setItemImagePreview(item.image || '');
    setItemError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setItemImage(file);
      setItemImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleItemSubmit(e) {
    e.preventDefault();
    setItemLoading(true);
    setItemError('');
    try {
      const fd = new FormData();
      fd.append('name', itemForm.name);
      fd.append('price', itemForm.price);
      fd.append('is_available', itemForm.is_available);
      if (itemImage) fd.append('image', itemImage);

      if (editItem) {
        await api.patch(`/vendor/menu/${editItem.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/vendor/menu/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      fetchMenu();
      closeForm();
    } catch (err) {
      const data = err.response?.data;
      if (!data || typeof data === 'string') setItemError('Failed to save item.');
      else setItemError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · '));
    } finally {
      setItemLoading(false);
    }
  }

  async function toggleAvailability(item) {
    setTogglingId(item.id);
    try {
      await api.patch(`/vendor/menu/${item.id}/`, { is_available: !item.is_available });
      fetchMenu();
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setDeletingId(item.id);
    try {
      await api.delete(`/vendor/menu/${item.id}/`);
      fetchMenu();
    } finally {
      setDeletingId(null);
    }
  }

  function logout() {
    clearVendorToken();
    navigate('/vendor/login');
  }

  const received  = orders.filter(o => o.order_status === 'RECEIVED');
  const inKitchen = orders.filter(o => o.order_status === 'ACCEPTED');
  const ready     = orders.filter(o => o.order_status === 'READY');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-500 text-white pt-10 pb-4 px-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-brand-200 text-xs font-medium">Kitchen Sync</p>
            <h1 className="text-xl font-bold mt-0.5">{vendor?.kitchen_name || 'Dashboard'}</h1>
          </div>
          <button onClick={logout} className="text-brand-100 text-sm font-medium bg-brand-600 px-3 py-1.5 rounded-xl active:bg-brand-700">
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto flex gap-1 mt-4 bg-brand-600 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-brand-600' : 'text-brand-100'}`}
            >
              {t} {t === 'Orders' && orders.length > 0 && <span className="ml-1 bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full">{orders.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {tab === 'Orders' && (
          <div className="space-y-4">
            {orders.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🧑‍🍳</p>
                <p className="font-semibold text-gray-700">No active orders</p>
                <p className="text-sm text-gray-400 mt-1">New orders will appear here automatically</p>
              </div>
            )}

            {/* New Orders */}
            {received.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">New Orders ({received.length})</p>
                {received.map(order => <OrderCard key={order.id} order={order} onUpdate={updateStatus} updatingId={updatingId} />)}
              </div>
            )}
            {inKitchen.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">In Kitchen ({inKitchen.length})</p>
                {inKitchen.map(order => <OrderCard key={order.id} order={order} onUpdate={updateStatus} updatingId={updatingId} />)}
              </div>
            )}
            {ready.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Ready for Pickup ({ready.length})</p>
                {ready.map(order => <OrderCard key={order.id} order={order} onUpdate={updateStatus} updatingId={updatingId} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'Menu' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{menuItems.length} item{menuItems.length !== 1 ? 's' : ''}</p>
              <button
                onClick={openAddForm}
                className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 active:bg-brand-600"
              >
                <span className="text-lg leading-none">+</span> Add Item
              </button>
            </div>

            {menuItems.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🍱</p>
                <p className="font-semibold text-gray-700">No menu items yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first item to get started</p>
              </div>
            )}

            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-20 h-20 object-cover flex-shrink-0" />
                    : <div className="w-20 h-20 bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl">🍽️</div>
                  }
                  <div className="flex-1 px-3 py-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-brand-500 font-bold text-sm mt-0.5">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditForm(item)}
                          className="text-gray-400 p-1.5 rounded-lg active:bg-gray-100"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          disabled={deletingId === item.id}
                          className="text-gray-400 p-1.5 rounded-lg active:bg-red-50 disabled:opacity-40"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAvailability(item)}
                      disabled={togglingId === item.id}
                      className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                        item.is_available
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}
                    >
                      {togglingId === item.id ? '...' : item.is_available ? 'Available' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Analytics' && analytics && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Today's Orders" value={analytics.today_orders} icon="📦" />
              <StatCard label="Today's Revenue" value={`₹${analytics.today_revenue}`} icon="💰" />
              <StatCard label="Total Orders" value={analytics.total_orders} icon="📊" />
              <StatCard label="Total Revenue" value={`₹${analytics.total_revenue}`} icon="🏆" />
            </div>
            {analytics.top_items?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Top Selling Items</p>
                <div className="space-y-2">
                  {analytics.top_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                        <span className="text-sm font-medium text-gray-800">{item.menu_item__name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{item.total_sold} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Item Bottom Sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} />
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 safe-bottom max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Item' : 'Add Menu Item'}</h3>
              <button onClick={closeForm} className="text-gray-400 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-4">
              {/* Image */}
              <div className="flex flex-col items-center gap-2">
                <label htmlFor="item-img" className="cursor-pointer">
                  {itemImagePreview
                    ? <img src={itemImagePreview} alt="preview" className="w-24 h-24 rounded-2xl object-cover border-2 border-brand-300" />
                    : <div className="w-24 h-24 rounded-2xl bg-brand-50 border-2 border-dashed border-brand-200 flex flex-col items-center justify-center text-brand-400">
                        <span className="text-3xl">📷</span>
                        <span className="text-xs mt-1">Add Photo</span>
                      </div>
                  }
                </label>
                <input ref={imageInputRef} id="item-img" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                {itemImagePreview && (
                  <button type="button" onClick={() => { setItemImage(null); setItemImagePreview(''); if (imageInputRef.current) imageInputRef.current.value = ''; }} className="text-xs text-red-400">Remove photo</button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Masala Dosa"
                  value={itemForm.name}
                  onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 text-base"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  value={itemForm.price}
                  onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                  required
                  min="1"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 text-base"
                />
              </div>

              {/* Availability */}
              <label className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Available for ordering</span>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative ${itemForm.is_available ? 'bg-brand-500' : 'bg-gray-300'}`}
                  onClick={() => setItemForm(f => ({ ...f, is_available: !f.is_available }))}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${itemForm.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>

              {itemError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-700 text-sm">{itemError}</div>
              )}

              <button
                type="submit"
                disabled={itemLoading}
                className="w-full bg-brand-500 disabled:bg-brand-300 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-base"
              >
                {itemLoading
                  ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  : editItem ? 'Save Changes' : 'Add Item'
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onUpdate, updatingId }) {
  const isUpdating = updatingId === order.id;
  const nextStatus = STATUS_NEXT[order.order_status];

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden mb-3`}>
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${STATUS_COLOR[order.order_status]}`}>
        <span className="font-bold text-2xl">#{order.simple_order_id_display}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_COLOR[order.order_status]}`}>
          {order.order_status}
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="space-y-1 mb-3">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity}× {item.menu_item_name}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">₹{order.total_amount}</span>
          {nextStatus && (
            <button
              onClick={() => onUpdate(order.id, nextStatus)}
              disabled={isUpdating}
              className={`${STATUS_BTN[order.order_status]} text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 flex items-center gap-2 active:scale-[0.97] transition-transform`}
            >
              {isUpdating
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : STATUS_LABEL[order.order_status]
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
