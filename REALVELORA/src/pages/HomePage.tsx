import { Link } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';

export default function HomePage() {
  const shops = useQueueStore(s => s.shops);
  const featured = shops.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            velora
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed opacity-90 mb-8">
            Skip the waiting room. Check live wait times for local businesses,
            join queues instantly via QR code — no app download required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/search"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all duration-200 shadow-lg shadow-blue-900/20"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find a Shop
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              ),
              title: 'Scan QR Code',
              desc: 'Visit a participating business and scan their QR code to join the queue instantly.',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Track Your Wait',
              desc: 'See your live position and estimated wait time updated in real-time.',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'Get Notified',
              desc: "Receive a text alert when it's your turn so you can return promptly.",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured shops */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Nearby Shops</h2>
          <Link
            to="/search"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featured.map(shop => (
            <ShopCard key={shop.id} shop={shop} showJoinLink />
          ))}
        </div>
      </section>
    </div>
  );
}
