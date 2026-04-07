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

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const shop = shopId ? getShop(shopId) : undefined;
  const waitRange = shop?.waitRange || '';
  const activeQueue = shop?.queue.filter(t => !t.exitedAt) || [];

  const handleAdDone = useCallback(() => {
    if (pendingRoute) navigate(pendingRoute);
  }, [pendingRoute, navigate]);

  if (!shopId) {
    return (
      <div className="min-h-screen bg-violet-50/50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl border border-violet-100 shadow-sm max-w-sm w-full">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">QR Code Required</h2>
          <p className="text-sm text-gray-500 mb-5">
            Scan the QR code at the business to join their queue.
          </p>
          <Link to="/" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (shops.length > 0 && !shop) {
    return (
      <div className="min-h-screen bg-violet-50/50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl border border-violet-100 shadow-sm max-w-sm w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Shop Not Found</h2>
          <p className="text-sm text-gray-500 mb-5">
            This QR code doesn't match any active shop.
          </p>
          <Link to="/search" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
            Browse shops →
          </Link>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-violet-50/50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-violet-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter a valid name');
      return;
    }

    if (!/^[\p{L}\p{M}'\-\s.]{2,}$/u.test(trimmedName)) {
      setError('Name contains invalid characters');
      return;
    }

    if (!trimmedPhone || !/^[0-9+\-\s()]{7,}$/.test(trimmedPhone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setJoining(true);
    const ticket = await joinQueue(shopId, trimmedName, trimmedPhone);
    if (ticket) {
      setPendingRoute(`/queue/${shopId}/${ticket.id}`);
    } else {
      setError('Could not join queue. Please try again.');
      setJoining(false);
    }
  };

  if (pendingRoute) {
    return <PostJoinAd onDone={handleAdDone} />;
  }

  return (
    <div className="min-h-screen bg-violet-50/50 pb-24 sm:pb-8">
      {/* Shop banner */}
      <div className="bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-800 px-4 sm:px-6 pt-8 pb-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-violet-300 hover:text-white text-sm mb-5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            wavit
          </Link>
          <h1 className="text-2xl font-black mb-1">{shop.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2.5 py-1 bg-white/15 rounded-full">{shop.category}</span>
            {waitRange && (
              <span className="text-xs px-2.5 py-1 bg-white/15 rounded-full font-medium">
                Wait: {waitRange}
              </span>
            )}
            {activeQueue.length > 0 && (
              <span className="text-xs text-violet-300">{activeQueue.length} in line</span>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L60 35C120 30 240 20 360 16C480 12 600 16 720 22C840 28 960 36 1080 36C1200 36 1320 28 1380 24L1440 20V40H0Z" fill="rgb(245 243 255 / 0.5)"/>
          </svg>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-md mx-auto px-4 sm:px-6 -mt-6">
        <div className="bg-white rounded-3xl border border-violet-100/60 shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Join the Queue</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter your details and we'll text you when it's your turn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white transition-all duration-200"
                  autoFocus
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white transition-all duration-200"
                  autoComplete="tel"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-2xl border border-red-100">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={joining}
                className="w-full py-4 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 text-white font-bold text-sm rounded-2xl transition-all duration-200 shadow-md shadow-violet-400/30 mt-2"
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

          <div className="px-6 py-4 bg-violet-50/50 border-t border-violet-100/60">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              SMS updates will be sent to your number when it's nearly your turn.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
