import { Link } from 'react-router-dom';

const MEMBERS = [
  {
    name: 'Wavit',
    url: 'https://www.wavit.cc',
    desc: 'Live wait time widgets for walk-in businesses. Barbershops, salons, clinics, and any walk-in business can display a real-time queue widget on their website — no app needed for customers.',
  },
  {
    name: 'DayOneLead',
    url: 'https://dayonelead.com',
    desc: 'A corpus of over 1M new business leads and counting. Built for founders who want cheap, unlimited access to fresh prospects. Updated daily with verified contact information pulled from new business filings across the U.S.',
  },
  {
    name: 'JustGoBloom',
    url: 'https://www.justgobloom.com',
    desc: 'A habit tracker where your goals become living trees. Plant a goal, show up daily, and watch it grow through 9 stages. Miss a day and it wilts.',
  },
  {
    name: 'LinkVault',
    url: 'https://linkvault.biz',
    desc: 'LinkVault helps freelancers and agencies get paid before clients access final files. Upload your deliverable, share a secure preview link, and full file access unlocks only after payment.',
  },
  {
    name: 'Jade Web Studio',
    url: 'https://jadewebstudio.com',
    desc: 'Jade Web Studio builds modern websites, AI integrations, and smarter systems for businesses that want a stronger online presence and better lead flow.',
  },
  {
    name: 'BiteSpend',
    url: 'https://bitespend.com',
    desc: 'Snap any grocery or restaurant receipt and AI extracts every item and price, tracks your food budget, and shows where the same items cost less across stores.',
  },
  {
    name: 'Conduit Systems',
    url: 'https://conduitsystems.org',
    desc: 'Custom software for owner-operated businesses across Dallas-Fort Worth. CRMs, internal apps, and websites that you can actually run a business on.',
  },
  {
    name: 'PitchHired',
    url: 'https://pitchhired.com',
    desc: 'AI-powered job outreach for job seekers: find hiring contacts, generate personalized emails, and send from your own Gmail.',
  },
  {
    name: 'PlumberTriage',
    url: 'https://plumbertriage.gentlemansolutions.com',
    desc: 'AI-powered emergency triage tool for plumbers. Get instant, accurate assessments of plumbing issues, helping plumbers prioritize and address emergencies efficiently.',
  },
];

export default function FounderNetworkPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.7)' }}>Community</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.5px', marginBottom: '12px', lineHeight: 1.2 }}>
            Founder Network
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(148,163,184,0.75)', lineHeight: 1.7, maxWidth: '540px' }}>
            Independent products built by founders. Real people, real products, real traction.
          </p>
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.35)' }}>Product</span>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.35)' }}>What it is</span>
          </div>

          {/* Rows */}
          {MEMBERS.map((m, i) => (
            <div
              key={m.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                padding: '18px 24px',
                borderBottom: i < MEMBERS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                gap: '16px',
                alignItems: 'start',
              }}
            >
              <a
                href={m.url}
                style={{ fontSize: '14px', fontWeight: 700, color: '#60a5fa', textDecoration: 'none', lineHeight: 1.5, wordBreak: 'break-word' }}
              >
                {m.name}
              </a>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)', lineHeight: 1.65, margin: 0 }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p style={{ fontSize: '12px', color: 'rgba(100,116,139,0.45)', marginTop: '24px', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'rgba(96,165,250,0.5)', textDecoration: 'none' }}>wavit.cc</Link>
        </p>

      </div>
    </div>
  );
}
