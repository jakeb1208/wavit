import { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';
import { isNative } from '../lib/platform';
import { useNavigate } from 'react-router-dom';

const CUSTOMER_ICONS = [
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" /></svg>,
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3M18 21h3M14 21h2" /></svg>,
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 11h.01M9 11h.01M12 11h.01M15 11h.01M18 11h.01M6 15h2M10 15h.01M13 15h.01M16 15h2" /></svg>,
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01" /></svg>,
];

interface Step { title: string; desc: string; }
interface Faq { q: string; a: string; }
interface HowToUseContent {
  customer_steps: Step[];
  customer_faqs: Faq[];
  business_steps: Step[];
  business_faqs: Faq[];
  clinic_steps: Step[];
  clinic_faqs: Faq[];
}

const DEFAULT: HowToUseContent = {
  customer_steps: [
    { title: "Find Your Shop", desc: "Scan the QR code posted at the shop entrance, or go to the Wavit website and search for the business by name." },
    { title: "Check In to the Queue", desc: "Enter your name and phone number to join the queue. You'll receive a link to your live queue status." },
    { title: "See Your Wait Time From Your Phone", desc: "Your queue page shows your live position and exact estimated wait time — updated every few seconds, right on your phone screen." },
  ],
  customer_faqs: [
    { q: "Do I need to download an app?", a: "No. Everything works in your phone's web browser. Just scan the QR code or visit the site." },
    { q: "How do I check my wait time?", a: "After checking in, you'll get a link to your personal queue page. Open it on your phone to see your live wait time updated in real time." },
    { q: "What if I miss my turn?", a: "If you're removed from the queue, simply scan the QR code or search for the shop again to re-join." },
  ],
  business_steps: [
    { title: "Apply to Join Wavit", desc: "Go to the Register page and fill out your business details. Once approved, you'll receive your unique admin link." },
    { title: "Log In With Your PIN", desc: "Use the Login page and enter your 6-digit business PIN to access your admin dashboard. Keep this PIN safe — it's how you manage your queue." },
    { title: "Open Your Queue", desc: "In the admin panel, toggle your queue open. Customers can now check in via your QR code or by searching your business on the site." },
    { title: "Serve Customers", desc: "When you're ready for the next person, tap \"Serve Next\" in your admin panel. Wavit automatically texts the next customer that their turn is coming up." },
  ],
  business_faqs: [
    { q: "How do I log in to my admin panel?", a: "Go to the Login page and enter your 6-digit business PIN. You'll be redirected straight to your dashboard." },
    { q: "What if I forget my PIN?", a: "Contact us at wavitapp@gmail.com and we can reset it for you." },
    { q: "Can I change my settings after setup?", a: "Yes. Inside the admin panel you can update your hours, staff count, service time, PIN, and more at any time." },
    { q: "How do customers get notified?", a: "Wavit sends SMS texts automatically. When you tap \"Serve Next,\" the customer receives a text that their turn is approaching." },
  ],
  clinic_steps: [
    { title: "Scan the QR Code", desc: "Each clinic has a unique QR code at the front desk. Scan it with your phone to instantly join the queue — no app download needed." },
    { title: "Enter Your First Name", desc: "We only need your first name. No phone number, no personal details — just your name to hold your spot in line." },
    { title: "Check Live Queue Lengths", desc: "Visit www.wavit.cc or open the Wavit app to see how many people are ahead of you in real time." },
    { title: "Wait Comfortably", desc: "Wait wherever you like. The queue updates live so you always know your place. There's no need to sit in the waiting room." },
  ],
  clinic_faqs: [
    { q: "Do I need to download an app?", a: "No. Everything works in your phone's web browser. The QR code takes you directly to the clinic's queue." },
    { q: "Do I need to give my phone number?", a: "No. Clinics on Wavit only collect your first name to hold your spot in line. No phone number required." },
    { q: "How do I know my place in line?", a: "After joining, check www.wavit.cc or the Wavit app to see live queue lengths for the clinic." },
    { q: "What happens when it's my turn?", a: "The clinic will call your name. Your spot is automatically removed from the queue when you go in." },
    { q: "Can I leave and come back?", a: "Yes. The queue is live online so you can check your place anytime. Just make sure to be back before your name is called." },
  ],
};

const ADMIN_FEATURES = [
  { label: 'Open / Close Queue', desc: 'Toggle your queue on or off at any time.' },
  { label: 'Live Queue View', desc: 'See everyone waiting in real time with their position and wait time.' },
  { label: 'Serve Next', desc: 'Mark a customer as served and automatically notify the next person.' },
  { label: 'Remove Customer', desc: 'Remove any customer from the queue if needed.' },
  { label: 'Allow Remote Check-In', desc: 'Choose whether customers can check in from anywhere or only on-site.' },
  { label: 'Analytics Reports', desc: 'Enable bi-weekly email summaries of your queue performance.' },
  { label: 'Update Settings', desc: 'Change your business hours, staff count, average service time, and PIN.' },
];

export default function HowToUsePage() {
  const [tab, setTab] = useState<'customers' | 'businesses' | 'clinics'>('customers');
  const [content, setContent] = useState<HowToUseContent>(DEFAULT);
  const native = isNative();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/content/how_to_use`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setContent({ ...DEFAULT, ...data }); })
      .catch(() => {});
  }, []);

  const GLASS = 'rgba(255,255,255,0.055)';
  const BORDER = 'rgba(255,255,255,0.09)';
  const ICON_COLORS = ['#3b82f6', '#10b981', '#a78bfa', '#f59e0b'];

  if (native) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 50%)', color: '#f0f4ff', padding: '20px 16px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px', color: '#93c5fd', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '6px' }}>How to Use Wavit</h1>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)' }}>For customers and business owners.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '5px', marginBottom: '16px' }}>
          {(['customers', 'businesses', 'clinics'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                background: tab === t ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.25))' : 'transparent',
                color: tab === t ? '#93c5fd' : 'rgba(148,163,184,0.55)',
                border: tab === t ? '1px solid rgba(99,140,255,0.28)' : '1px solid transparent',
                boxShadow: tab === t ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t === 'customers' ? 'For Customers' : t === 'businesses' ? 'For Businesses' : 'For Clinics'}
            </button>
          ))}
        </div>

        {tab === 'customers' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(99,102,241,0.18))', border: '1px solid rgba(99,140,255,0.22)', borderRadius: '18px', padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#93c5fd', marginBottom: '4px' }}>No app download needed</p>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.5 }}>Everything works right in your phone's browser. Just scan a QR code or visit the site.</p>
            </div>

            {content.customer_steps.map((item, i) => (
              <div key={i} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '16px', marginBottom: '10px', display: 'flex', gap: '14px', alignItems: 'flex-start', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `rgba(${i === 0 ? '59,130,246' : i === 1 ? '16,185,129' : i === 2 ? '167,139,250' : '245,158,11'},0.15)`, border: `1px solid rgba(${i === 0 ? '59,130,246' : i === 1 ? '16,185,129' : i === 2 ? '167,139,250' : '245,158,11'},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '18px', height: '18px', color: ICON_COLORS[i] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {CUSTOMER_ICONS[i].props.children}
                    </svg>
                  </div>
                  <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: ICON_COLORS[i] }}>{i + 1}</span>
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px' }}>{item.title}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}

            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '18px', marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Frequently Asked Questions</p>
              {content.customer_faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < content.customer_faqs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>{faq.q}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'businesses' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(99,102,241,0.18))', border: '1px solid rgba(99,140,255,0.22)', borderRadius: '18px', padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#93c5fd', marginBottom: '4px' }}>Manage your queue from anywhere</p>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.5 }}>Your admin panel gives you full control — open/close the queue, serve customers, and update your settings.</p>
            </div>

            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '18px', marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Getting Started</p>
              {content.business_steps.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: i < content.business_steps.length - 1 ? '14px' : 0 }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#60a5fa' }}>{i + 1}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff', marginBottom: '3px' }}>{item.title}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '18px', marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Admin Panel Features</p>
              {ADMIN_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '10px', marginBottom: '10px', borderBottom: i < ADMIN_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <svg style={{ width: '14px', height: '14px', color: '#34d399', flexShrink: 0, marginTop: '1px' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <div><span style={{ fontSize: '12px', fontWeight: 800, color: '#f0f4ff' }}>{f.label}</span><span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.55)' }}> — {f.desc}</span></div>
                </div>
              ))}
            </div>

            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '18px', marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Frequently Asked Questions</p>
              {content.business_faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < content.business_faqs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>{faq.q}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              ))}
            </div>

            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '18px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '6px' }}>Need help?</p>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.55)', marginBottom: '16px' }}>Reach out and we'll get you sorted.</p>
              <a href="mailto:wavitapp@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
                Email Us
              </a>
            </div>
          </>
        )}

        {tab === 'clinics' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(99,102,241,0.18))', border: '1px solid rgba(99,140,255,0.22)', borderRadius: '18px', padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#93c5fd', marginBottom: '4px' }}>No phone number required</p>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.5 }}>Clinics on Wavit only need your first name. Check live queue lengths anytime at www.wavit.cc.</p>
            </div>

            {content.clinic_steps.map((item, i) => (
              <div key={i} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '16px', marginBottom: '10px', display: 'flex', gap: '14px', alignItems: 'flex-start', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `rgba(${i === 0 ? '59,130,246' : i === 1 ? '16,185,129' : i === 2 ? '167,139,250' : '245,158,11'},0.15)`, border: `1px solid rgba(${i === 0 ? '59,130,246' : i === 1 ? '16,185,129' : i === 2 ? '167,139,250' : '245,158,11'},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '18px', height: '18px', color: ICON_COLORS[i] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {CUSTOMER_ICONS[i].props.children}
                    </svg>
                  </div>
                  <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: ICON_COLORS[i] }}>{i + 1}</span>
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px' }}>{item.title}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}

            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '18px', padding: '18px', marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Frequently Asked Questions</p>
              {content.clinic_faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < content.clinic_faqs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>{faq.q}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const cardStyle = { background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' };

  return (
    <div style={{ minHeight: '100vh', background: '#070b14', color: '#f0f4ff', paddingBottom: '48px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '96px 24px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '14px', background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.55) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>How to Use Wavit</h1>
        <p style={{ fontSize: '15px', color: 'rgba(148,163,184,0.75)', lineHeight: 1.65, maxWidth: '420px', margin: '0 auto' }}>Everything you need to know — whether you're a customer or a business owner.</p>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-6">
        <div style={{ ...cardStyle, padding: '6px', display: 'flex', gap: '6px' }}>
          <button onClick={() => setTab('customers')} style={{ flex: 1, padding: '10px 16px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', border: tab === 'customers' ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent', background: tab === 'customers' ? 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.25))' : 'transparent', color: tab === 'customers' ? '#93c5fd' : 'rgba(148,163,184,0.55)' }}>For Customers</button>
          <button onClick={() => setTab('businesses')} style={{ flex: 1, padding: '10px 16px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', border: tab === 'businesses' ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent', background: tab === 'businesses' ? 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.25))' : 'transparent', color: tab === 'businesses' ? '#93c5fd' : 'rgba(148,163,184,0.55)' }}>For Businesses</button>
          <button onClick={() => setTab('clinics')} style={{ flex: 1, padding: '10px 16px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', border: tab === 'clinics' ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent', background: tab === 'clinics' ? 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.25))' : 'transparent', color: tab === 'clinics' ? '#93c5fd' : 'rgba(148,163,184,0.55)' }}>For Clinics</button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-10" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tab === 'customers' && (
          <>
            <div style={{ ...cardStyle, padding: '20px', textAlign: 'center', border: '1px solid rgba(59,130,246,0.3)' }}>
              <p style={{ fontSize: '15px', fontWeight: 900, color: '#93c5fd', marginBottom: '6px' }}>No app download needed</p>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)' }}>Everything works right in your phone's browser. Just scan a QR code or visit the site.</p>
            </div>
            {content.customer_steps.map((item, i) => (
              <div key={i} style={{ ...cardStyle, padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{CUSTOMER_ICONS[i % CUSTOMER_ICONS.length]}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ width: '20px', height: '20px', background: '#1e3a8a', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '10px', fontWeight: 900, color: '#60a5fa' }}>{i + 1}</span></span>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff' }}>{item.title}</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </div>
            ))}
            <div style={{ ...cardStyle, padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Frequently Asked Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {content.customer_faqs.map((faq, i) => (
                  <div key={i} style={{ borderBottom: i < content.customer_faqs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px' }}>{faq.q}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {tab === 'businesses' && (
          <>
            <div style={{ ...cardStyle, padding: '20px', textAlign: 'center', border: '1px solid rgba(59,130,246,0.3)' }}>
              <p style={{ fontSize: '15px', fontWeight: 900, color: '#93c5fd', marginBottom: '6px' }}>Manage your queue from anywhere</p>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)' }}>Your admin panel gives you full control — open/close the queue, serve customers, and update your settings.</p>
            </div>
            <div style={{ ...cardStyle, padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '16px' }}>Getting Started</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {content.business_steps.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', background: '#1e3a8a', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}><span style={{ fontSize: '11px', fontWeight: 900, color: '#60a5fa' }}>{i + 1}</span></div>
                    <div><p style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '3px' }}>{item.title}</p><p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{item.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...cardStyle, padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Admin Panel Features</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ADMIN_FEATURES.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: i < ADMIN_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <svg style={{ width: '14px', height: '14px', color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <div><span style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff' }}>{f.label}</span><span style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)' }}> — {f.desc}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...cardStyle, padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Frequently Asked Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {content.business_faqs.map((faq, i) => (
                  <div key={i} style={{ borderBottom: i < content.business_faqs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px' }}>{faq.q}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...cardStyle, padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 900, color: '#f0f4ff', marginBottom: '6px' }}>Need help?</p>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', marginBottom: '16px' }}>Reach out and we'll get you sorted.</p>
              <a href="mailto:wavitapp@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>Email Us</a>
            </div>
          </>
        )}

        {tab === 'clinics' && (
          <>
            <div style={{ ...cardStyle, padding: '20px', textAlign: 'center', border: '1px solid rgba(59,130,246,0.3)' }}>
              <p style={{ fontSize: '15px', fontWeight: 900, color: '#93c5fd', marginBottom: '6px' }}>No phone number required</p>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)' }}>Clinics on Wavit only need your first name. Check live queue lengths anytime at www.wavit.cc.</p>
            </div>
            {content.clinic_steps.map((item, i) => (
              <div key={i} style={{ ...cardStyle, padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ width: '18px', height: '18px', color: '#60a5fa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ width: '20px', height: '20px', background: '#1e3a8a', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '10px', fontWeight: 900, color: '#60a5fa' }}>{i + 1}</span></span>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff' }}>{item.title}</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </div>
            ))}
            <div style={{ ...cardStyle, padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '14px' }}>Frequently Asked Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {content.clinic_faqs.map((faq, i) => (
                  <div key={i} style={{ borderBottom: i < content.clinic_faqs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px' }}>{faq.q}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6 }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
