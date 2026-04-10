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
          s.category.toLowerCase().includes(q)
      );
    }
    return results;
  }, [shops, query, activeCategory]);

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
        {/* Search input */}
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

        {/* Category pills */}
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
