import { useState } from 'react';

export default function HowToUsePage() {
  const [tab, setTab] = useState<'customers' | 'businesses'>('customers');

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
          <h1 className="text-3xl sm:text-5xl font-black mb-4">How to Use Wavit</h1>
          <p className="text-blue-200 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            Everything you need to know — whether you're a customer or a business owner.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-300 to-transparent" />
      </section>

      {/* Sub-nav tabs */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-5 relative z-10 mb-6">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-1.5 flex gap-1.5">
          <button
            onClick={() => setTab('customers')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              tab === 'customers'
                ? 'bg-blue-600 text-black border-2 border-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            For Customers
          </button>
          <button
            onClick={() => setTab('businesses')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              tab === 'businesses'
                ? 'bg-blue-600 text-black border-2 border-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            For Businesses
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4 pb-10">

        {/* ── CUSTOMERS TAB ── */}
        {tab === 'customers' && (
          <>
            <div className="bg-white rounded-2xl border-2 border-blue-400 shadow-md p-6 text-center">
              <p className="text-base font-black text-blue-600 mb-1">No app download needed</p>
              <p className="text-sm text-gray-600 font-medium">
                Everything works right in your phone's browser. Just scan a QR code or visit the site.
              </p>
            </div>

            {[
              {
                step: '1',
                title: 'Find Your Shop',
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                  </svg>
                ),
                desc: 'Scan the QR code posted at the shop entrance, or go to the Wavit website and search for the business by name.',
              },
              {
                step: '2',
                title: 'Check In to the Queue',
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                desc: 'Enter your name and phone number to join the queue. You\'ll receive a link to your live queue status.',
              },
              {
                step: '3',
                title: 'See Your Wait Time From Your Phone',
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                desc: 'Your queue page shows your live position and exact estimated wait time — updated every few seconds, right on your phone screen.',
              },
              {
                step: '4',
                title: 'Get Texted When It\'s Your Turn',
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                ),
                desc: 'When your turn is approaching, Wavit sends you an SMS alert. Reply YES to confirm you\'re ready, or the system will check in with you automatically.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5 flex gap-4 items-start hover:border-blue-400 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-black text-blue-400">{item.step}</span>
                    </span>
                    <h3 className="text-sm font-black text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5">
              <h3 className="text-sm font-black text-gray-900 mb-3">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {[
                  {
                    q: 'Do I need to download an app?',
                    a: 'No. Everything works in your phone\'s web browser. Just scan the QR code or visit the site.',
                  },
                  {
                    q: 'How do I check my wait time?',
                    a: 'After checking in, you\'ll get a link to your personal queue page. Open it on your phone to see your live wait time updated in real time.',
                  },
                  {
                    q: 'What if I miss my turn?',
                    a: 'Wavit will text you when your turn is near. If you don\'t respond, the system will check in and may remove you from the queue to keep things moving for others.',
                  },
                  {
                    q: 'How do I stop receiving texts?',
                    a: 'Reply STOP to any text message from Wavit and you\'ll be opted out immediately.',
                  },
                ].map((faq, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <p className="text-xs font-black text-gray-900 mb-1">{faq.q}</p>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── BUSINESSES TAB ── */}
        {tab === 'businesses' && (
          <>
            <div className="bg-white rounded-2xl border-2 border-blue-400 shadow-md p-6 text-center">
              <p className="text-base font-black text-blue-600 mb-1">Manage your queue from anywhere</p>
              <p className="text-sm text-gray-600 font-medium">
                Your admin panel gives you full control — open/close the queue, serve customers, and update your settings.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5">
              <h3 className="text-sm font-black text-gray-900 mb-4">Getting Started</h3>
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Apply to Join Wavit',
                    desc: 'Go to the Register page and fill out your business details. Once approved, you\'ll receive your unique admin link.',
                  },
                  {
                    step: '2',
                    title: 'Log In With Your PIN',
                    desc: 'Use the Login page and enter your 6-digit business PIN to access your admin dashboard. Keep this PIN safe — it\'s how you manage your queue.',
                  },
                  {
                    step: '3',
                    title: 'Open Your Queue',
                    desc: 'In the admin panel, toggle your queue open. Customers can now check in via your QR code or by searching your business on the site.',
                  },
                  {
                    step: '4',
                    title: 'Serve Customers',
                    desc: 'When you\'re ready for the next person, tap "Serve Next" in your admin panel. Wavit automatically texts the next customer that their turn is coming up.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[11px] font-black text-blue-400">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 mb-0.5">{item.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5">
              <h3 className="text-sm font-black text-gray-900 mb-3">Admin Panel Features</h3>
              <div className="space-y-2">
                {[
                  { label: 'Open / Close Queue', desc: 'Toggle your queue on or off at any time.' },
                  { label: 'Live Queue View', desc: 'See everyone waiting in real time with their position and wait time.' },
                  { label: 'Serve Next', desc: 'Mark a customer as served and automatically notify the next person.' },
                  { label: 'Remove Customer', desc: 'Remove any customer from the queue if needed.' },
                  { label: 'Allow Remote Check-In', desc: 'Choose whether customers can check in from anywhere or only on-site.' },
                  { label: 'Analytics Reports', desc: 'Enable bi-weekly email summaries of your queue performance.' },
                  { label: 'Update Settings', desc: 'Change your business hours, staff count, average service time, and PIN.' },
                ].map((f, i) => (
                  <div key={i} className="flex gap-2 items-start py-2 border-b border-gray-100 last:border-0">
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-xs font-black text-gray-900">{f.label}</span>
                      <span className="text-xs text-gray-500 font-medium"> — {f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5">
              <h3 className="text-sm font-black text-gray-900 mb-3">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {[
                  {
                    q: 'How do I log in to my admin panel?',
                    a: 'Go to the Login page and enter your 6-digit business PIN. You\'ll be redirected straight to your dashboard.',
                  },
                  {
                    q: 'What if I forget my PIN?',
                    a: 'Contact us at wavitapp@gmail.com and we can reset it for you.',
                  },
                  {
                    q: 'Can I change my settings after setup?',
                    a: 'Yes. Inside the admin panel you can update your hours, staff count, service time, PIN, and more at any time.',
                  },
                  {
                    q: 'How do customers get notified?',
                    a: 'Wavit sends SMS texts automatically. When you tap "Serve Next," the customer receives a text that their turn is approaching.',
                  },
                ].map((faq, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <p className="text-xs font-black text-gray-900 mb-1">{faq.q}</p>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 text-center">
              <p className="text-sm font-black text-gray-900 mb-1">Need help?</p>
              <p className="text-xs text-gray-600 mb-4 font-medium">Reach out and we'll get you sorted.</p>
              <a
                href="mailto:wavitapp@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 border-2 border-blue-700 text-black font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm rounded-xl"
              >
                Email Us
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
