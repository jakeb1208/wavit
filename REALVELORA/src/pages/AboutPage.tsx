import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { isNative } from '../lib/platform';

const ICONS = [
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h5v5H4V4zM5 5h3v3H5V5zM15 4h5v5h-5V4zM16 5h3v3h-3V5zM4 15h5v5H4v-5zM5 16h3v3H5v-3zM11 11h2v2h-2zM15 11h2v2h-2zM19 11h2v2h-2zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z" /></svg>,
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
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
                  {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />}
                  {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h5v5H4V4zM5 5h3v3H5V5zM15 4h5v5h-5V4zM16 5h3v3h-3V5zM4 15h5v5H4v-5zM5 16h3v3H5v-3zM11 11h2v2h-2zM15 11h2v2h-2zM19 11h2v2h-2zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z" />}
                  {i >= 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />}
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
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '96px 24px 32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '14px', background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.55) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Waive the Wait</h1>
        <p style={{ fontSize: '15px', color: 'rgba(148,163,184,0.75)', lineHeight: 1.65, maxWidth: '420px', margin: '0 auto' }}>A smarter way to manage queues at local businesses — and get your time back as a customer.</p>
      </div>
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
                  {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />}
                  {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h5v5H4V4zM5 5h3v3H5V5zM15 4h5v5h-5V4zM16 5h3v3h-3V5zM4 15h5v5H4v-5zM5 16h3v3H5v-3zM11 11h2v2h-2zM15 11h2v2h-2zM19 11h2v2h-2zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z" />}
                  {i >= 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />}
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
