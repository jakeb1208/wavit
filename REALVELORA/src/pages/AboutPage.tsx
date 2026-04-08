import { Link } from 'react-router-dom';

const features = [
  {
    emoji: '⏱',
    title: 'Real-Time Tracking',
    desc: 'See your live position in queue and accurate wait time, updated every few seconds.',
  },
  {
    emoji: '📲',
    title: 'SMS Notifications',
    desc: "Get a text when you're almost up. No app download, no account needed — ever.",
  },
  {
    emoji: '🔄',
    title: 'Live & Shared',
    desc: 'The queue is live for everyone. Real data, real time — powered by a real database.',
  },
  {
    emoji: '🤖',
    title: 'Smart Auto-Remove',
    desc: "If you don't respond after being called, we check in by text and auto-remove you to keep things moving.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a0845] via-[#2d0f6e] to-[#3b1fa3] text-white px-4 sm:px-6 pt-12 pb-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3L4 14h7v7l9-11h-7V3z" />
              </svg>
            </div>
            <span className="text-2xl font-black">wav<span className="text-violet-400">it</span></span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4">Waive the Wait</h1>
          <p className="text-violet-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            A smarter way to manage queues at local businesses — and get your time back as a customer.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8f7ff] to-transparent" />
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {/* Mission */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-2.5">Why We Built This</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Waiting rooms are outdated. Barbershops, salons, and local businesses lose customers
            to frustration every day. We built Wavit to give everyone their time back — customers
            can go grab coffee, run errands, or just relax while they wait. Businesses get a smoother
            flow with fewer no-shows and happier clients.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 transition-colors">
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="text-sm font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Mission quote */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white text-center">
          <p className="text-lg font-black mb-2">Our Mission</p>
          <p className="text-violet-200 text-sm leading-relaxed max-w-xs mx-auto">
            Eliminate unnecessary waiting — for customers who value their time
            and businesses who want happier clients.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-base font-bold text-gray-900 mb-1.5">Ready to skip the line?</p>
          <p className="text-sm text-gray-400 mb-5">Find a shop near you and join their queue in under 30 seconds.</p>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors shadow-sm shadow-violet-400/25"
          >
            Find a Shop
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">
          Built to make time work better. ©{new Date().getFullYear()} Wavit
        </p>
      </div>
    </div>
  );
}
