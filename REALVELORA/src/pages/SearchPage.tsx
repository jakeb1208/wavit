import { useState, useMemo } from 'react';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';

const CATEGORIES = ['All', 'Barbershop', 'Salon', 'Nail Salon', 'Spa', 'Clinic'];

export default function SearchPage() {
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
          s.category.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }
    return results;
  }, [shops, query, activeCategory]);

  const noWaitShops = filtered.filter(s => s.queue.filter(t => !t.exitedAt).length === 0).length;

  return (
    <div className="min-h-screen bg-violet-50/50 pb-24 sm:pb-8">
      {/* Header */}
      <section className="bg-white border-b border-violet-100/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-0.5">
            Live Wait Times
          </h1>
          <p className="text-sm text-gray-500">
            {shops.length} shops · {noWaitShops} with no wait right now
          </p>
        </div>
      </section>

      {/* Search + filter */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-3">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full pl-11 pr-10 py-3.5 text-sm bg-white border border-violet-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all duration-200 shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          {filtered.length} {filtered.length === 1 ? 'shop' : 'shops'} found
        </p>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {shops.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-violet-100/60 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded-lg w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">No shops found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or category</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); }}
              className="mt-4 text-sm text-violet-600 font-medium hover:text-violet-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(shop => (
              <ShopCard key={shop.id} shop={shop} showJoinLink />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
