import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';

const steps = [
  {
    n: '1',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M17.657 17.657l-.707-.707M12 19v1M6.343 17.657l-.707-.707M4 12H3M6.343 6.343l.707.707" />
        <circle cx="12" cy="12" r="4" strokeWidth={2} />
      </svg>
    ),
    title: 'Scan or Search',
    desc: 'Scan the QR code at the shop door or search by name to check in to the queue.',
  },
  {
    n: '2',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Watch Your Wait Time',
    desc: 'See your live wait time and position right on your phone — updated every few seconds.',
  },
  {
    n: '3',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'Get Texted When It\'s Your Turn',
    desc: "You'll get an SMS the moment your turn is approaching. No guessing, no staring at a screen.",
  },
];

export default function HomePage() {
  const shops = useQueueStore(s => s.shops);
  const fetchShops = useQueueStore(s => s.fetchShops);
  const navigate = useNavigate();
  const featured = shops.slice(0, 4);

  useEffect(() => {
    fetchShops();
    const interval = setInterval(fetchShops, 10000);
    return () => clearInterval(interval);
  }, [fetchShops]);

  const noWait = shops.filter(s => s.queue.filter((t: any) => !t.exitedAt).length === 0).length;

  return (
    <div className="min-h-screen bg-gray-300 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a0845] via-[#1d3a8a] to-[#1e40af]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-24 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute top-16 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-blue-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-blue-200 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            See your wait time live from your phone — no app needed
          </div>

          <h1 className="font-pacifico text-7xl sm:text-9xl mb-2 leading-none text-blue-400">
            wavit
          </h1>
          <div className="flex justify-center mb-6">
            <svg viewBox="0 0 200 16" width="200" height="16" style={{ display: 'block' }} fill="none">
              <path
                d="M4,10 C18,2 36,16 54,10 C72,4 90,16 108,10 C126,4 144,16 162,10 C178,4 192,8 196,7"
                stroke="#60a5fa"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-blue-200 text-lg sm:text-xl font-bold mb-3 tracking-wide">
            Waive the Wait
          </p>

          <p className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed text-white/70 mb-10 font-medium">
            Check in at any local shop, then watch your exact wait time right
            from your phone — and get a text the moment it's your turn.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-300 to-transparent" />
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 -mt-8 mb-10 relative z-10">
          {[
            { value: String(shops.length || '—'), label: 'Shops live' },
            { value: String(noWait || '—'), label: 'No wait now' },
            { value: '< 30s', label: 'To join queue' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 text-center border-2 border-gray-200 shadow-md">
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-3">
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-black text-black leading-none">{s.value}</span>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section className="mb-10">
          <div className="text-center mb-7">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">How It Works</h2>
            <p className="text-sm text-gray-600 font-medium">Three simple steps to skip the wait</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-md hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-center relative"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black flex items-center justify-center border-2 border-blue-600">
                  <span className="text-xs font-black text-blue-400">{step.n}</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center mx-auto mb-4 mt-2">
                  {step.icon}
                </div>
                <h3 className="font-black text-gray-900 mb-2 text-base">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured shops */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Nearby Shops</h2>
            <Link
              to="/search"
              className="px-4 py-2 bg-blue-600 border-2 border-blue-700 text-black font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              View all
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featured.map(shop => (
                <ShopCard key={shop.id} shop={shop} showJoinLink />
              ))}
            </div>
          )}
        </section>

        {/* CTA banner */}
        <section className="mb-10">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">Own a shop?</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Get Wavit for your business. Manage your queue, reduce no-shows, send auto SMS alerts.
              </p>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="shrink-0 px-6 py-3.5 bg-blue-600 border-2 border-blue-700 text-black font-bold text-sm hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap cursor-pointer"
            >
              Apply Now
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
