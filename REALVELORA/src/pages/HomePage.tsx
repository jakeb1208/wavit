import { Link } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';

const steps = [
  {
    n: '1',
    title: 'Scan or Search',
    desc: 'Scan the QR code at the shop door or search by name to find your spot.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
      </svg>
    ),
  },
  {
    n: '2',
    title: 'Go Live Your Life',
    desc: 'Leave and do whatever you want. Your spot is held — we track it for you.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    n: '3',
    title: 'Get Texted In',
    desc: "You'll get an SMS the moment your turn is approaching. Walk back right on time.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const shops = useQueueStore(s => s.shops);
  const featured = shops.slice(0, 4);
  const noWait = shops.filter(s => s.queue.filter((t: any) => !t.exitedAt).length === 0).length;

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a0845] via-[#2d0f6e] to-[#3b1fa3]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-24 w-[500px] h-[500px] bg-violet-500/15 rounded-full blur-3xl" />
          <div className="absolute top-16 right-0 w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-indigo-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-violet-200 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live queue tracking — no app needed
          </div>

          <h1 className="text-6xl sm:text-8xl font-black tracking-tight mb-4 leading-none text-white">
            wav<span className="text-violet-400">it</span>
          </h1>

          <p className="text-violet-300 text-lg sm:text-xl font-semibold mb-3 tracking-wide">
            Waive the Wait
          </p>

          <p className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed text-white/60 mb-10">
            Join any local shop's queue from your phone. Track your spot live.
            Walk back when it's your turn — not a minute before.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-violet-800 rounded-2xl font-bold text-sm hover:bg-violet-50 transition-all shadow-2xl shadow-violet-900/40 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find a Shop Near You
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 border border-white/20 text-white/80 rounded-2xl font-semibold text-sm hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              How it works
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8f7ff] to-transparent" />
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 -mt-6 mb-10 relative z-10">
          {[
            { value: String(shops.length || '—'), label: 'Shops live' },
            { value: String(noWait || '—'), label: 'No wait now' },
            { value: '< 30s', label: 'To join queue' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm shadow-gray-200/60">
              <p className="text-xl sm:text-2xl font-black text-violet-700">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/40 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-violet-400/30">
                    {step.icon}
                  </div>
                  <span className="text-2xl font-black text-violet-100 select-none">{step.n}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 text-[15px]">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured shops */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Nearby Shops</h2>
            <Link to="/search" className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
              View all
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
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
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-1">Own a shop?</h3>
              <p className="text-sm text-violet-200 leading-relaxed">
                Get Wavit for your business. Manage your queue, reduce no-shows, send auto SMS alerts.
              </p>
            </div>
            <Link
              to="/about"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-white text-violet-700 font-bold text-sm rounded-xl hover:bg-violet-50 transition-colors shadow-md shadow-violet-900/30 whitespace-nowrap"
            >
              Learn More →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
