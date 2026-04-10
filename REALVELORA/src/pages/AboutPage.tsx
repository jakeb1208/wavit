import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Real-Time Tracking',
    desc: 'See your live position in queue and accurate wait time, updated every few seconds.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'SMS Notifications',
    desc: "Get a text when you're almost up. No app download, no account needed — ever.",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Live & Shared',
    desc: 'The queue is live for everyone. Real data, real time — powered by a real database.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Smart Auto-Remove',
    desc: "If you don't respond after being called, we check in by text and auto-remove you to keep things moving.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-300 pb-24 sm:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a0845] via-[#1d3a8a] to-[#1e40af] text-white px-4 sm:px-6 pt-12 pb-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="font-pacifico text-3xl text-blue-400">wavit</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4">Waive the Wait</h1>
          <p className="text-blue-200 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            A smarter way to manage queues at local businesses — and get your time back as a customer.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-300 to-transparent" />
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {/* Mission */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
          <h2 className="text-lg font-black text-gray-900 mb-3">Why We Built This</h2>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            Waiting rooms are outdated. Barbershops, salons, and local businesses lose customers
            to frustration every day. We built Wavit to give everyone their time back — customers
            can go grab coffee, run errands, or just relax while they wait. Businesses get a smoother
            flow with fewer no-shows and happier clients.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5 hover:border-blue-400 transition-colors">
              <div className="w-12 h-12 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Mission quote */}
        <div className="bg-white rounded-2xl border-2 border-blue-400 shadow-md p-6 text-center">
          <p className="text-xl font-black text-blue-600 mb-2">Our Mission</p>
          <p className="text-gray-700 text-sm leading-relaxed max-w-xs mx-auto font-medium">
            Eliminate unnecessary waiting — for customers who value their time
            and businesses who want happier clients.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 text-center">
          <p className="text-lg font-black text-gray-900 mb-1.5">Ready to skip the line?</p>
          <p className="text-sm text-gray-600 mb-5 font-medium">Find a shop near you and join their queue in under 30 seconds.</p>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 border-2 border-blue-700 text-black font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            Find a Shop
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-500 font-medium pb-2">
          Built to make time work better. &copy;{new Date().getFullYear()} Wavit
        </p>
      </div>
    </div>
  );
}
