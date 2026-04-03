import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';

export default function JoinPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const getShop = useQueueStore(s => s.getShop);
  const joinQueue = useQueueStore(s => s.joinQueue);
  const tick = useQueueStore(s => s.tick);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [shopName, setShopName] = useState('');
  const [waitRange, setWaitRange] = useState('');

  const shop = shopId ? getShop(shopId) : undefined;

  useEffect(() => {
    const interval = setInterval(tick, 2000);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    if (shop) {
      setShopName(shop.name);
      setWaitRange(useQueueStore.getState().calcWaitRange(shop));
    }
  }, [shop]);

  if (!shopId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">QR Code Required</h2>
          <p className="text-gray-500 text-sm">
            Please scan the QR code provided by the business to join their queue.
          </p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Shop Not Found</h2>
          <p className="text-gray-500 text-sm">
            The shop linked to this QR code doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
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
    const ticket = joinQueue(shopId, trimmedName, trimmedPhone);
    if (ticket) {
      navigate(`/queue/${shopId}/${ticket.id}`);
    } else {
      setError('Could not join queue. Please try again.');
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Shop header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
            <h1 className="text-xl font-bold">{shopName}</h1>
            <p className="text-sm opacity-80 mt-1">Join the queue</p>
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-white/20 rounded-lg text-sm font-medium backdrop-blur-sm">
              Current wait: {waitRange}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={joining}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-sm shadow-blue-600/20"
            >
              {joining ? (
                <span className="inline-flex items-center gap-2">
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

            <p className="text-xs text-gray-400 text-center">
              You'll receive SMS updates to this number. Your turn cannot be held past the estimated time.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
