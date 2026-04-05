import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { getCustomerLocalId, getCart, saveCart } from '../../utils/localStorage';

export default function MenuPage() {
  const { unique_qr_id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState(() => getCart(unique_qr_id));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCustomerLocalId();
    api.get(`/v/${unique_qr_id}/`)
      .then(res => { setVendor(res.data.vendor); setMenu(res.data.menu); })
      .catch(() => setError('This menu is not available.'))
      .finally(() => setLoading(false));
  }, [unique_qr_id]);

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      const updated = existing
        ? prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
        : [...prev, { ...item, quantity: 1 }];
      saveCart(unique_qr_id, updated);
      return updated;
    });
  }

  function removeFromCart(itemId) {
    setCart(prev => {
      const updated = prev
        .map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
        .filter(c => c.quantity > 0);
      saveCart(unique_qr_id, updated);
      return updated;
    });
  }

  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading menu...</p>
      </div>
    </div>
  );

  if (error || !vendor) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-6">
        <p className="text-5xl mb-4">😕</p>
        <h2 className="text-xl font-bold text-gray-800">Menu not found</h2>
        <p className="text-gray-500 mt-1">This QR code may be inactive or invalid.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center gap-4">
          {vendor.kitchen_logo
            ? <img src={vendor.kitchen_logo} alt={vendor.kitchen_name} className="w-16 h-16 rounded-2xl object-cover shadow" />
            : <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl">🍽️</div>
          }
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{vendor.kitchen_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{vendor.address}</p>
            {!vendor.is_active && (
              <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                Currently Closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Menu</p>
        <div className="flex flex-col gap-3">
          {menu.length === 0 && (
            <div className="text-center py-16 text-gray-400">No items available right now.</div>
          )}
          {menu.map(item => {
            const cartItem = cart.find(c => c.id === item.id);
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm flex items-center gap-3 p-3 active:scale-[0.99] transition-transform">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center text-3xl flex-shrink-0">🍱</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-brand-500 font-bold mt-0.5">₹{item.price}</p>
                </div>
                <div className="flex-shrink-0">
                  {cartItem ? (
                    <div className="flex items-center gap-2 bg-brand-500 rounded-xl px-2 py-1">
                      <button onClick={() => removeFromCart(item.id)} className="text-white w-7 h-7 flex items-center justify-center font-bold text-lg leading-none">−</button>
                      <span className="text-white font-bold w-4 text-center">{cartItem.quantity}</span>
                      <button onClick={() => addToCart(item)} className="text-white w-7 h-7 flex items-center justify-center font-bold text-lg leading-none">+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-brand-50 border border-brand-200 text-brand-600 font-semibold text-sm px-4 py-2 rounded-xl active:bg-brand-100 transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 safe-bottom px-4 pb-4">
          <button
            onClick={() => navigate(`/v/${unique_qr_id}/checkout`)}
            className="w-full max-w-lg mx-auto flex items-center justify-between bg-brand-500 text-white rounded-2xl px-5 py-4 shadow-xl active:scale-[0.98] transition-transform"
          >
            <span className="bg-brand-600 rounded-lg px-2 py-0.5 text-sm font-bold">{cartCount}</span>
            <span className="font-semibold text-base">View Cart</span>
            <span className="font-bold text-base">₹{cartTotal.toFixed(0)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
