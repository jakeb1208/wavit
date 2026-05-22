import { useState, useMemo, useEffect } from 'react';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';
import { isNative } from '../lib/platform';
import LiveRefreshBadge from '../components/LiveRefreshBadge';

const CATEGORIES = ['All', 'Barbershop', 'Salon', 'Nail Salon', 'Spa', 'Clinic'];

function NativeSearchPage() {
  const shops = useQueueStore(s => s.shops);
  const fetchShops = useQueueStore(s => s.fetchShops);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchShops();
    const interval = setInterval(fetchShops, 10000);
    return () => clearInterval(interval);
  }, [fetchShops]);

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', fontWeight: 500 }}>
            {shops.length > 0
              ? `${shops.length} shops · ${noWaitCount} with no wait right now`
              : 'Loading shops…'}
          </p>
          {shops.length > 0 && <LiveRefreshBadge />}
        </div>

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
  const fetchShops = useQueueStore(s => s.fetchShops);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchShops();
    const interval = setInterval(fetchShops, 10000);
    return () => clearInterval(interval);
  }, [fetchShops]);

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

  const GLASS = 'rgba(255,255,255,0.055)';
  const BORDER = 'rgba(255,255,255,0.09)';

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(30,58,138,0.22) 0%, #070b14 55%)', paddingBottom: '40px', paddingTop: '72px' }}>
      {/* Header */}
      <div style={{ background: GLASS, borderBottom: `1px solid ${BORDER}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-5">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#f0f4ff', marginBottom: '4px', letterSpacing: '-0.5px' }}>Find a Shop</h1>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', fontWeight: 500 }}>
                {shops.length > 0
                  ? `${shops.length} shops · ${noWaitCount} with no wait right now`
                  : 'Loading shops...'}
              </p>
            </div>
            {shops.length > 0 && <LiveRefreshBadge />}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-4" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(148,163,184,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or category..."
            style={{ width: '100%', paddingLeft: '42px', paddingRight: '40px', paddingTop: '13px', paddingBottom: '13px', fontSize: '14px', fontWeight: 500, background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '14px', color: '#f0f4ff', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', outline: 'none', boxSizing: 'border-box' as const }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(148,163,184,0.6)' }}>
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0, padding: '7px 16px', fontSize: '12px', fontWeight: 700, borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s',
                  border: active ? '1px solid rgba(59,130,246,0.5)' : `1px solid ${BORDER}`,
                  background: active ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.22))' : GLASS,
                  color: active ? '#93c5fd' : 'rgba(148,163,184,0.65)',
                  boxShadow: active ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {!(filtered.length > 0 && query === '' && activeCategory === 'All') && (
          <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.5)', fontWeight: 700 }}>
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {shops.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: '14px', borderRadius: '8px', width: '60%', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '11px', borderRadius: '6px', width: '35%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg style={{ width: '28px', height: '28px', color: '#60a5fa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p style={{ fontWeight: 800, fontSize: '16px', color: '#f0f4ff', marginBottom: '6px' }}>No shops found</p>
            <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.6)', marginBottom: '20px' }}>Try a different search or category</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); }}
              style={{ padding: '11px 24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.2))', border: '1px solid rgba(99,140,255,0.28)', borderRadius: '14px', color: '#93c5fd', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
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
