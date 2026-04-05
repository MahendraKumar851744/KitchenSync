import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../utils/api';
import { getCustomerLocalId, getCart, clearCart } from '../../utils/localStorage';

export default function CheckoutPage() {
  const { unique_qr_id } = useParams();
  const navigate = useNavigate();
  const cart = getCart(unique_qr_id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = cart.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0);

  async function handleCheckout() {
    setLoading(true);
    setError('');
    try {
      const customerLocalId = getCustomerLocalId();
      const { data } = await api.post('/checkout/', {
        vendor_qr_id: unique_qr_id,
        customer_local_id: customerLocalId,
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
      <div className="text-center px-6">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-brand-500 font-semibold">← Go back to menu</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600">
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">Your Order</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {cart.map((item, i) => (
            <div key={item.id} className={`flex items-center justify-between px-4 py-3.5 ${i < cart.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="bg-brand-50 text-brand-600 text-xs font-bold px-2 py-0.5 rounded-lg">{item.quantity}×</span>
                <span className="font-medium text-gray-800">{item.name}</span>
              </div>
              <span className="text-gray-700 font-semibold">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4 space-y-2.5">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Bill Summary</p>
          <div className="flex justify-between text-gray-600">
            <span>Item Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Platform Fee</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          <div className="border-t border-dashed border-gray-100 pt-2.5 flex justify-between font-bold text-gray-900 text-lg">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex gap-3">
          <span className="text-lg">📱</span>
          <p className="text-sm text-orange-700">After placing your order, you'll get a <strong>3-digit order number</strong>. Show it at the counter when your food is ready.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-700 text-sm">{error}</div>
        )}
      </div>

      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 safe-bottom px-4 pb-4">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 bg-brand-500 disabled:bg-brand-300 text-white rounded-2xl px-5 py-4 shadow-xl font-semibold text-base active:scale-[0.98] transition-all"
        >
          {loading
            ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
            : <>Place Order · ₹{total.toFixed(2)}</>
          }
        </button>
      </div>
      <div className="h-24" />
    </div>
  );
}
