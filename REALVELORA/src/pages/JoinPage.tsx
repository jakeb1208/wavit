import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import PostJoinAd from '../components/PostJoinAd';

export default function JoinPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const getShop = useQueueStore(s => s.getShop);
  const fetchShops = useQueueStore(s => s.fetchShops);
  const joinQueue = useQueueStore(s => s.joinQueue);
  const shops = useQueueStore(s => s.shops);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const shop = shopId ? getShop(shopId) : undefined;
  const waitRange = shop?.waitRange || '';
  const activeQueue = shop?.queue.filter((t: any) => !t.exitedAt) || [];

  const handleAdDone = useCallback(() => {
    if (pendingRoute) navigate(pendingRoute);
  }, [pendingRoute, navigate]);

  if (!shopId) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">QR Code Required</h2>
          <p className="text-sm text-gray-500 mb-5">Scan the QR code at the business to join their queue.</p>
          <Link to="/" className="text-sm font-semibold text-violet-600">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (shops.length > 0 && !shop) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Shop Not Found</h2>
          <p className="text-sm text-gray-500 mb-5">This QR code doesn't match any active shop.</p>
          <Link to="/search" className="text-sm font-semibold text-violet-600">Browse shops</Link>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-violet-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (shop.queueOpen === false) {
    return (
      <div className="min-h-screen bg-[#f8f7ff]">
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="font-pacifico text-lg text-blue-600" style={{ textDecoration: 'none' }}>
            wavit
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500 font-medium truncate">{shop.name}</span>
        </div>
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
            <svg className="w-9 h-9 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Queue is Closed</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            <strong>{shop.name}</strong> is not accepting new customers right now.
          </p>
          {shop.openingTime && (
            <p className="text-sm text-violet-600 font-semibold mb-6">
              Opens at {shop.openingTime}
            </p>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors"
          >
            Find Another Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) { setError('Please enter a valid name'); return; }
    if (!/^[\p{L}\p{M}'\-\s.]{2,}$/u.test(trimmedName)) { setError('Name contains invalid characters'); return; }
    if (!trimmedPhone || !/^[0-9+\-\s()]{7,}$/.test(trimmedPhone)) { setError('Please enter a valid phone number'); return; }

    setJoining(true);
    const ticket = await joinQueue(shopId, trimmedName, trimmedPhone);
    if (ticket) {
      setPendingRoute(`/queue/${shopId}/${ticket.id}`);
    } else {
      setError('Could not join queue. Please try again.');
      setJoining(false);
    }
  };

  if (pendingRoute) return <PostJoinAd onDone={handleAdDone} />;

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-pacifico text-lg text-blue-600" style={{ textDecoration: 'none' }}>
          wavit
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 font-medium truncate">{shop.name}</span>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Shop header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-violet-700">
              {shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-gray-900 truncate">{shop.name}</h1>
            <p className="text-sm text-gray-400">
              {shop.category}
              {shop.zipCode && <span> · ZIP {shop.zipCode}</span>}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {waitRange && (
                <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg">
                  {waitRange} wait
                </span>
              )}
              {activeQueue.length > 0 && (
                <span className="text-xs text-gray-400">{activeQueue.length} in line</span>
              )}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Join the Queue</h2>
            <p className="text-sm text-gray-400 mb-6">
              We'll text you when your turn is approaching.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white transition-all font-medium placeholder:font-normal placeholder:text-gray-400"
                  autoFocus
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white transition-all font-medium placeholder:font-normal placeholder:text-gray-400"
                  autoComplete="tel"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2.5 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={joining}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-violet-400/25 active:scale-[0.98] mt-1"
              >
                {joining ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Queue'
                )}
              </button>
            </form>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-start gap-2.5 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Your number is only used for queue notifications. We never share it.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
