import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { getCustomerLocalId } from '../../utils/localStorage';

const STEPS = ['RECEIVED', 'ACCEPTED', 'READY', 'COMPLETED'];

const STEP_INFO = {
  RECEIVED:  { label: 'Order Received',   icon: '📋', desc: 'Waiting for vendor to accept your order.' },
  ACCEPTED:  { label: 'Being Prepared',   icon: '👨‍🍳', desc: 'Your food is being cooked right now!' },
  READY:     { label: 'Ready for Pickup', icon: '🎉', desc: 'Go to the counter and show your order number!' },
  COMPLETED: { label: 'Completed',        icon: '✅', desc: 'Enjoy your meal!' },
  CANCELLED: { label: 'Cancelled',        icon: '❌', desc: 'This order has been cancelled.' },
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localId = getCustomerLocalId();

    const fetchOrder = () => {
      api.get(`/orders/customer/${localId}/`)
        .then(res => {
          const found = res.data.find(o => o.id === orderId);
          if (found) setOrder(found);
        })
        .finally(() => setLoading(false));
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Fetching your order...</p>
      </div>
    </div>
  );

  if (!order) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-6">
        <p className="text-5xl mb-4">🔍</p>
        <h2 className="text-xl font-bold text-gray-800">Order not found</h2>
      </div>
    </div>
  );

  const info = STEP_INFO[order.order_status] || STEP_INFO['RECEIVED'];
  const currentStep = STEPS.indexOf(order.order_status);
  const isCancelled = order.order_status === 'CANCELLED';
  const isReady = order.order_status === 'READY';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Big Order Number Card */}
      <div className={`${isReady ? 'bg-green-500' : isCancelled ? 'bg-red-500' : 'bg-brand-500'} text-white pt-12 pb-10 px-6 text-center transition-colors duration-500`}>
        <p className="text-sm font-medium opacity-80 mb-1">Your Order Number</p>
        <h1 className="text-8xl font-black tracking-tight leading-none">
          {String(order.simple_order_id).padStart(3, '0')}
        </h1>
        <p className="mt-4 text-lg font-medium opacity-90">{info.icon} {info.label}</p>
        <p className="mt-1 text-sm opacity-75">{info.desc}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-5">
        {/* Status Steps */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5 mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">Order Progress</p>
            <div className="space-y-4">
              {STEPS.filter(s => s !== 'CANCELLED').map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                      ${done ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${active ? 'text-brand-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                        {STEP_INFO[step].label}
                      </p>
                    </div>
                    {active && (
                      <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Items</p>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.quantity}× {item.menu_item_name}</span>
                <span className="text-gray-500">₹{item.item_price}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-100 pt-2 flex justify-between font-bold">
              <span>Total Paid</span>
              <span>₹{order.total_amount}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          This page refreshes automatically every 5 seconds
        </p>
      </div>
    </div>
  );
}
