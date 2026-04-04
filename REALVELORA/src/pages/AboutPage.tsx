import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Real-Time Tracking',
    desc: 'See your live position in queue and get an accurate estimated wait time, updated every few seconds.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'SMS Notifications',
    desc: "Get a text when you're almost up so you can return on time. No app download, no account needed.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
      </svg>
    ),
    title: 'Shared Across Everyone',
    desc: 'The queue is live and shared — everyone sees the same real-time data, powered by a real database.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Smart Auto-Remove',
    desc: "If you don't respond after being served, we check in by text and auto-remove you to keep the queue moving.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-violet-50/50 pb-24 sm:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 text-white px-4 sm:px-6 pt-10 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-black">wavit</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Waive the Wait</h1>
          <p className="text-violet-200 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            A smarter way to manage queues for local businesses and their customers.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L60 35C120 30 240 20 360 16C480 12 600 16 720 22C840 28 960 36 1080 36C1200 36 1320 28 1380 24L1440 20V40H0Z" fill="rgb(245 243 255 / 0.5)"/>
          </svg>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Mission */}
        <div className="bg-white rounded-2xl border border-violet-100/60 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">Why We Built This</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Waiting rooms are outdated. Barbershops, salons, and local businesses lose customers
            to frustration every day. We built Wavit to give everyone their time back — customers
            can go do something productive while they wait, and businesses get a smoother flow
            with fewer no-shows.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-violet-100/60 p-5">
              <div className="w-9 h-9 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Mission statement */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white text-center">
          <p className="font-bold text-lg mb-1">Our Mission</p>
          <p className="text-violet-200 text-sm leading-relaxed">
            Eliminate unnecessary waiting — for customers who value their time
            and businesses who want happier clients.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-violet-100/60 p-6 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-4">Ready to skip the line?</p>
          <Link
            to="/search"
            className="inline-flex items-center justify-center px-6 py-3 bg-violet-600 text-white rounded-2xl font-bold text-sm hover:bg-violet-700 transition-colors shadow-sm shadow-violet-400/20"
          >
            Find a Shop Near You →
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Built to make time work better.
        </p>
      </div>
    </div>
  );
}
