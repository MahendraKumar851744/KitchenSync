import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { getCustomerLocalId } from '../../utils/localStorage';

const STEPS = ['RECEIVED', 'ACCEPTED', 'READY', 'COMPLETED'];

const STATUS_META = {
  RECEIVED:  { label: 'Order Received',   emoji: '📋', sub: 'Waiting for kitchen to accept',   color: 'text-blue-600',  bg: 'bg-blue-500',  ring: 'ring-blue-100',  badge: 'bg-blue-50 text-blue-600 border-blue-100' },
  ACCEPTED:  { label: 'Being Prepared',   emoji: '👨‍🍳', sub: 'Your food is being cooked',       color: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-amber-100', badge: 'bg-amber-50 text-amber-700 border-amber-100' },
  READY:     { label: 'Ready for Pickup', emoji: '🎉', sub: 'Go show your number at the counter!', color: 'text-green-600', bg: 'bg-green-500', ring: 'ring-green-100', badge: 'bg-green-50 text-green-700 border-green-100' },
  COMPLETED: { label: 'Completed',        emoji: '✅', sub: 'Enjoy your meal!',                  color: 'text-gray-500',  bg: 'bg-gray-400',  ring: 'ring-gray-100',  badge: 'bg-gray-50 text-gray-500 border-gray-200' },
  CANCELLED: { label: 'Cancelled',        emoji: '❌', sub: 'This order has been cancelled',     color: 'text-red-600',   bg: 'bg-red-500',   ring: 'ring-red-100',   badge: 'bg-red-50 text-red-600 border-red-100' },
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [otherOrders, setOtherOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevStatus, setPrevStatus] = useState(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const localId = getCustomerLocalId();

    function fetch() {
      api.get(`/orders/customer/${localId}/`)
        .then(res => {
          const all = res.data;
          const found = all.find(o => o.id === orderId);
          if (found) {
            setOrder(prev => {
              if (prev && prev.order_status !== found.order_status) {
                setPulse(true);
                setTimeout(() => setPulse(false), 1000);
              }
              return found;
            });
          }
          setOtherOrders(all.filter(o => o.id !== orderId && !['COMPLETED', 'CANCELLED'].includes(o.order_status)));
        })
        .finally(() => setLoading(false));
    }

    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading order...</p>
      </div>
    </div>
  );

  if (!order) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-8">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-800">Order not found</h2>
        <p className="text-gray-400 text-sm mt-2">It may have expired or doesn't belong to this device.</p>
      </div>
    </div>
  );

  const meta = STATUS_META[order.order_status] || STATUS_META['RECEIVED'];
  const currentStep = STEPS.indexOf(order.order_status);
  const isCancelled = order.order_status === 'CANCELLED';
  const isDone = ['COMPLETED', 'CANCELLED'].includes(order.order_status);
  const isReady = order.order_status === 'READY';

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* ── Status Hero ── */}
      <div className={`${meta.bg} relative overflow-hidden`}>
        {/* Decorative rings */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10" />

        <div className="relative text-white text-center px-6 pt-14 pb-20 max-w-lg mx-auto">
          <p className="text-sm font-semibold opacity-70 uppercase tracking-widest mb-2">Order Number</p>
          <h1 className={`text-9xl font-black tracking-tight leading-none tabular-nums transition-all duration-300 ${pulse ? 'scale-110' : 'scale-100'}`}>
            {String(order.simple_order_id).padStart(3, '0')}
          </h1>

          <div className={`mt-6 inline-flex flex-col items-center gap-1 bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-3 ${isReady ? 'animate-pulse' : ''}`}>
            <span className="text-2xl">{meta.emoji}</span>
            <p className="font-bold text-lg mt-0.5">{meta.label}</p>
            <p className="text-sm opacity-80 text-center">{meta.sub}</p>
          </div>

          {!isDone && (
            <div className="mt-4 flex items-center justify-center gap-1.5 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <p className="text-xs">Live · updates every 5 seconds</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-5 space-y-3">

        {/* ── Progress Steps ── */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Order Progress</p>
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[13px] top-3.5 bottom-3.5 w-0.5 bg-gray-100" />
              <div
                className={`absolute left-[13px] top-3.5 w-0.5 ${meta.bg} transition-all duration-700`}
                style={{ height: `${Math.max(0, (currentStep / (STEPS.length - 1))) * 100}%` }}
              />
              <div className="space-y-6 relative">
                {STEPS.filter(s => s !== 'CANCELLED').map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  const sm = STATUS_META[step];
                  return (
                    <div key={step} className="flex items-center gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 transition-all duration-500
                        ${active ? `${sm.bg} text-white ring-4 ${sm.ring}` : done ? `${sm.bg} text-white` : 'bg-gray-100 text-gray-300'}`}>
                        {done && !active ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${active ? sm.color : done ? 'text-gray-700' : 'text-gray-300'}`}>
                          {sm.label}
                        </p>
                        {active && <p className="text-xs text-gray-400 mt-0.5">{sm.sub}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Order Items ── */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            {order.vendor_name}
          </p>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums">{item.quantity}×</span>
                  <span className="text-gray-800 text-sm font-medium">{item.menu_item_name}</span>
                </div>
                <span className="text-gray-500 text-sm tabular-nums">₹{(parseFloat(item.item_price) * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-100 mt-3 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-sm">Total Paid</span>
            <span className="font-black text-gray-900 tabular-nums">₹{parseFloat(order.total_amount).toFixed(0)}</span>
          </div>
        </div>

        {/* ── Other active orders ── */}
        {otherOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Other Orders</p>
            <div className="space-y-2">
              {otherOrders.map(o => {
                const om = STATUS_META[o.order_status] || STATUS_META['RECEIVED'];
                return (
                  <Link key={o.id} to={`/orders/${o.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xl text-gray-800 tabular-nums">
                        #{String(o.simple_order_id).padStart(3, '0')}
                      </span>
                      <span className="text-gray-400 text-sm">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${om.badge}`}>{o.order_status}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Order Again ── */}
        <button
          onClick={() => navigate(`/v/${order.vendor_qr_id}`)}
          className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-4 rounded-2xl text-sm active:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <span>Order Again</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
