import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import PostJoinAd from '../components/PostJoinAd';
import { isNative } from '../lib/platform';

const GLASS = 'rgba(255,255,255,0.055)';
const BORDER = 'rgba(255,255,255,0.09)';

function isPastClosingTime(closingTime: string): boolean {
  const [h, m] = (closingTime || '17:00').split(':').map(Number);
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

export default function JoinPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWebSource = searchParams.get('source') === 'web';
  const native = isNative();
  const getShop = useQueueStore(s => s.getShop);
  const fetchShops = useQueueStore(s => s.fetchShops);
  const joinQueue = useQueueStore(s => s.joinQueue);
  const shops = useQueueStore(s => s.shops);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const partySize = 1;
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const shop = shopId ? getShop(shopId) : undefined;
  const isClinic = shop?.category === 'Clinic';
  const waitRange = shop?.waitRange || '';
  const activeQueue = shop?.queue.filter((t: any) => !t.exitedAt) || [];

  const handleAdDone = useCallback(() => {
    if (pendingRoute) navigate(pendingRoute);
  }, [pendingRoute, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || trimmedName.length < 2) { setError('Please enter a valid name'); return; }
    if (!/^[\p{L}\p{M}'\-\s.]{2,}$/u.test(trimmedName)) { setError('Name contains invalid characters'); return; }
    if (!isClinic && (!trimmedPhone || !/^\d{10}$/.test(trimmedPhone))) { setError('Please enter a 10-digit US phone number'); return; }
    setJoining(true);
    try {
      const ticket = await joinQueue(shopId!, trimmedName, isClinic ? '' : trimmedPhone, partySize, additionalInfo);
      setPendingRoute(`/queue/${shopId}/${ticket.id}`);
    } catch (err: any) {
      setError(err?.message || 'Could not join queue. Please try again.');
      setJoining(false);
    }
  };

  if (pendingRoute) return <PostJoinAd onDone={handleAdDone} />;

  if (!shopId) {
    return native ? (
      <div style={{ minHeight: '100vh', background: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '32px', maxWidth: '320px', width: '100%' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.12)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg style={{ width: '24px', height: '24px', color: '#f87171' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px' }}>QR Code Required</h2>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', marginBottom: '20px' }}>Scan the QR code at the business to join their queue.</p>
          <Link to="/" style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </div>
    ) : (
      <div style={{ minHeight: '100vh', background: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '32px', maxWidth: '320px', width: '100%', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg style={{ width: '24px', height: '24px', color: '#f87171' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px' }}>QR Code Required</h2>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', marginBottom: '20px' }}>Scan the QR code at the business to join their queue.</p>
          <Link to="/" style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  if (shops.length > 0 && !shop) {
    return native ? (
      <div style={{ minHeight: '100vh', background: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '32px', maxWidth: '320px', width: '100%' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px' }}>Shop Not Found</h2>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', marginBottom: '20px' }}>This QR code doesn't match any active shop.</p>
          <Link to="/search" style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', textDecoration: 'none' }}>Browse shops</Link>
        </div>
      </div>
    ) : (
      <div style={{ minHeight: '100vh', background: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '32px', maxWidth: '320px', width: '100%', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px' }}>Shop Not Found</h2>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', marginBottom: '20px' }}>This QR code doesn't match any active shop.</p>
          <Link to="/search" style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', textDecoration: 'none' }}>Browse shops</Link>
        </div>
      </div>
    );
  }

  if (!shop) {
    const spinnerBg = native ? '#070b14' : '#070b14';
    const spinnerColor = native ? '#60a5fa' : '#7c3aed';
    return (
      <div style={{ minHeight: '100vh', background: spinnerBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg className="animate-spin" style={{ width: '32px', height: '32px', color: spinnerColor, margin: '0 auto 12px' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ fontSize: '13px', color: native ? 'rgba(148,163,184,0.6)' : '#9ca3af', fontWeight: 500 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (shop.queueOpen === false) {
    return native ? (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', color: '#f0f4ff', padding: '24px 20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px', color: '#93c5fd', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '40px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(107,114,128,0.12)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg style={{ width: '32px', height: '32px', color: 'rgba(148,163,184,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Queue is Closed</h2>
          <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.65)', marginBottom: '6px' }}><strong style={{ color: '#f0f4ff' }}>{shop.name}</strong> is not accepting new customers right now.</p>
          {shop.openingTime && <p style={{ fontSize: '14px', color: '#60a5fa', fontWeight: 700, marginBottom: '24px' }}>Opens at {shop.openingTime}</p>}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
            Find Another Shop
          </Link>
        </div>
      </div>
    ) : (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', color: '#f0f4ff', padding: '24px 20px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#93c5fd', textDecoration: 'none', marginBottom: '40px', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(107,114,128,0.12)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg style={{ width: '32px', height: '32px', color: 'rgba(148,163,184,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Queue is Closed</h2>
          <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.65)', marginBottom: '6px' }}><strong style={{ color: '#f0f4ff' }}>{shop.name}</strong> is not accepting new customers right now.</p>
          {shop.openingTime && <p style={{ fontSize: '14px', color: '#60a5fa', fontWeight: 700, marginBottom: '24px' }}>Opens at {shop.openingTime}</p>}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
            Find Another Shop
          </Link>
        </div>
      </div>
    );
  }

  if (shop.allowRemoteJoin === false && isWebSource) {
    return native ? (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', color: '#f0f4ff', padding: '24px 20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px', color: '#93c5fd', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '40px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(245,158,11,0.12)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg style={{ width: '32px', height: '32px', color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Visit the Shop to Join</h2>
          <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.65)', marginBottom: '24px' }}><strong style={{ color: '#f0f4ff' }}>{shop.name}</strong> requires you to be physically present to join their queue.</p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
            Find Another Shop
          </Link>
        </div>
      </div>
    ) : (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', color: '#f0f4ff', padding: '24px 20px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#93c5fd', textDecoration: 'none', marginBottom: '40px', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(245,158,11,0.12)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg style={{ width: '32px', height: '32px', color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Visit the Shop to Join</h2>
          <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.65)', marginBottom: '24px' }}><strong style={{ color: '#f0f4ff' }}>{shop.name}</strong> requires you to be physically present at the shop to join their queue.</p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
            Find Another Shop
          </Link>
        </div>
      </div>
    );
  }

  if (native) {
    const initials = shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase();
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', color: '#f0f4ff', padding: '20px 16px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px', color: '#93c5fd', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        {/* Shop card */}
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #1d4ed8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#f0f4ff', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.name}</h1>
            <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)' }}>{shop.category}{shop.zipCode && ` · ZIP ${shop.zipCode}`}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {waitRange && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '2px 8px' }}>{waitRange} wait</span>
              )}
              {activeQueue.length > 0 && (
                <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>{activeQueue.length} in line</span>
              )}
            </div>
          </div>
        </div>

        {/* After-hours warning */}
        {isPastClosingTime(shop.closingTime || '17:00') && (
          <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)', borderRadius: '14px', padding: '12px 14px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <svg style={{ width: '16px', height: '16px', color: '#fb923c', flexShrink: 0, marginTop: '1px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p style={{ fontSize: '12px', color: 'rgba(251,146,60,0.85)', fontWeight: 500, lineHeight: 1.5 }}>
              This business may not be open right now — normal hours end at {shop.closingTime}.
            </p>
          </div>
        )}

        {/* Form card */}
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', overflow: 'hidden', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px', letterSpacing: '-0.3px' }}>Check In</h2>
            <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)', marginBottom: '20px' }}>{isClinic ? 'Enter your first name to join the line.' : 'We\'ll text you when your turn is approaching.'}</p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>First Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your first name"
                  autoComplete="given-name" autoFocus
                  style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff', fontSize: '15px', fontWeight: 500, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {!isClinic && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Phone Number</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', overflow: 'hidden' }}>
                  <span style={{ padding: '13px 4px 13px 14px', fontSize: '15px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', flexShrink: 0 }}>+1</span>
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="2025551234" autoComplete="tel-national" maxLength={10}
                    style={{ flex: 1, padding: '13px 14px', background: 'transparent', border: 'none', color: '#f0f4ff', fontSize: '15px', fontWeight: 500, outline: 'none' }}
                  />
                </div>
              </div>
              )}
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '11px 14px', fontSize: '13px', color: 'rgba(248,113,113,0.9)', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}
              <button
                type="submit" disabled={joining}
                style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', cursor: joining ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', boxShadow: '0 4px 20px rgba(59,130,246,0.4)', opacity: joining ? 0.6 : 1, boxSizing: 'border-box' }}
              >
                {joining ? 'Joining…' : 'Join Queue'}
              </button>
            </form>
          </div>
          <div style={{ padding: '14px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <svg style={{ width: '13px', height: '13px', color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', lineHeight: 1.5 }}>Your number is only used for queue notifications. We never share it.</p>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.4)', lineHeight: 1.5 }}>
              By joining you agree to our{' '}
              <Link to="/terms" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
              {' '}Reply <strong style={{ color: 'rgba(148,163,184,0.6)' }}>STOP</strong> to any SMS to unsubscribe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const initials = shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', color: '#f0f4ff', paddingBottom: '40px' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link to="/" className="font-pacifico" style={{ fontSize: '18px', background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textDecoration: 'none' }}>wavit</Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.name}</span>
      </div>
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-10" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #1d4ed8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#f0f4ff', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.name}</h1>
            <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)' }}>{shop.category}{shop.zipCode && ` · ZIP ${shop.zipCode}`}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              {waitRange && <span style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '2px 8px' }}>{waitRange} wait</span>}
              {activeQueue.length > 0 && <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>{activeQueue.length} in line</span>}
            </div>
          </div>
        </div>
        {isPastClosingTime(shop.closingTime || '17:00') && (
          <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <svg style={{ width: '16px', height: '16px', color: '#fb923c', flexShrink: 0, marginTop: '1px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            <p style={{ fontSize: '12px', color: 'rgba(251,146,60,0.85)', fontWeight: 500, lineHeight: 1.5 }}>This business may not be open right now — normal hours end at {shop.closingTime}. You can still join if the queue is active.</p>
          </div>
        )}
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', overflow: 'hidden', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px', letterSpacing: '-0.3px' }}>Check In</h2>
            <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)', marginBottom: '20px' }}>{isClinic ? 'Enter your first name to join the line.' : 'We\'ll text you when your turn is approaching.'}</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>First Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your first name" autoFocus autoComplete="given-name"
                  style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff', fontSize: '15px', fontWeight: 500, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              {!isClinic && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Phone Number</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', overflow: 'hidden' }}>
                  <span style={{ padding: '13px 4px 13px 14px', fontSize: '15px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', flexShrink: 0 }}>+1</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="2025551234" autoComplete="tel-national" maxLength={10}
                    style={{ flex: 1, padding: '13px 14px', background: 'transparent', border: 'none', color: '#f0f4ff', fontSize: '15px', fontWeight: 500, outline: 'none' }} />
                </div>
              </div>
              )}
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '11px 14px', fontSize: '13px', color: 'rgba(248,113,113,0.9)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}
              <button type="submit" disabled={joining}
                style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', cursor: joining ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', boxShadow: '0 4px 20px rgba(59,130,246,0.4)', opacity: joining ? 0.6 : 1, boxSizing: 'border-box' as const }}>
                {joining ? 'Joining…' : 'Join Queue'}
              </button>
            </form>
          </div>
          <div style={{ padding: '14px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <svg style={{ width: '13px', height: '13px', color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', lineHeight: 1.5 }}>Your number is only used for queue notifications. We never share it.</p>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.4)', lineHeight: 1.5 }}>
              By joining you agree to our{' '}
              <Link to="/terms" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Terms</Link>{' '}and{' '}
              <Link to="/privacy" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.{' '}
              Reply <strong style={{ color: 'rgba(148,163,184,0.6)' }}>STOP</strong> to any SMS to unsubscribe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
