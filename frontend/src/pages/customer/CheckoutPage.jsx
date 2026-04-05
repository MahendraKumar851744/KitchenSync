import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../utils/api';
import { getCustomerLocalId, getCart, saveCart, clearCart } from '../../utils/localStorage';

export default function CheckoutPage() {
  const { unique_qr_id } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => getCart(unique_qr_id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = cart.reduce((s, c) => s + parseFloat(c.price) * c.quantity, 0);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

  function updateQty(id, delta) {
    const updated = cart
      .map(c => c.id === id ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0);
    setCart(updated);
    saveCart(unique_qr_id, updated);
  }

  async function handleCheckout() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/checkout/', {
        vendor_qr_id: unique_qr_id,
        customer_local_id: getCustomerLocalId(),
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.quantity })),
      });
      clearCart(unique_qr_id);
      navigate(`/orders/${data.order_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-8">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-400 text-sm mt-2">Go back and add some items.</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-brand-500 font-bold text-sm">
          ← Back to menu
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Your Cart</h1>
            <p className="text-xs text-gray-400">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-36 space-y-3">

        {/* ── Cart Items ── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {cart.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < cart.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                <p className="text-brand-500 font-bold text-sm mt-0.5">₹{parseFloat(item.price).toFixed(0)} each</p>
              </div>
              <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 font-bold text-lg active:bg-gray-200 transition-colors"
                >−</button>
                <span className="font-black text-gray-900 text-sm w-7 text-center tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.id, +1)}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 font-bold text-lg active:bg-gray-200 transition-colors"
                >+</button>
              </div>
              <p className="text-gray-900 font-bold text-sm w-14 text-right tabular-nums flex-shrink-0">
                ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Bill Summary ── */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill Summary</p>
          <div className="space-y-2.5">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal ({itemCount} items)</span>
              <span className="font-medium tabular-nums">₹{total.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxes & Charges</span>
              <span className="text-green-600 font-semibold">Free</span>
            </div>
            <div className="border-t border-gray-100 pt-2.5">
              <div className="flex justify-between">
                <span className="font-black text-gray-900">Total to Pay</span>
                <span className="font-black text-gray-900 text-lg tabular-nums">₹{total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Info card ── */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3.5 flex gap-3 items-start">
          <span className="text-brand-500 flex-shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
          </span>
          <p className="text-sm text-brand-700 font-medium leading-relaxed">
            You'll receive a <span className="font-black">3-digit order number</span> after placing your order. Show it at the counter when your food is ready.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
        )}
      </div>

      {/* ── Place Order Button ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 safe-bottom bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pt-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="btn-primary"
          >
            {loading
              ? <><Spinner /> Placing Order...</>
              : <>Place Order · <span className="tabular-nums">₹{total.toFixed(0)}</span></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}
