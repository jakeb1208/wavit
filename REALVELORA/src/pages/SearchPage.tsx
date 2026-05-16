import { useState, useMemo } from 'react';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';
import { isNative } from '../lib/platform';

const CATEGORIES = ['All', 'Barbershop', 'Salon', 'Nail Salon', 'Spa', 'Clinic'];

function NativeSearchPage() {
  const shops = useQueueStore(s => s.shops);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    let results = shops;
    if (activeCategory !== 'All') {
      results = results.filter(s => s.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    return results;
  }, [shops, query, activeCategory]);

  const noWaitCount = filtered.filter(s => s.queue.filter((t: any) => !t.exitedAt).length === 0).length;

  const BG = '#070b14';
  const GLASS = 'rgba(255,255,255,0.055)';
  const BORDER = 'rgba(255,255,255,0.09)';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, ${BG} 55%)`,
        color: '#f0f4ff',
        paddingBottom: '24px',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 16px 0' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '2px' }}>
          Find a Shop
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', fontWeight: 500, marginBottom: '16px' }}>
          {shops.length > 0
            ? `${shops.length} shops · ${noWaitCount} with no wait right now`
            : 'Loading shops…'}
        </p>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <svg
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(148,163,184,0.5)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or category…"
            style={{
              width: '100%',
              padding: '13px 40px 13px 42px',
              fontSize: '14px',
              fontWeight: 500,
              background: GLASS,
              border: `1px solid ${BORDER}`,
              borderRadius: '16px',
              color: '#f0f4ff',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'rgba(148,163,184,0.6)',
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            marginLeft: '-16px',
            paddingLeft: '16px',
            marginRight: '-16px',
            paddingRight: '16px',
            scrollbarWidth: 'none',
            WebkitScrollbar: { display: 'none' },
            marginBottom: '16px',
          }}
        >
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '20px',
                  border: active ? '1px solid rgba(59,130,246,0.5)' : `1px solid ${BORDER}`,
                  background: active
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(99,102,241,0.22) 100%)'
                    : GLASS,
                  color: active ? '#93c5fd' : 'rgba(148,163,184,0.65)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: active ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                  transition: 'all 0.15s',
                  letterSpacing: '-0.1px',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {(query !== '' || activeCategory !== 'All') && (
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(148,163,184,0.5)', marginBottom: '12px' }}>
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>

      <div style={{ padding: '0 16px' }}>
        {shops.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: GLASS,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '18px',
                  padding: '18px',
                  height: '72px',
                }}
              >
                <div className="native-skeleton" style={{ height: '14px', width: '60%', borderRadius: '8px', marginBottom: '8px' }} />
                <div className="native-skeleton" style={{ height: '11px', width: '35%', borderRadius: '6px' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <svg style={{ width: '28px', height: '28px', color: '#60a5fa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p style={{ fontWeight: 800, fontSize: '16px', color: '#f0f4ff', marginBottom: '6px' }}>No shops found</p>
            <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)', marginBottom: '20px' }}>Try a different search or category</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); }}
              style={{
                padding: '11px 24px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.2) 100%)',
                border: '1px solid rgba(99,140,255,0.28)',
                borderRadius: '14px',
                color: '#93c5fd',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(shop => (
              <ShopCard key={shop.id} shop={shop} showJoinLink />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const native = isNative();
  const shops = useQueueStore(s => s.shops);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    let results = shops;
    if (activeCategory !== 'All') {
      results = results.filter(s => s.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    return results;
  }, [shops, query, activeCategory]);

  if (native) return <NativeSearchPage />;

  const noWaitCount = filtered.filter(s => s.queue.filter((t: any) => !t.exitedAt).length === 0).length;

  return (
    <div className="min-h-screen bg-gray-300 pb-24 sm:pb-10">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Find a Shop</h1>
          <p className="text-sm text-gray-600 font-medium">
            {shops.length > 0
              ? `${shops.length} shops · ${noWaitCount} with no wait right now`
              : 'Loading shops...'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-4 space-y-3">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full pl-11 pr-10 py-3.5 text-sm bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all font-medium placeholder:font-normal placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 text-xs font-bold border-2 transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-blue-700 border-blue-800 text-black'
                  : 'bg-blue-600 border-blue-700 text-black hover:bg-blue-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length > 0 && query === '' && activeCategory === 'All' ? null : (
          <p className="text-xs text-gray-600 font-bold">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {shops.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-5">
                <div className="flex gap-3">
                  <div className="w-10 h-10 skeleton rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 skeleton rounded-lg w-2/3 mb-2" />
                    <div className="h-3 skeleton rounded-lg w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-black text-gray-800 mb-1">No shops found</p>
            <p className="text-sm text-gray-600 font-medium mb-4">Try a different search or category</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); }}
              className="px-5 py-2.5 bg-blue-600 border-2 border-blue-700 text-black font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(shop => (
              <ShopCard key={shop.id} shop={shop} showJoinLink />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
