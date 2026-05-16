import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { isNative } from '../lib/platform';

const ICONS = [
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
];

const NATIVE_ICON_COLORS = ['#3b82f6', '#10b981', '#a78bfa', '#f59e0b'];

interface AboutContent {
  mission_body: string;
  mission_quote: string;
  cta_tagline: string;
  features: { title: string; desc: string }[];
}

const DEFAULT: AboutContent = {
  mission_body: "Waiting rooms are outdated. Barbershops, salons, and local businesses lose customers to frustration every day. We built Wavit so you can see your exact wait time right from your phone — no guessing, no crowding the waiting area. Businesses get a smoother flow with fewer no-shows and happier clients.",
  mission_quote: "Eliminate unnecessary waiting — for customers who value their time and businesses who want happier clients.",
  cta_tagline: "Find a shop near you and join their queue in under 30 seconds.",
  features: [
    { title: "See Your Wait Time From Your Phone", desc: "Check your live position and exact wait time right on your phone — updated every few seconds, no app needed." },
    { title: "SMS Notifications", desc: "Get a text when you're almost up. No app download, no account needed — ever." },
    { title: "Live & Shared", desc: "The queue is live for everyone. Real data, real time — powered by a real database." },
    { title: "Smart Auto-Remove", desc: "If you don't respond after being called, we check in by text and auto-remove you to keep things moving." },
  ],
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT);
  const native = isNative();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/content/about`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setContent(data); })
      .catch(() => {});
  }, []);

  const GLASS = 'rgba(255,255,255,0.055)';
  const BORDER = 'rgba(255,255,255,0.09)';

  if (native) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', color: '#f0f4ff', padding: '20px 16px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px', color: '#93c5fd', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 className="font-pacifico" style={{ fontSize: '36px', color: '#60a5fa', marginBottom: '8px' }}>wavit</h1>
          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '8px' }}>Waive the Wait</h2>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
            A smarter way to manage queues at local businesses — and get your time back.
          </p>
        </div>

        {/* Mission */}
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '20px', marginBottom: '12px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Why We Built This</h3>
          <p style={{ fontSize: '13px', color: 'rgba(203,213,225,0.8)', lineHeight: 1.7 }}>{content.mission_body}</p>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          {content.features.map((f, i) => (
            <div key={i} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `rgba(${i === 0 ? '59,130,246' : i === 1 ? '16,185,129' : i === 2 ? '167,139,250' : '245,158,11'},0.15)`, border: `1px solid rgba(${i === 0 ? '59,130,246' : i === 1 ? '16,185,129' : i === 2 ? '167,139,250' : '245,158,11'},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: '20px', height: '20px', color: NATIVE_ICON_COLORS[i] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />}
                  {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />}
                  {i >= 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px' }}>{f.title}</p>
                <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mission quote */}
        <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(99,102,241,0.18))', border: '1px solid rgba(99,140,255,0.22)', borderRadius: '20px', padding: '20px', textAlign: 'center', marginBottom: '12px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#93c5fd', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Our Mission</p>
          <p style={{ fontSize: '14px', color: 'rgba(203,213,225,0.85)', lineHeight: 1.7 }}>{content.mission_quote}</p>
        </div>

        {/* CTA */}
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 800, color: '#f0f4ff', marginBottom: '6px' }}>Ready to skip the line?</p>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', marginBottom: '18px' }}>{content.cta_tagline}</p>
          <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
            Find a Shop →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b14', color: '#f0f4ff', paddingBottom: '48px' }}>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a0845] via-[#1d3a8a] to-[#1e40af] text-white px-4 sm:px-6 pt-12 pb-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6"><span className="font-pacifico text-3xl text-blue-400">wavit</span></div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4">Waive the Wait</h1>
          <p className="text-blue-200 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">A smarter way to manage queues at local businesses — and get your time back as a customer.</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: 'linear-gradient(to top, #070b14, transparent)' }} />
      </section>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '24px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px', fontSize: '13px' }}>Why We Built This</h2>
          <p style={{ fontSize: '14px', color: 'rgba(203,213,225,0.85)', lineHeight: 1.75, fontWeight: 400 }}>{content.mission_body}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {content.features.map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '20px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96,165,250,0.4)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `rgba(${i === 0 ? '59,130,246' : i === 1 ? '16,185,129' : i === 2 ? '167,139,250' : '245,158,11'},0.15)`, border: `1px solid rgba(${i === 0 ? '59,130,246' : i === 1 ? '16,185,129' : i === 2 ? '167,139,250' : '245,158,11'},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <svg style={{ width: '22px', height: '22px', color: ['#60a5fa','#34d399','#a78bfa','#fbbf24'][i] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />}
                  {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />}
                  {i >= 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '6px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.22), rgba(99,102,241,0.18))', border: '1px solid rgba(99,140,255,0.25)', borderRadius: '20px', padding: '24px', textAlign: 'center', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <p style={{ fontSize: '14px', fontWeight: 900, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Our Mission</p>
          <p style={{ fontSize: '15px', color: 'rgba(203,213,225,0.85)', lineHeight: 1.7, maxWidth: '340px', margin: '0 auto' }}>{content.mission_quote}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '28px', textAlign: 'center', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <p style={{ fontSize: '20px', fontWeight: 900, color: '#f0f4ff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Ready to skip the line?</p>
          <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.65)', marginBottom: '20px' }}>{content.cta_tagline}</p>
          <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(59,130,246,0.4)' }}>
            Find a Shop →
          </Link>
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(148,163,184,0.35)', paddingBottom: '8px' }}>Built to make time work better. &copy;{new Date().getFullYear()} Wavit</p>
      </div>
    </div>
  );
}
