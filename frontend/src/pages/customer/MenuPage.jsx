import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { getCustomerLocalId, getCart, saveCart } from '../../utils/localStorage';

export default function MenuPage() {
  const { unique_qr_id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(() => getCart(unique_qr_id));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [headerCompact, setHeaderCompact] = useState(false);
  const catPillRefs = useRef({});
  const catBarRef = useRef(null);
  const catPillsContainerRef = useRef(null);
  const sectionRefs = useRef({});
  const scrolling = useRef(false);

  useEffect(() => {
    getCustomerLocalId();
    api.get(`/v/${unique_qr_id}/`)
      .then(res => { setVendor(res.data.vendor); setCategories(res.data.categories || []); })
      .catch(() => setError('Menu not available.'))
      .finally(() => setLoading(false));
  }, [unique_qr_id]);

  // Compact header on scroll
  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: update active category pill as user scrolls
  useEffect(() => {
    if (!categories.length) return;
    const observer = new IntersectionObserver(
      entries => {
        if (scrolling.current) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.catId;
            if (id) {
              setActiveCategory(id);
              scrollPillIntoView(id);
            }
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [categories]);

  function scrollPillIntoView(id) {
    const pill = catPillRefs.current[id];
    const container = catPillsContainerRef.current;
    if (pill && container) {
      const pLeft = pill.offsetLeft;
      const pWidth = pill.offsetWidth;
      const cWidth = container.offsetWidth;
      container.scrollTo({ left: pLeft - cWidth / 2 + pWidth / 2, behavior: 'smooth' });
    }
  }

  function scrollToCategory(catId) {
    setActiveCategory(catId);
    scrollPillIntoView(catId);
    const el = sectionRefs.current[catId];
    if (el) {
      scrolling.current = true;
      const barH = catBarRef.current?.offsetHeight || 56;
      const top = el.getBoundingClientRect().top + window.scrollY - barH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => { scrolling.current = false; }, 800);
    }
  }

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      const updated = existing
        ? prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
        : [...prev, { ...item, quantity: 1 }];
      saveCart(unique_qr_id, updated);
      return updated;
    });
  }, [unique_qr_id]);

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => {
      const updated = prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c).filter(c => c.quantity > 0);
      saveCart(unique_qr_id, updated);
      return updated;
    });
  }, [unique_qr_id]);

  const cartTotal = cart.reduce((s, c) => s + parseFloat(c.price) * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const allItemCount = categories.reduce((s, c) => s + c.items.length, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading menu...</p>
      </div>
    </div>
  );

  if (error || !vendor) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-8">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-800">Menu unavailable</h2>
        <p className="text-gray-400 mt-2 text-sm leading-relaxed">This QR code may be inactive or invalid.</p>
      </div>
    </div>
  );

  const hasCats = categories.length > 1;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* ── Hero Header ── */}
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className={`transition-all duration-300 ${headerCompact ? 'py-2' : 'py-4'}`}>
          <div className="max-w-lg mx-auto px-4 flex items-center gap-3">
            {vendor.kitchen_logo
              ? <img src={vendor.kitchen_logo} alt={vendor.kitchen_name}
                  className={`rounded-xl object-cover flex-shrink-0 transition-all duration-300 ${headerCompact ? 'w-9 h-9' : 'w-14 h-14'}`} />
              : <div className={`rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${headerCompact ? 'w-9 h-9 text-xl' : 'w-14 h-14 text-3xl'}`}>🍽️</div>
            }
            <div className="flex-1 min-w-0">
              <h1 className={`font-black text-gray-900 truncate transition-all duration-300 ${headerCompact ? 'text-base' : 'text-xl'}`}>
                {vendor.kitchen_name}
              </h1>
              {!headerCompact && (
                <p className="text-gray-400 text-sm truncate mt-0.5">{vendor.address}</p>
              )}
            </div>
            {!vendor.is_active && (
              <span className="flex-shrink-0 text-xs bg-red-50 text-red-500 border border-red-100 px-2.5 py-1 rounded-full font-semibold">Closed</span>
            )}
          </div>
        </div>

        {/* Category Pills */}
        {hasCats && (
          <div ref={catBarRef} className="border-t border-gray-100">
            <div ref={catPillsContainerRef} className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat.id || 'other'}
                  ref={el => catPillRefs.current[cat.id] = el}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Menu Content ── */}
      <div className="max-w-lg mx-auto">

        {categories.length === 0 && (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🍱</div>
            <p className="font-bold text-gray-700 text-lg">No items available</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
          </div>
        )}

        {categories.map((cat, ci) => (
          <section
            key={cat.id || 'other'}
            ref={el => { sectionRefs.current[cat.id] = el; }}
            data-cat-id={cat.id}
          >
            {hasCats && (
              <div className={`px-4 ${ci === 0 ? 'pt-5' : 'pt-6'} pb-2`}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cat.name}</h2>
                <p className="text-xs text-gray-300 mt-0.5">{cat.items.length} item{cat.items.length !== 1 ? 's' : ''}</p>
              </div>
            )}

            <div className="px-4 space-y-0">
              {cat.items.map((item, ii) => {
                const cartItem = cart.find(c => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 py-4 ${ii < cat.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    {/* Item image */}
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                      : <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-2xl flex-shrink-0">🍱</div>
                    }

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</p>
                      <p className="text-brand-500 font-bold text-base mt-1">₹{parseFloat(item.price).toFixed(0)}</p>
                    </div>

                    {/* Add / Qty control */}
                    <div className="flex-shrink-0">
                      {cartItem ? (
                        <div className="flex items-center bg-brand-500 rounded-xl overflow-hidden shadow-md shadow-brand-500/30">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-9 h-9 flex items-center justify-center text-white font-bold text-lg active:bg-brand-600 transition-colors"
                          >−</button>
                          <span className="text-white font-black text-sm w-7 text-center tabular-nums">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-9 h-9 flex items-center justify-center text-white font-bold text-lg active:bg-brand-600 transition-colors"
                          >+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-9 h-9 flex items-center justify-center bg-white border-2 border-brand-500 text-brand-500 font-bold text-xl rounded-xl active:bg-brand-50 transition-colors shadow-sm"
                        >+</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>

      {/* ── Floating Cart Bar ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 safe-bottom animate-slide-up">
          <button
            onClick={() => navigate(`/v/${unique_qr_id}/checkout`)}
            className="w-full max-w-lg mx-auto flex items-center justify-between bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-4 active:scale-[0.97] transition-transform"
          >
            <span className="bg-brand-500 text-white text-sm font-black px-2.5 py-1 rounded-lg min-w-[30px] text-center tabular-nums">{cartCount}</span>
            <span className="font-bold text-base">View Cart</span>
            <span className="font-black text-base tabular-nums">₹{cartTotal.toFixed(0)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
