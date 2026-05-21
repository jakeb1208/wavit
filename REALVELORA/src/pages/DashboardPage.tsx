import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import { ApiShop } from '../store/queueStore';
import ToastContainer from '../components/Toast';
import { Ticket } from '../types';

interface TicketResult {
  ticket: Ticket;
  position: number;
  myWaitMs: number;
  fetchedAt: number;
  shop: ApiShop;
}

const BG = '#070b14';
const GLASS = 'rgba(255,255,255,0.05)';
const GLASS_STRONG = 'rgba(255,255,255,0.08)';
const BORDER = 'rgba(255,255,255,0.08)';

function DarkSpinner({ label }: { label?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', width: '44px', height: '44px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#3b82f6', borderRightColor: '#8b5cf6', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
      {label && <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>{label}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { shopId, ticketId } = useParams<{ shopId: string; ticketId: string }>();
  const navigate = useNavigate();
  const getTicketFromApi = useQueueStore(s => s.getTicketFromApi);
  const signOut = useQueueStore(s => s.signOut);
  const replyExit = useQueueStore(s => s.replyExit);

  const [result, setResult] = useState<TicketResult | null | undefined>(undefined);
  const [now, setNow] = useState(Date.now());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const consecutiveErrors = useRef(0);

  const fetchTicket = useCallback(async () => {
    if (!shopId || !ticketId) return;
    const data = await getTicketFromApi(shopId, ticketId);
    if (data) {
      consecutiveErrors.current = 0;
      setResult({ ...data, fetchedAt: Date.now() });
    } else if (data === null) {
      // Genuine 404 — ticket doesn't exist
      consecutiveErrors.current = 0;
      setResult(null);
    } else {
      // undefined = transient error; keep last known state but count failures
      consecutiveErrors.current += 1;
      // After 5 consecutive failures (~15 s) stop the loading spinner
      if (consecutiveErrors.current >= 5) {
        setResult(prev => prev === undefined ? null : prev);
      }
    }
  }, [shopId, ticketId, getTicketFromApi]);

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 3000);
    return () => clearInterval(interval);
  }, [fetchTicket]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (shopId && ticketId) { await signOut(shopId, ticketId); navigate('/'); }
  }, [shopId, ticketId, signOut, navigate]);

  const handleReplyExit = useCallback(async () => {
    if (shopId && ticketId) { await replyExit(shopId, ticketId); navigate('/'); }
  }, [shopId, ticketId, replyExit, navigate]);

  if (result === undefined) return <DarkSpinner label="Loading your spot…" />;

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
        <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '40px', maxWidth: '340px', width: '100%', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px' }}>Ticket Not Found</h2>
          <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>This ticket may have expired or already been removed.</p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '9999px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}>
            Back to Home
          </Link>
        </div>
        {ticketId && <ToastContainer ticketId={ticketId} />}
      </div>
    );
  }

  const { ticket, position, shop } = result;

  if (ticket.exitedAt) {
    const wasServed = !!ticket.servedAt;
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
        <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: `radial-gradient(circle, ${wasServed ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.12)'} 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '40px', maxWidth: '360px', width: '100%', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '64px', height: '64px', background: wasServed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)', border: `1px solid ${wasServed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: wasServed ? '0 0 24px rgba(16,185,129,0.2)' : '0 0 24px rgba(239,68,68,0.15)' }}>
            {wasServed ? (
              <svg width="26" height="26" fill="none" stroke="#34d399" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg width="26" height="26" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f0f4ff', marginBottom: '10px' }}>
            {wasServed ? 'Thanks for visiting!' : 'You left the queue'}
          </h2>
          <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.65 }}>
            {wasServed ? `Hope to see you again at ${shop.name}.` : `Your spot at ${shop.name} has been released.`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '9999px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}>Back to Home</Link>
            <Link to="/search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 24px', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '9999px', color: 'rgba(203,213,225,0.85)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>Browse Shops</Link>
          </div>
        </div>
      </div>
    );
  }

  const isBeingServed = ticket.servedAt && !ticket.exitedAt;
  const waitingForExit = ticket.reminderSentAt && !ticket.exitedAt;
  const avgMs = shop.avgServiceMinutes * 60 * 1000;

  const etaMs = isBeingServed ? 0 : Math.max(0, result.myWaitMs - (now - result.fetchedAt));
  const etaMinutes = Math.ceil(etaMs / 60000);
  const etaStr = isBeingServed
    ? "It's your turn!"
    : etaMinutes > 0
      ? `${Math.floor(etaMinutes / 60) > 0 ? `${Math.floor(etaMinutes / 60)}h ` : ''}${etaMinutes % 60}m`
      : 'Less than 1 min';

  let serviceProgress = 0;
  let serviceRemaining = '';
  if (isBeingServed && ticket.servedAt) {
    const serviceElapsed = now - ticket.servedAt;
    serviceProgress = Math.min(100, (serviceElapsed / avgMs) * 100);
    const serviceRemainingMs = Math.max(0, avgMs - serviceElapsed);
    const serviceRemainingMin = Math.ceil(serviceRemainingMs / 60000);
    serviceRemaining = serviceRemainingMin > 0 ? `~${serviceRemainingMin} min remaining` : 'Almost done!';
  }

  const timeSinceJoined = now - ticket.joinedAt;
  const joinedStr = timeSinceJoined < 60000 ? 'Just now'
    : timeSinceJoined < 3600000 ? `${Math.floor(timeSinceJoined / 60000)}m ago`
    : `${Math.floor(timeSinceJoined / 3600000)}h ${Math.floor((timeSinceJoined % 3600000) / 60000)}m ago`;

  const isNext = position === 1 && shop.currentServiceStartedAt && !isBeingServed;

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatCountdown = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  void formatCountdown;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#f0f4ff', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '30%', right: '-15%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '20%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {ticketId && <ToastContainer ticketId={ticketId} />}

      {/* Animated styles */}
      <style>{`
        @keyframes db-spin { to { transform: rotate(360deg); } }
        @keyframes db-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          70%  { box-shadow: 0 0 0 20px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        @keyframes db-pulse-green {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          70%  { box-shadow: 0 0 0 22px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        @keyframes db-pulse-amber {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.6); }
          70%  { box-shadow: 0 0 0 22px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        @keyframes db-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes db-live-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes db-number-in {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        .db-fade-up     { animation: db-fade-up 0.4s ease-out both; }
        .db-pulse-ring  { animation: db-pulse-ring 2.2s ease-in-out infinite; }
        .db-pulse-green { animation: db-pulse-green 2s ease-in-out infinite; }
        .db-pulse-amber { animation: db-pulse-amber 1.6s ease-in-out infinite; }
        .db-live-dot    { animation: db-live-dot 1.8s ease-in-out infinite; }
        .db-number-in   { animation: db-number-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(7,11,20,0.7)', backdropFilter: 'blur(20px)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Pacifico, cursive', fontSize: '22px', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            wavit
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="db-live-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>LIVE</span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(148,163,184,0.5)', marginLeft: '8px', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '8px', letterSpacing: '0.05em' }}>
            #{ticket.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '20px 16px 40px', position: 'relative', zIndex: 1 }}>

        {/* Shop info */}
        <div className="db-fade-up" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '16px 20px', marginBottom: '14px', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animationDelay: '0.05s' }}>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f4ff', marginBottom: '3px' }}>{shop.name}</h1>
            <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)' }}>{shop.category} · Joined {joinedStr}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', marginBottom: '2px' }}>Avg service</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa' }}>{shop.avgServiceMinutes} min</p>
          </div>
        </div>

        {/* Main status card */}
        {isBeingServed ? (
          <div className="db-fade-up db-pulse-green" style={{ borderRadius: '24px', padding: '36px 28px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(5,150,105,0.35) 0%, rgba(16,185,129,0.2) 100%)', border: '1px solid rgba(16,185,129,0.35)', backdropFilter: 'blur(20px)', marginBottom: '14px', boxShadow: '0 0 60px rgba(16,185,129,0.2)', animationDelay: '0.1s' }}>
            <div style={{ width: '72px', height: '72px', background: 'rgba(16,185,129,0.2)', border: '2px solid rgba(16,185,129,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
              <svg width="32" height="32" fill="none" stroke="#34d399" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(52,211,153,0.7)', marginBottom: '8px', textTransform: 'uppercase' }}>Being Served</p>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#34d399', marginBottom: '8px', letterSpacing: '-0.02em' }}>It's Your Turn!</h2>
            {serviceProgress > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', height: '6px', marginBottom: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${serviceProgress}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '9999px', transition: 'width 1s ease', boxShadow: '0 0 8px rgba(52,211,153,0.6)' }} />
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(52,211,153,0.7)', fontWeight: 600 }}>{serviceRemaining}</p>
              </div>
            )}
          </div>
        ) : isNext ? (
          <div className="db-fade-up db-pulse-amber" style={{ borderRadius: '24px', padding: '36px 28px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(180,83,9,0.35) 0%, rgba(245,158,11,0.2) 100%)', border: '1px solid rgba(245,158,11,0.4)', backdropFilter: 'blur(20px)', marginBottom: '14px', boxShadow: '0 0 60px rgba(245,158,11,0.2)', animationDelay: '0.1s' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(251,191,36,0.7)', marginBottom: '10px', textTransform: 'uppercase' }}>Queue Position</p>
            <div className="db-number-in" style={{ fontSize: '80px', fontWeight: 900, color: '#fbbf24', lineHeight: 1, marginBottom: '8px', letterSpacing: '-0.04em', textShadow: '0 0 40px rgba(251,191,36,0.5)' }}>1st</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', marginBottom: '6px' }}>You're Next!</h2>
          </div>
        ) : (
          <div className="db-fade-up db-pulse-ring" style={{ borderRadius: '24px', padding: '36px 28px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(109,40,217,0.2) 100%)', border: '1px solid rgba(99,130,255,0.3)', backdropFilter: 'blur(20px)', marginBottom: '14px', boxShadow: '0 0 50px rgba(59,130,246,0.18)', animationDelay: '0.1s' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(147,197,253,0.6)', marginBottom: '12px', textTransform: 'uppercase' }}>Your Queue Position</p>
            <div className="db-number-in" style={{ fontSize: '88px', fontWeight: 900, lineHeight: 1, marginBottom: '6px', letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #fff 0%, rgba(147,197,253,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.4))' }}>
              {ordinal(position)}
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(147,197,253,0.65)', fontWeight: 500 }}>
              {Math.max(0, position - 1)} {position - 1 === 1 ? 'person' : 'people'} ahead of you
            </p>
          </div>
        )}

        {/* Sign out button when being served */}
        {isBeingServed && !waitingForExit && (
          <button
            onClick={handleSignOut}
            className="db-fade-up"
            style={{ width: '100%', padding: '16px', marginBottom: '14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', color: '#34d399', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: "'Inter', sans-serif", animationDelay: '0.2s' }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(16,185,129,0.25)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(16,185,129,0.15)'; }}
          >
            ✓ I'm Done — Sign Out
          </button>
        )}

        {/* Reminder / still-there warning */}
        {waitingForExit && (
          <div className="db-fade-up" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '20px', marginBottom: '14px', backdropFilter: 'blur(16px)', animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="#fbbf24" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '6px', fontSize: '15px' }}>Still there?</h3>
                <p style={{ fontSize: '13px', color: 'rgba(251,191,36,0.75)', lineHeight: 1.6, marginBottom: '16px' }}>
                  We texted you asking if you're still at {shop.name}. You'll be auto-removed in 5 min without a reply.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleReplyExit} style={{ flex: 1, padding: '12px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '12px', color: '#fbbf24', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Leave Queue</button>
                  <button onClick={handleSignOut} style={{ flex: 1, padding: '12px', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', color: '#f0f4ff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>I'm Done</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue details */}
        {!isBeingServed && (
          <div className="db-fade-up" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '20px', marginBottom: '14px', backdropFilter: 'blur(16px)', animationDelay: '0.18s' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Queue Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { label: 'Your position',  value: `#${position}`,     color: '#a78bfa' },
                { label: 'People ahead',   value: `${Math.max(0, position - 1)}`, color: '#f0f4ff' },
                { label: 'Estimated wait', value: etaStr,             color: '#60a5fa' },
                { label: 'Total in queue', value: `${(shop.queue ?? []).filter((t: any) => !t.exitedAt).length}`, color: '#f0f4ff' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)' }}>{row.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live indicator */}
        <div className="db-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px', animationDelay: '0.22s' }}>
          <div className="db-live-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
          <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>Updating every 3 seconds · keep this page open</p>
        </div>

        {/* Leave queue */}
        {!isBeingServed && (
          <button
            className="db-fade-up"
            onClick={() => setShowExitConfirm(true)}
            style={{ width: '100%', padding: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', color: '#f87171', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s ease', animationDelay: '0.25s' }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.14)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
          >
            Leave Queue
          </button>
        )}
      </div>

      {/* Exit confirm modal */}
      {showExitConfirm && (
        <div
          onClick={() => setShowExitConfirm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(8px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="db-fade-up"
            style={{ background: 'rgba(15,20,35,0.98)', border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '400px', backdropFilter: 'blur(24px)', boxShadow: '0 -4px 60px rgba(0,0,0,0.5)' }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px' }}>Leave the queue?</h3>
            <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.7)', marginBottom: '24px', lineHeight: 1.6 }}>
              You'll lose your spot at {shop.name}. This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{ flex: 1, padding: '14px', background: GLASS_STRONG, border: `1px solid ${BORDER}`, borderRadius: '14px', color: '#f0f4ff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >Stay</button>
              <button
                onClick={handleSignOut}
                style={{ flex: 1, padding: '14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', color: '#f87171', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
