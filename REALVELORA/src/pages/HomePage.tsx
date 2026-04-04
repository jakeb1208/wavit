import { Link } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';

export default function HomePage() {
  const shops = useQueueStore(s => s.shops);
  const featured = shops.slice(0, 4);

  return (
    <div className="min-h-screen bg-violet-50/50 pb-20 sm:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 text-white">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute top-10 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-medium text-violet-200 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live queue times
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4 leading-none">
            <span className="text-white">wav</span>
            <span className="text-violet-300">it</span>
          </h1>
          <p className="text-violet-200 text-base sm:text-lg font-medium mb-3">Waive the Wait</p>
          <p className="text-sm sm:text-base max-w-xl mx-auto leading-relaxed text-white/70 mb-8">
            Skip the waiting room. Check live queue times at local businesses
            and get notified when it's your turn — no app needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-white text-violet-800 rounded-2xl font-bold text-sm hover:bg-violet-50 transition-all duration-200 shadow-xl shadow-violet-900/30"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find a Shop
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-white/10 text-white rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all duration-200 border border-white/20 backdrop-blur-sm"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 48L60 42C120 36 240 24 360 20C480 16 600 20 720 26C840 32 960 40 1080 40C1200 40 1320 32 1380 28L1440 24V48H1380C1320 48 1200 48 1080 48C960 48 840 48 720 48C600 48 480 48 360 48C240 48 120 48 60 48H0Z" fill="rgb(245 243 255 / 0.5)"/>
          </svg>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-0 py-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: shops.length.toString(), label: 'Local Shops' },
            { value: shops.filter(s => s.queue.filter(t => !t.exitedAt).length === 0).length.toString(), label: 'No Wait Now' },
            { value: '0 min', label: 'Avg Join Time' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 text-center border border-violet-100/60 shadow-sm">
              <p className="text-xl font-black text-violet-700">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              ),
              title: 'Scan & Join',
              desc: 'Scan the shop\'s QR code or use the direct link to instantly join the queue.',
            },
            {
              step: '02',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Track Live',
              desc: 'See your real-time position and estimated wait. Go anywhere while you wait.',
            },
            {
              step: '03',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'Get Notified',
              desc: 'Receive a text when you\'re almost up so you return right on time.',
            },
          ].map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-violet-100/60 hover:shadow-md hover:border-violet-200 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <span className="text-xs font-bold text-violet-300 tracking-widest">{step.step}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured shops */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Nearby Shops</h2>
          <Link
            to="/search"
            className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            View all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-violet-100/60 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded-lg w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featured.map(shop => (
              <ShopCard key={shop.id} shop={shop} showJoinLink />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
