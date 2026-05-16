import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const native = isNative();
  const getShop = useQueueStore(s => s.getShop);
  const fetchShops = useQueueStore(s => s.fetchShops);
  const joinQueue = useQueueStore(s => s.joinQueue);
  const shops = useQueueStore(s => s.shops);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const partySize = 1;
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const shop = shopId ? getShop(shopId) : undefined;
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
    if (!trimmedPhone || !/^\d{10}$/.test(trimmedPhone)) { setError('Please enter a 10-digit US phone number'); return; }
    setJoining(true);
    const ticket = await joinQueue(shopId!, trimmedName, trimmedPhone, partySize);
    if (ticket) {
      setPendingRoute(`/queue/${shopId}/${ticket.id}`);
    } else {
      setError('Could not join queue. Please try again.');
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
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">QR Code Required</h2>
          <p className="text-sm text-gray-500 mb-5">Scan the QR code at the business to join their queue.</p>
          <Link to="/" className="text-sm font-semibold text-violet-600">Back to Home</Link>
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
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Shop Not Found</h2>
          <p className="text-sm text-gray-500 mb-5">This QR code doesn't match any active shop.</p>
          <Link to="/search" className="text-sm font-semibold text-violet-600">Browse shops</Link>
        </div>
      </div>
    );
  }

  if (!shop) {
    const spinnerBg = native ? '#070b14' : '#f8f7ff';
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
      <div className="min-h-screen bg-[#f8f7ff]">
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="font-pacifico text-lg text-blue-600" style={{ textDecoration: 'none' }}>wavit</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500 font-medium truncate">{shop.name}</span>
        </div>
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
            <svg className="w-9 h-9 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Queue is Closed</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-2"><strong>{shop.name}</strong> is not accepting new customers right now.</p>
          {shop.openingTime && <p className="text-sm text-violet-600 font-semibold mb-6">Opens at {shop.openingTime}</p>}
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors">Find Another Shop</Link>
        </div>
      </div>
    );
  }

  if (shop.allowRemoteJoin === false) {
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
      <div className="min-h-screen bg-[#f8f7ff]">
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="font-pacifico text-lg text-blue-600" style={{ textDecoration: 'none' }}>wavit</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500 font-medium truncate">{shop.name}</span>
        </div>
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-5">
            <svg className="w-9 h-9 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Visit the Shop to Join</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6"><strong>{shop.name}</strong> requires you to be physically present at the shop to join their queue.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors">Find Another Shop</Link>
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
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#f0f4ff', marginBottom: '4px', letterSpacing: '-0.3px' }}>Join the Queue</h2>
            <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)', marginBottom: '20px' }}>We'll text you when your turn is approaching.</p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Full Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  autoComplete="name" autoFocus
                  style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff', fontSize: '15px', fontWeight: 500, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
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

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-pacifico text-lg text-blue-600" style={{ textDecoration: 'none' }}>wavit</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 font-medium truncate">{shop.name}</span>
      </div>
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-violet-700">{shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-gray-900 truncate">{shop.name}</h1>
            <p className="text-sm text-gray-400">{shop.category}{shop.zipCode && <span> · ZIP {shop.zipCode}</span>}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {waitRange && <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg">{waitRange} wait</span>}
              {activeQueue.length > 0 && <span className="text-xs text-gray-400">{activeQueue.length} in line</span>}
            </div>
          </div>
        </div>
        {isPastClosingTime(shop.closingTime || '17:00') && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            <p className="text-xs text-orange-700 font-medium leading-relaxed">This business may not be open right now — normal hours end at {shop.closingTime}. You can still join if the queue is active.</p>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Join the Queue</h2>
            <p className="text-sm text-gray-400 mb-6">We'll text you when your turn is approaching.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white transition-all font-medium placeholder:font-normal placeholder:text-gray-400" autoFocus autoComplete="name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Phone Number</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-violet-400/30 focus-within:border-violet-400 focus-within:bg-white transition-all">
                  <span className="pl-4 pr-2 text-sm font-semibold text-gray-500 select-none">+1</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="2025551234" className="flex-1 pr-4 py-3.5 text-sm bg-transparent focus:outline-none font-medium placeholder:font-normal placeholder:text-gray-400" autoComplete="tel-national" maxLength={10} />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2.5 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}
              <button type="submit" disabled={joining} className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-violet-400/25 active:scale-[0.98] mt-1">
                {joining ? 'Joining...' : 'Join Queue'}
              </button>
            </form>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              Your number is only used for queue notifications. We never share it.
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">By joining this queue you agree to our{' '}<Link to="/terms" className="text-violet-500 hover:underline font-semibold">Terms</Link>{' '}and{' '}<Link to="/privacy" className="text-violet-500 hover:underline font-semibold">Privacy Policy</Link>.{' '}Reply <strong>STOP</strong> to any SMS to unsubscribe.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
