import { useState, useMemo } from 'react';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';

export default function SearchPage() {
  const shops = useQueueStore(s => s.shops);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return shops;
    const q = query.toLowerCase();
    return shops.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [shops, query]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Waiting Times
          </h1>
          <p className="text-sm text-gray-500">
            Live wait times · Join only via shop QR code
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search shops by name, category, or phone..."
              className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="px-4 py-3 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {filtered.length} {filtered.length === 1 ? 'shop' : 'shops'} found
        </p>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 font-medium">No shops found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
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
