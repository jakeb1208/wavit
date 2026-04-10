import { Link } from 'react-router-dom';
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
    desc: 'Scan the QR code at the shop door or search by name to find your spot.',
  },
  {
    n: '2',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Go Live Your Life',
    desc: 'Leave and do whatever you want. Your spot is held — we track it for you.',
  },
  {
    n: '3',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'Get Texted In',
    desc: "You'll get an SMS the moment your turn is approaching. Walk back right on time.",
  },
];

export default function HomePage() {
  const shops = useQueueStore(s => s.shops);
  const featured = shops.slice(0, 4);
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
            Live queue tracking — no app needed
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
            Join any local shop's queue from your phone. Track your spot live.
            Walk back when it's your turn — not a minute before.
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
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
