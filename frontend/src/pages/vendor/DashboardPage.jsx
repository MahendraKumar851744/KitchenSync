import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { clearVendorToken } from '../../utils/localStorage';

const STATUS_NEXT = { RECEIVED: 'ACCEPTED', ACCEPTED: 'READY', READY: 'COMPLETED' };
const STATUS_LABEL = { RECEIVED: 'Accept', ACCEPTED: 'Mark Ready', READY: 'Complete' };
const STATUS_COLOR = {
  RECEIVED:  'bg-blue-50 border-blue-200 text-blue-700',
  ACCEPTED:  'bg-amber-50 border-amber-200 text-amber-700',
  READY:     'bg-green-50 border-green-200 text-green-700',
  COMPLETED: 'bg-gray-50 border-gray-200 text-gray-400',
};
const STATUS_BTN = {
  RECEIVED: 'bg-blue-500 active:bg-blue-600',
  ACCEPTED: 'bg-amber-500 active:bg-amber-600',
  READY:    'bg-green-500 active:bg-green-600',
};

const TABS = ['Orders', 'Menu', 'Analytics'];
const EMPTY_ITEM = { name: '', price: '', is_available: true, category: '' };

export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Orders');
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Menu
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [itemImage, setItemImage] = useState(null);
  const [itemImagePreview, setItemImagePreview] = useState('');
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const imageRef = useRef(null);

  // Categories
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState('');
  const [deletingCatId, setDeletingCatId] = useState(null);

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
    fetchCategories();
  }

  function fetchOrders() {
    api.get('/vendor/orders/').then(r => setOrders(r.data)).catch(() => {});
  }

  function fetchMenu() {
    api.get('/vendor/menu/').then(r => setMenuItems(r.data)).catch(() => {});
  }

  function fetchCategories() {
    api.get('/vendor/categories/').then(r => setCategories(r.data)).catch(() => {});
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

  // --- Category actions ---
  async function addCategory(e) {
    e.preventDefault();
    setCatLoading(true);
    setCatError('');
    try {
      await api.post('/vendor/categories/', { name: catName, sort_order: categories.length });
      setCatName('');
      setShowCatForm(false);
      fetchCategories();
    } catch (err) {
      const d = err.response?.data;
      setCatError(d?.name?.[0] || d?.detail || 'Failed to add category.');
    } finally {
      setCatLoading(false);
    }
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? Items will become uncategorized.`)) return;
    setDeletingCatId(cat.id);
    try {
      await api.delete(`/vendor/categories/${cat.id}/`);
      fetchCategories();
      fetchMenu();
    } finally {
      setDeletingCatId(null);
    }
  }

  // --- Item actions ---
  function openAddItem() {
    setEditItem(null);
    setItemForm(EMPTY_ITEM);
    setItemImage(null);
    setItemImagePreview('');
    setItemError('');
    setShowItemForm(true);
  }

  function openEditItem(item) {
    setEditItem(item);
    setItemForm({ name: item.name, price: item.price, is_available: item.is_available, category: item.category || '' });
    setItemImage(null);
    setItemImagePreview(item.image || '');
    setItemError('');
    setShowItemForm(true);
  }

  function closeItemForm() { setShowItemForm(false); setEditItem(null); }

  async function handleItemSubmit(e) {
    e.preventDefault();
    setItemLoading(true);
    setItemError('');
    try {
      const fd = new FormData();
      fd.append('name', itemForm.name);
      fd.append('price', itemForm.price);
      fd.append('is_available', itemForm.is_available);
      if (itemForm.category) fd.append('category', itemForm.category);
      if (itemImage) fd.append('image', itemImage);
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editItem) {
        await api.patch(`/vendor/menu/${editItem.id}/`, fd, { headers });
      } else {
        await api.post('/vendor/menu/', fd, { headers });
      }
      fetchMenu();
      closeItemForm();
    } catch (err) {
      const d = err.response?.data;
      if (!d || typeof d === 'string') setItemError('Failed to save item.');
      else setItemError(Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · '));
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

  function logout() { clearVendorToken(); navigate('/vendor/login'); }

  const received  = orders.filter(o => o.order_status === 'RECEIVED');
  const inKitchen = orders.filter(o => o.order_status === 'ACCEPTED');
  const ready     = orders.filter(o => o.order_status === 'READY');

  const filteredItems = selectedCatFilter === 'all'
    ? menuItems
    : selectedCatFilter === 'none'
      ? menuItems.filter(i => !i.category)
      : menuItems.filter(i => i.category === selectedCatFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-500 text-white pt-10 pb-4 px-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-brand-200 text-xs font-medium tracking-wide uppercase">Kitchen Sync</p>
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
              {t}
              {t === 'Orders' && orders.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{orders.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* ── ORDERS TAB ── */}
        {tab === 'Orders' && (
          <div className="space-y-4">
            {orders.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🧑‍🍳</p>
                <p className="font-semibold text-gray-700">No active orders</p>
                <p className="text-sm text-gray-400 mt-1">New orders appear here automatically</p>
              </div>
            )}
            {received.length > 0 && (
              <section>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">New ({received.length})</p>
                {received.map(o => <OrderCard key={o.id} order={o} onUpdate={updateStatus} updatingId={updatingId} />)}
              </section>
            )}
            {inKitchen.length > 0 && (
              <section>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">In Kitchen ({inKitchen.length})</p>
                {inKitchen.map(o => <OrderCard key={o.id} order={o} onUpdate={updateStatus} updatingId={updatingId} />)}
              </section>
            )}
            {ready.length > 0 && (
              <section>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Ready ({ready.length})</p>
                {ready.map(o => <OrderCard key={o.id} order={o} onUpdate={updateStatus} updatingId={updatingId} />)}
              </section>
            )}
          </div>
        )}

        {/* ── MENU TAB ── */}
        {tab === 'Menu' && (
          <div>
            {/* Categories row */}
            <div className="bg-white rounded-2xl shadow-sm px-4 py-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-800">Categories</p>
                <button
                  onClick={() => { setShowCatForm(v => !v); setCatName(''); setCatError(''); }}
                  className="text-brand-500 text-sm font-semibold"
                >
                  {showCatForm ? 'Cancel' : '+ Add'}
                </button>
              </div>

              {showCatForm && (
                <form onSubmit={addCategory} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g. Beverages"
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    required
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button
                    type="submit"
                    disabled={catLoading}
                    className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {catLoading ? '...' : 'Add'}
                  </button>
                </form>
              )}
              {catError && <p className="text-red-500 text-xs mb-2">{catError}</p>}

              {categories.length === 0 ? (
                <p className="text-sm text-gray-400">No categories yet. Add one to organise your menu.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-1 bg-brand-50 border border-brand-100 rounded-xl px-3 py-1.5">
                      <span className="text-sm font-medium text-brand-700">{cat.name}</span>
                      <span className="text-xs text-brand-400">({cat.item_count})</span>
                      <button
                        onClick={() => deleteCategory(cat)}
                        disabled={deletingCatId === cat.id}
                        className="ml-1 text-brand-300 hover:text-red-400 text-base leading-none disabled:opacity-40"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter + Add item */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1 mr-3">
                <FilterPill active={selectedCatFilter === 'all'} onClick={() => setSelectedCatFilter('all')}>All</FilterPill>
                {categories.map(c => (
                  <FilterPill key={c.id} active={selectedCatFilter === c.id} onClick={() => setSelectedCatFilter(c.id)}>{c.name}</FilterPill>
                ))}
                {menuItems.some(i => !i.category) && (
                  <FilterPill active={selectedCatFilter === 'none'} onClick={() => setSelectedCatFilter('none')}>Other</FilterPill>
                )}
              </div>
              <button
                onClick={openAddItem}
                className="flex-shrink-0 bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1 active:bg-brand-600"
              >
                + Add
              </button>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🍱</p>
                <p className="font-semibold text-gray-700">No items yet</p>
                <p className="text-sm text-gray-400 mt-1">Tap "+ Add" to add your first item</p>
              </div>
            )}

            <div className="space-y-3">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-20 h-20 object-cover flex-shrink-0" />
                    : <div className="w-20 h-20 bg-orange-50 flex items-center justify-center flex-shrink-0 text-3xl">🍽️</div>
                  }
                  <div className="flex-1 px-3 py-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                        {item.category_name && (
                          <p className="text-xs text-brand-400 font-medium mt-0.5">{item.category_name}</p>
                        )}
                        <p className="text-brand-500 font-bold text-sm mt-0.5">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg text-gray-400 active:bg-gray-100">✏️</button>
                        <button onClick={() => deleteItem(item)} disabled={deletingId === item.id} className="p-1.5 rounded-lg text-gray-400 active:bg-red-50 disabled:opacity-40">🗑️</button>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAvailability(item)}
                      disabled={togglingId === item.id}
                      className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                        item.is_available ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
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

        {/* ── ANALYTICS TAB ── */}
        {tab === 'Analytics' && (
          <div className="space-y-3">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Today's Orders" value={analytics.today_orders} icon="📦" />
                  <StatCard label="Today's Revenue" value={`₹${analytics.today_revenue}`} icon="💰" />
                  <StatCard label="Total Orders" value={analytics.total_orders} icon="📊" />
                  <StatCard label="Total Revenue" value={`₹${analytics.total_revenue}`} icon="🏆" />
                </div>
                {analytics.top_items?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Top Selling Items</p>
                    <div className="space-y-2.5">
                      {analytics.top_items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-sm font-medium text-gray-800 flex-1">{item.menu_item__name}</span>
                          <span className="text-sm text-gray-400 font-medium">{item.total_sold} sold</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-gray-400">Loading analytics...</div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Item Sheet */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={closeItemForm} />
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 safe-bottom max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Item' : 'Add Item'}</h3>
              <button onClick={closeItemForm} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl">&times;</button>
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
                <input ref={imageRef} id="item-img" type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setItemImage(f); setItemImagePreview(URL.createObjectURL(f)); }
                }} />
                {itemImagePreview && (
                  <button type="button" onClick={() => { setItemImage(null); setItemImagePreview(''); if (imageRef.current) imageRef.current.value = ''; }} className="text-xs text-red-400">Remove photo</button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Name</label>
                <input type="text" placeholder="e.g. Masala Dosa" value={itemForm.name}
                  onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 text-base" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹)</label>
                <input type="number" placeholder="e.g. 60" value={itemForm.price}
                  onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} required min="1" step="0.01"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 text-base" />
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 text-base bg-white">
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <label className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Available for ordering</span>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${itemForm.is_available ? 'bg-brand-500' : 'bg-gray-300'}`}
                  onClick={() => setItemForm(f => ({ ...f, is_available: !f.is_available }))}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${itemForm.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>

              {itemError && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-700 text-sm">{itemError}</div>}

              <button type="submit" disabled={itemLoading}
                className="w-full bg-brand-500 disabled:bg-brand-300 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-base active:scale-[0.98] transition-all">
                {itemLoading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : editItem ? 'Save Changes' : 'Add Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
      {children}
    </button>
  );
}

function OrderCard({ order, onUpdate, updatingId }) {
  const isUpdating = updatingId === order.id;
  const nextStatus = STATUS_NEXT[order.order_status];
  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mb-3">
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${STATUS_COLOR[order.order_status]}`}>
        <span className="font-black text-2xl tracking-tight">#{order.simple_order_id_display}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[order.order_status]}`}>{order.order_status}</span>
      </div>
      <div className="px-4 py-3">
        <div className="space-y-1 mb-3">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity}× {item.menu_item_name}</span>
              <span className="text-gray-400">₹{(item.item_price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="font-bold text-gray-900">₹{order.total_amount}</span>
          {nextStatus && (
            <button onClick={() => onUpdate(order.id, nextStatus)} disabled={isUpdating}
              className={`${STATUS_BTN[order.order_status]} text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 flex items-center gap-2 active:scale-[0.97] transition-transform`}>
              {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : STATUS_LABEL[order.order_status]}
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
      <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
